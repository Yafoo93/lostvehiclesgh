from rest_framework import serializers
from .models import Case, SightingReport
from vehicles.models import Vehicle
class PublicVehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = [
            "plate_number",
            "vin",
            "engine_number",
            "make",
            "model",
            "year",
            "color",
        ]

class CaseSerializer(serializers.ModelSerializer):
    vehicle_id = serializers.PrimaryKeyRelatedField(
        queryset=Vehicle.objects.none(),
        source="vehicle",
        write_only=True,
    )

    class Meta:
        model = Case
        fields = [
            "id",
            "vehicle",
            "vehicle_id",
            "reporter",
            "status",
            "police_station",
            "police_case_number",
            "incident_date",
            "last_seen_location_text",
            "description",
            "allow_public_contact",
            "recovery_requested_at",
            "recovery_date",
            "recovery_location",
            "recovery_circumstances",
            "recovery_vehicle_condition",
            "recovery_additional_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "vehicle",
            "reporter",
            "status",
            "recovery_requested_at",
            "recovery_date",
            "recovery_location",
            "recovery_circumstances",
            "recovery_vehicle_condition",
            "recovery_additional_notes",
            "created_at",
            "updated_at",
        ]

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if not user or not user.is_authenticated:
            fields["vehicle_id"].queryset = Vehicle.objects.none()
        elif user.is_moderator or user.is_admin:
            fields["vehicle_id"].queryset = Vehicle.objects.all()
        else:
            fields["vehicle_id"].queryset = Vehicle.objects.filter(owner=user)

        return fields

    def validate_vehicle_id(self, value):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if not user or not user.is_authenticated:
            raise serializers.ValidationError("Authentication is required.")

        if user.is_moderator or user.is_admin:
            return value

        if value.owner_id != user.id:
            raise serializers.ValidationError(
                "You can only create a case for a vehicle you own."
            )

        return value

    def create(self, validated_data):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        validated_data["reporter"] = user

        if not (user and (user.is_moderator or user.is_admin)):
            validated_data["status"] = Case.Status.PENDING

        return super().create(validated_data)

    def validate_status(self, value):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if not getattr(self, "instance", None):
            return value

        if value != self.instance.status:
            if not user or not (user.is_moderator or user.is_admin):
                raise serializers.ValidationError(
                    "Only moderators or admins can change case status."
                )

        return value

class PublicVehicleStatusSerializer(serializers.Serializer):
    """
    Serializer for public vehicle status check.
    We expose only the minimum case details needed for safe recovery action.
    """

    found = serializers.BooleanField()
    has_verified_stolen_case = serializers.BooleanField()
    latest_status = serializers.CharField(allow_null=True)
    vehicle = PublicVehicleSerializer(allow_null=True)
    case_id = serializers.IntegerField(allow_null=True)
    reporter_name = serializers.CharField(allow_null=True)
    reported_at = serializers.DateTimeField(allow_null=True)
    last_updated = serializers.DateTimeField(allow_null=True)
    police_station = serializers.CharField(allow_null=True)
    description = serializers.CharField(allow_null=True)
    
class RecoveryRequestSerializer(serializers.Serializer):
    recovery_date = serializers.DateField()
    recovery_location = serializers.CharField(max_length=255)
    recovery_circumstances = serializers.CharField()
    recovery_vehicle_condition = serializers.CharField()
    recovery_additional_notes = serializers.CharField(
        required=False,
        allow_blank=True,
    )
    
class SightingReportCreateSerializer(serializers.Serializer):
    reporter_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    reporter_phone = serializers.CharField(max_length=50, required=False, allow_blank=True)
    reporter_email = serializers.EmailField(required=False, allow_blank=True)
    message = serializers.CharField()
    location = serializers.CharField(max_length=255)


class SightingReportResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()
    sighting_id = serializers.IntegerField()
    owner_phone = serializers.CharField(allow_null=True)
    contact_shared = serializers.BooleanField()    
    
class RevealContactResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()
    owner_phone = serializers.CharField(allow_null=True)
    contact_shared = serializers.BooleanField()
    
class SightingReportReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = SightingReport
        fields = [
            "id",
            "reporter_name",
            "reporter_phone",
            "reporter_email",
            "message",
            "location",
            "contact_revealed",
            "contact_revealed_at",
            "created_at",
        ]