from django.urls import path

from .views import CaseDocumentListCreateView

urlpatterns = [
    path(
        "cases/<int:case_id>/documents/",
        CaseDocumentListCreateView.as_view(),
        name="case-documents",
    ),
]
