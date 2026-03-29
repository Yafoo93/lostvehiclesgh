from django.db import models

from cases.models import Case


class Document(models.Model):
    class DocumentType(models.TextChoices):
        POLICE_EXTRACT = "POLICE_EXTRACT", "Police Extract"
        VEHICLE_PHOTO = "VEHICLE_PHOTO", "Vehicle Photo"

    case = models.ForeignKey(
        Case,
        on_delete=models.CASCADE,
        related_name="documents",
        help_text="Case this document belongs to.",
    )

    doc_type = models.CharField(
        max_length=32,
        choices=DocumentType.choices,
        help_text="Type of document (e.g. Police Extract, Vehicle Photo).",
    )

    # We are NOT storing the raw file in DB. Only the path/URL in storage.
    file = models.FileField(
        upload_to="case_documents/",  # for local dev; later we’ll point this to S3/Spaces
        help_text="Reference to the file in storage.",
    )

    original_filename = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Original filename as uploaded by the user.",
    )
    content_type = models.CharField(
        max_length=128,
        blank=True,
        null=True,
        help_text="MIME type of the file (e.g. application/pdf, image/jpeg).",
    )
    file_size = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Size in bytes.",
    )

    # Optional: hash for integrity checking / deduplication
    sha256_hash = models.CharField(
        max_length=64,
        blank=True,
        null=True,
        help_text="SHA-256 hash of the file content for integrity/duplicate detection.",
    )

    is_private = models.BooleanField(
        default=True,
        help_text="If true, file should never be directly exposed publicly.",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["doc_type"]),
        ]

    def __str__(self) -> str:
        return f"{self.doc_type} for Case #{self.case_id}"
