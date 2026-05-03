from django.urls import path

from .views import CaseDocumentListCreateView, DocumentDownloadView

urlpatterns = [
    path(
        "cases/<int:case_id>/documents/",
        CaseDocumentListCreateView.as_view(),
        name="case-documents",
    ),
    path(
        "documents/<int:document_id>/download/",
        DocumentDownloadView.as_view(),
        name="document-download",
    ),
]
