from django.http import FileResponse
from django.shortcuts import get_object_or_404

from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView

from cases.models import Case
from .models import Document
from .serializers import DocumentSerializer


def check_document_case_permission(user, case: Case):
    role = getattr(user, "role", None)

    if role in ("MODERATOR", "ADMIN"):
        return

    if case.reporter_id != user.id:
        raise PermissionDenied("You do not have permission to access documents for this case.")


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
        check_document_case_permission(self.request.user, case)

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


class DocumentDownloadView(APIView):
    """
    GET /api/documents/<document_id>/download/

    Streams a private document only after checking case access.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, document_id):
        document = get_object_or_404(
            Document.objects.select_related("case", "case__reporter"),
            pk=document_id,
        )
        check_document_case_permission(request.user, document.case)

        if not document.file:
            raise PermissionDenied("Document file is unavailable.")

        filename = document.original_filename or document.file.name.rsplit("/", 1)[-1]
        response = FileResponse(
            document.file.open("rb"),
            content_type=document.content_type or "application/octet-stream",
            as_attachment=False,
            filename=filename,
        )
        response["X-Content-Type-Options"] = "nosniff"
        response["Cache-Control"] = "private, no-store"
        return response
