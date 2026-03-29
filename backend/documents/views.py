from django.shortcuts import get_object_or_404

from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied

from cases.models import Case
from .models import Document
from .serializers import DocumentSerializer


class CaseDocumentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/cases/<case_id>/documents/  -> list docs for a case
    POST /api/cases/<case_id>/documents/  -> upload new doc for a case

    Only:
      - the case reporter, or
      - moderators/admins
    are allowed to access.
    """

    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_case(self) -> Case:
        case_id = self.kwargs.get("case_id")
        case = get_object_or_404(
            Case.objects.select_related("reporter"),
            pk=case_id,
        )
        return case

    def check_case_permission(self, case: Case):
        user = self.request.user
        role = getattr(user, "role", None)

        # Moderators/Admins have full access
        if role in ("MODERATOR", "ADMIN"):
            return

        # Otherwise, only the reporter can access
        if case.reporter_id != user.id:
            raise PermissionDenied("You do not have permission to access documents for this case.")

    def get_queryset(self):
        case = self.get_case()
        self.check_case_permission(case)
        return Document.objects.filter(case=case).order_by("-created_at")

    def perform_create(self, serializer):
        case = self.get_case()
        self.check_case_permission(case)

        # For now, we always mark documents as private.
        serializer.save(
            case=case,
            is_private=True,
        )
