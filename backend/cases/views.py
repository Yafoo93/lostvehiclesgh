from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from .models import Case
from .permissions import IsOwnerOrModeratorOrReadOnly
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from vehicles.models import Vehicle
from documents.models import Document
from .serializers import (
    CaseSerializer,
    CaseRejectSerializer,
    ModeratorNotesSerializer,
    MoreInfoRequestSerializer,
    PublicVehicleStatusSerializer,
    RecoveryRequestSerializer,
    RecoveryRejectSerializer,
    SightingReportCreateSerializer,
    SightingReportResponseSerializer,
    RevealContactResponseSerializer,
    SightingReportReadSerializer,
    SuspiciousFlagSerializer,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework import status as drf_status, filters as drf_filters
from accounts.permissions import IsModeratorOrAdmin
from rest_framework.throttling import ScopedRateThrottle
from core.utils import log_activity
from core.models import ActivityLog
from .models import SightingReport
from django.utils import timezone




class CaseViewSet(viewsets.ModelViewSet):
    queryset = (
        Case.objects.select_related("vehicle", "reporter")
        .all()
        .order_by("-created_at")
    )
    serializer_class = CaseSerializer
    permission_classes = [IsOwnerOrModeratorOrReadOnly]
    filter_backends = [drf_filters.OrderingFilter]
    ordering_fields = ["created_at", "incident_date"]
 
 
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = None
    
    
    def get_throttles(self):
        if self.action == "create":
            self.throttle_scope = "case_create"
        elif self.action == "report_sighting":
            self.throttle_scope = "report_sighting"
        elif self.action == "reveal_contact":
            self.throttle_scope = "reveal_contact"
        else:
            self.throttle_scope = None

        return super().get_throttles()

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if self.action in ["report_sighting", "reveal_contact"]:
            return queryset.filter(status=Case.Status.VERIFIED_STOLEN)

        if not user.is_authenticated:
            return Case.objects.none()

        role = getattr(user, "role", None)
        if role in ("MODERATOR", "ADMIN"):
            filtered_queryset = queryset
        else:
            filtered_queryset = queryset.filter(reporter=user)

        status_param = self.request.query_params.get("status")
        if status_param:
            filtered_queryset = filtered_queryset.filter(status=status_param)

        return filtered_queryset

    def require_police_extract(self, case):
        has_police_extract = case.documents.filter(
            doc_type=Document.DocumentType.POLICE_EXTRACT,
        ).exists()

        if not has_police_extract:
            return Response(
                {
                    "detail": (
                        "A police extract must be uploaded before this case can "
                        "receive a final moderation decision."
                    )
                },
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        return None
        
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsModeratorOrAdmin],
        url_path="verify-stolen",
    )
    def verify_stolen(self, request, pk=None):
        case = self.get_object()

        missing_extract_response = self.require_police_extract(case)
        if missing_extract_response is not None:
            return missing_extract_response

        if case.status == Case.Status.VERIFIED_STOLEN:
            return Response(
                {"detail": "Case is already marked as verified stolen."},
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        previous_status = case.status

        case.status = Case.Status.VERIFIED_STOLEN
        case.moderated_by = request.user
        case.moderated_at = timezone.now()
        case.rejection_reason = None
        case.more_info_request_note = None
        case.more_info_requested_at = None
        case.save(
            update_fields=[
                "status",
                "moderated_by",
                "moderated_at",
                "rejection_reason",
                "more_info_request_note",
                "more_info_requested_at",
                "updated_at",
            ]
        )
        
          # 👇 LOG ACTIVITY
        log_activity(
            user=request.user,
            action=ActivityLog.ActionType.CHANGE_CASE_STATUS,
            description=f"Case status changed from {previous_status} to {case.status}.",
            target=case,
            request=request,
        )
        
        serializer = self.get_serializer(case)
        return Response(serializer.data, status=drf_status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsModeratorOrAdmin],
        url_path="mark-recovered",
    )
    def mark_recovered(self, request, pk=None):
        case = self.get_object()

        if case.status == Case.Status.RECOVERED:
            return Response(
                {"detail": "Case is already marked as recovered."},
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        if case.recovery_requested_at is None:
            return Response(
                {
                    "detail": (
                        "This case cannot be marked as recovered yet. "
                        "The owner must submit a recovery request first."
                    )
                },
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        previous_status = case.status

        case.status = Case.Status.RECOVERED
        case.recovery_reviewed_at = timezone.now()
        case.recovery_rejected_at = None
        case.recovery_rejection_note = None
        case.moderated_by = request.user
        case.moderated_at = timezone.now()
        case.save(
            update_fields=[
                "status",
                "recovery_reviewed_at",
                "recovery_rejected_at",
                "recovery_rejection_note",
                "moderated_by",
                "moderated_at",
                "updated_at",
            ]
        )

        log_activity(
            user=request.user,
            action=ActivityLog.ActionType.CHANGE_CASE_STATUS,
            description=(
                f"Case status changed from {previous_status} to {case.status}. "
                f"Recovery request had been submitted at {case.recovery_requested_at}."
            ),
            target=case,
            request=request,
        )

        serializer = self.get_serializer(case)
        return Response(serializer.data, status=drf_status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsModeratorOrAdmin],
        url_path="reject-recovery",
    )
    def reject_recovery(self, request, pk=None):
        case = self.get_object()

        if case.recovery_requested_at is None:
            return Response(
                {"detail": "There is no submitted recovery request for this case."},
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        if case.status != Case.Status.VERIFIED_STOLEN:
            return Response(
                {
                    "detail": (
                        "Recovery rejection is only valid while the case remains "
                        "in verified stolen status."
                    )
                },
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        serializer = RecoveryRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        case.recovery_reviewed_at = timezone.now()
        case.recovery_rejected_at = timezone.now()
        case.recovery_rejection_note = serializer.validated_data["recovery_rejection_note"]
        case.moderated_by = request.user
        case.moderated_at = timezone.now()
        case.save(
            update_fields=[
                "recovery_reviewed_at",
                "recovery_rejected_at",
                "recovery_rejection_note",
                "moderated_by",
                "moderated_at",
                "updated_at",
            ]
        )

        log_activity(
            user=request.user,
            action=ActivityLog.ActionType.UPDATE_CASE,
            description=(
                f"Recovery request rejected for Case #{case.id}. "
                f"Reason: {case.recovery_rejection_note}"
            ),
            target=case,
            request=request,
        )

        response_serializer = self.get_serializer(case)
        return Response(response_serializer.data, status=drf_status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsModeratorOrAdmin],
        url_path="reject",
    )
    def reject(self, request, pk=None):
        case = self.get_object()

        missing_extract_response = self.require_police_extract(case)
        if missing_extract_response is not None:
            return missing_extract_response

        if case.status == Case.Status.REJECTED:
            return Response(
                {"detail": "Case is already rejected."},
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        previous_status = case.status

        serializer = CaseRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        case.status = Case.Status.REJECTED
        case.rejection_reason = serializer.validated_data["rejection_reason"]
        case.moderated_by = request.user
        case.moderated_at = timezone.now()
        case.save(
            update_fields=[
                "status",
                "rejection_reason",
                "moderated_by",
                "moderated_at",
                "updated_at",
            ]
        )
        
        log_activity(
            user=request.user,
            action=ActivityLog.ActionType.CHANGE_CASE_STATUS,
            description=(
                f"Case status changed from {previous_status} to {case.status}. "
                f"Reason: {case.rejection_reason}"
            ),
            target=case,
            request=request,
        )
        
        serializer = self.get_serializer(case)
        return Response(serializer.data, status=drf_status.HTTP_200_OK)  

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsModeratorOrAdmin],
        url_path="request-more-info",
    )
    def request_more_info(self, request, pk=None):
        case = self.get_object()

        if case.status in (Case.Status.REJECTED, Case.Status.RECOVERED):
            return Response(
                {"detail": "More information cannot be requested for this case status."},
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        serializer = MoreInfoRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        previous_status = case.status
        case.status = Case.Status.NEEDS_INFO
        case.more_info_requested_at = timezone.now()
        case.more_info_request_note = serializer.validated_data["more_info_request_note"]
        case.moderated_by = request.user
        case.moderated_at = timezone.now()
        case.save(
            update_fields=[
                "status",
                "more_info_requested_at",
                "more_info_request_note",
                "moderated_by",
                "moderated_at",
                "updated_at",
            ]
        )

        log_activity(
            user=request.user,
            action=ActivityLog.ActionType.CHANGE_CASE_STATUS,
            description=(
                f"Case status changed from {previous_status} to {case.status}. "
                f"Requested info: {case.more_info_request_note}"
            ),
            target=case,
            request=request,
        )

        response_serializer = self.get_serializer(case)
        return Response(response_serializer.data, status=drf_status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsModeratorOrAdmin],
        url_path="moderator-notes",
    )
    def update_moderator_notes(self, request, pk=None):
        case = self.get_object()
        serializer = ModeratorNotesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        case.moderator_notes = serializer.validated_data["moderator_notes"]
        case.moderated_by = request.user
        case.moderated_at = timezone.now()
        case.save(
            update_fields=[
                "moderator_notes",
                "moderated_by",
                "moderated_at",
                "updated_at",
            ]
        )

        log_activity(
            user=request.user,
            action=ActivityLog.ActionType.UPDATE_CASE,
            description=f"Moderator notes updated for Case #{case.id}.",
            target=case,
            request=request,
        )

        response_serializer = self.get_serializer(case)
        return Response(response_serializer.data, status=drf_status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsModeratorOrAdmin],
        url_path="flag-suspicious",
    )
    def flag_suspicious(self, request, pk=None):
        case = self.get_object()
        serializer = SuspiciousFlagSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        case.suspicious_flag = serializer.validated_data["suspicious_flag"]
        case.suspicious_flag_reason = serializer.validated_data.get(
            "suspicious_flag_reason",
            "",
        )
        case.moderated_by = request.user
        case.moderated_at = timezone.now()
        case.save(
            update_fields=[
                "suspicious_flag",
                "suspicious_flag_reason",
                "moderated_by",
                "moderated_at",
                "updated_at",
            ]
        )

        log_activity(
            user=request.user,
            action=ActivityLog.ActionType.UPDATE_CASE,
            description=(
                f"Suspicious/fraud flag set to {case.suspicious_flag} for Case #{case.id}. "
                f"Reason: {case.suspicious_flag_reason}"
            ),
            target=case,
            request=request,
        )

        response_serializer = self.get_serializer(case)
        return Response(response_serializer.data, status=drf_status.HTTP_200_OK)
    
    
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated],
        url_path="request-recovery",
    )
    def request_recovery(self, request, pk=None):
        case = get_object_or_404(
            Case.objects.select_related("reporter", "vehicle"),
            pk=pk,
        )

        if case.reporter_id != request.user.id:
            return Response(
                {"detail": "Only the case owner can submit a recovery request."},
                status=drf_status.HTTP_403_FORBIDDEN,
            )

        if case.status != Case.Status.VERIFIED_STOLEN:
            return Response(
                {"detail": "Recovery requests can only be submitted for verified stolen cases."},
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        if case.recovery_requested_at is not None:
            return Response(
                {"detail": "A recovery request has already been submitted for this case."},
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        serializer = RecoveryRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        case.recovery_requested_at = timezone.now()
        case.recovery_date = serializer.validated_data["recovery_date"]
        case.recovery_location = serializer.validated_data["recovery_location"]
        case.recovery_circumstances = serializer.validated_data["recovery_circumstances"]
        case.recovery_vehicle_condition = serializer.validated_data["recovery_vehicle_condition"]
        case.recovery_additional_notes = serializer.validated_data.get(
            "recovery_additional_notes",
            "",
        )
        case.save(
            update_fields=[
                "recovery_requested_at",
                "recovery_date",
                "recovery_location",
                "recovery_circumstances",
                "recovery_vehicle_condition",
                "recovery_additional_notes",
                "updated_at",
            ]
        )

        log_activity(
            user=request.user,
            action=ActivityLog.ActionType.UPDATE_CASE,
            description=(
                f"Recovery request submitted for Case #{case.id} "
                f"with recovery date {case.recovery_date}."
            ),
            target=case,
            request=request,
        )

        return Response(
            {
                "detail": "Recovery request submitted successfully. Awaiting moderator confirmation.",
                "case_id": case.id,
                "recovery_requested_at": case.recovery_requested_at,
            },
            status=drf_status.HTTP_200_OK,
        )
    
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[AllowAny],
        authentication_classes=[],
        throttle_classes=[ScopedRateThrottle],
        url_path="report-sighting",
    )
    def report_sighting(self, request, pk=None):
        case = self.get_object()

        if case.status != Case.Status.VERIFIED_STOLEN:
            return Response(
                {"detail": "Sighting reports can only be submitted for verified stolen cases."},
                status=drf_status.HTTP_400_BAD_REQUEST,
            )
    
        serializer = SightingReportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        sighting = SightingReport(
            case=case,
            reporter_name=serializer.validated_data.get("reporter_name", ""),
            reporter_phone=serializer.validated_data.get("reporter_phone", ""),
            reporter_email=serializer.validated_data.get("reporter_email", ""),
            message=serializer.validated_data["message"],
            location=serializer.validated_data["location"],
        )

        try:
            sighting.full_clean()
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        sighting.save()

        owner_phone = None
        contact_shared = False

        if case.allow_public_contact:
            owner_phone = getattr(case.reporter, "phone", None)
            contact_shared = bool(owner_phone)

            if contact_shared:
                update_fields = []

                if not sighting.contact_revealed:
                    sighting.contact_revealed = True
                    update_fields.append("contact_revealed")

                if sighting.contact_revealed_at is None:
                    sighting.contact_revealed_at = timezone.now()
                    update_fields.append("contact_revealed_at")

                if update_fields:
                    sighting.save(update_fields=update_fields)
                
        #### Prepare notification payloads (for future use when we implement notifications)
        owner_notification_payload = {
            "case_id": case.id,
            "sighting_id": sighting.id,
            "vehicle": str(case.vehicle),
            "location": sighting.location,
            "message": sighting.message,
            "contact_shared": contact_shared,
        }

        moderator_notification_payload = {
            "case_id": case.id,
            "sighting_id": sighting.id,
            "status": case.status,
            "reporter_name": sighting.reporter_name,
            "reporter_phone": sighting.reporter_phone,
            "reporter_email": sighting.reporter_email,
            "location": sighting.location,
        }

        # TODO: send owner notification via email/SMS/in-app
        # TODO: send moderator notification via email/SMS/in-app
        
        print("OWNER NOTIFICATION:", owner_notification_payload)
        print("MODERATOR NOTIFICATION:", moderator_notification_payload)
        
        log_activity(
            user=None,
            action=ActivityLog.ActionType.UPDATE_CASE,
            description=(
                f"Sighting report #{sighting.id} submitted for Case #{case.id} "
                f"at location '{sighting.location}'. Contact shared: {contact_shared}."
            ),
            target=case,
            request=request,
        )

        response_serializer = SightingReportResponseSerializer({
            "detail": "Sighting report submitted successfully.",
            "sighting_id": sighting.id,
            "owner_phone": owner_phone if contact_shared else None,
            "contact_shared": contact_shared,
        })
        return Response(response_serializer.data, status=drf_status.HTTP_201_CREATED)
    
    @action(
        detail=True,
        methods=["post"],
        permission_classes=[AllowAny],
        authentication_classes=[],
        throttle_classes=[ScopedRateThrottle],
        url_path="reveal-contact",
    )
    def reveal_contact(self, request, pk=None):
        case = self.get_object()

        if case.status != Case.Status.VERIFIED_STOLEN:
            return Response(
                {"detail": "Contact can only be revealed for verified stolen cases."},
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        sighting_id = request.data.get("sighting_id")
        if not sighting_id:
            return Response(
                {"detail": "sighting_id is required."},
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        try:
            sighting = case.sightings.get(id=sighting_id)
        except case.sightings.model.DoesNotExist:
            return Response(
                {"detail": "Sighting report not found for this case."},
                status=drf_status.HTTP_404_NOT_FOUND,
            )

        owner_phone = None
        contact_shared = False

        if case.allow_public_contact:
            owner_phone = getattr(case.reporter, "phone", None)
            contact_shared = bool(owner_phone)

        if contact_shared:
            update_fields = []

            if not sighting.contact_revealed:
                sighting.contact_revealed = True
                update_fields.append("contact_revealed")

            if sighting.contact_revealed_at is None:
                sighting.contact_revealed_at = timezone.now()
                update_fields.append("contact_revealed_at")

            if update_fields:
                sighting.save(update_fields=update_fields)

        log_activity(
            user=None,
            action=ActivityLog.ActionType.UPDATE_CASE,
            description=(
                f"Owner contact reveal requested for Case #{case.id} "
                f"using SightingReport #{sighting.id}. Contact shared: {contact_shared}."
            ),
            target=case,
            request=request,
        )

        response_serializer = RevealContactResponseSerializer({
            "detail": "Contact reveal processed successfully.",
            "owner_phone": owner_phone,
            "contact_shared": contact_shared,
        })
        return Response(response_serializer.data, status=drf_status.HTTP_200_OK)
    
    @action(
    detail=True,
    methods=["get"],
    permission_classes=[IsOwnerOrModeratorOrReadOnly],
    url_path="sightings",
    )
    def list_sightings(self, request, pk=None):
        case = self.get_object()

        user = request.user
        role = getattr(user, "role", None)

        if role not in ("MODERATOR", "ADMIN") and case.reporter_id != user.id:
            return Response(
                {"detail": "You do not have permission to view sightings for this case."},
                status=drf_status.HTTP_403_FORBIDDEN,
            )

        sightings = case.sightings.all().order_by("-created_at")
        serializer = SightingReportReadSerializer(sightings, many=True)
        return Response(serializer.data, status=drf_status.HTTP_200_OK)

class PublicVehicleStatusView(APIView):
    """
    Public endpoint to check if a vehicle has any verified stolen case.

    Query params:
      - vin (optional)
      - engine_number (optional)

    At least one of the above must be provided.
    """

    authentication_classes = []         
    permission_classes = [AllowAny]             
    throttle_classes = [ScopedRateThrottle]  
    throttle_scope = "public_search"        

    def get(self, request, *args, **kwargs):
        vin = request.query_params.get("vin")
        engine_number = request.query_params.get("engine_number")

        if not any([vin, engine_number]):
            return Response(
                {"detail": "Provide at least one of: vin, engine_number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        vehicle_qs = Vehicle.objects.all()

        if vin:
            vin = vin.strip().upper()
            vehicle_qs = vehicle_qs.filter(vin__iexact=vin)

        if engine_number:
            engine_number = engine_number.strip().upper()
            vehicle_qs = vehicle_qs.filter(engine_number__iexact=engine_number)

        vehicle = vehicle_qs.first()

        if not vehicle:
            serializer = PublicVehicleStatusSerializer({
                "found": False,
                "has_verified_stolen_case": False,
                "latest_status": None,
                "case_id": None,
                "reporter_name": None,
                "reported_at": None,
                "last_updated": None,
                "police_station": None,
                "description": None,
                "vehicle": None,
            })
            return Response(serializer.data, status=status.HTTP_200_OK)

        public_cases = (
            Case.objects.select_related("reporter")
            .filter(
                vehicle=vehicle,
                status__in=[
                    Case.Status.VERIFIED_STOLEN,
                    Case.Status.RECOVERED,
                ],
            )
            .order_by("-created_at")
        )

        if not public_cases.exists():
            serializer = PublicVehicleStatusSerializer({
                "found": False,
                "has_verified_stolen_case": False,
                "latest_status": None,
                "case_id": None,
                "reporter_name": None,
                "reported_at": None,
                "last_updated": None,
                "police_station": None,
                "description": None,
                "vehicle": None,
            })
            return Response(serializer.data, status=status.HTTP_200_OK)

        latest_case = public_cases.first()
        has_verified_stolen = latest_case.status == Case.Status.VERIFIED_STOLEN

        reporter_name = None
        if latest_case.reporter_id:
            full_name = f"{latest_case.reporter.first_name} {latest_case.reporter.last_name}".strip()
            reporter_name = full_name or latest_case.reporter.username

        serializer = PublicVehicleStatusSerializer({
            "found": True,
            "has_verified_stolen_case": has_verified_stolen,
            "latest_status": latest_case.status,
            "case_id": latest_case.id,
            "reporter_name": reporter_name,
            "reported_at": latest_case.created_at,
            "last_updated": latest_case.updated_at,
            "police_station": latest_case.police_station,
            "description": latest_case.description,
            "vehicle": vehicle,
        })
        return Response(serializer.data, status=status.HTTP_200_OK)
