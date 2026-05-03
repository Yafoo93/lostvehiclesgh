import hashlib
from pathlib import Path

from rest_framework import serializers

from .models import Document


MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024
ALLOWED_CONTENT_TYPES_BY_DOC_TYPE = {
    Document.DocumentType.POLICE_EXTRACT: {
        "application/pdf",
        "image/jpeg",
        "image/png",
    },
    Document.DocumentType.VEHICLE_PHOTO: {
        "image/jpeg",
        "image/png",
    },
}
ALLOWED_EXTENSIONS_BY_DOC_TYPE = {
    Document.DocumentType.POLICE_EXTRACT: {".pdf", ".jpg", ".jpeg", ".png"},
    Document.DocumentType.VEHICLE_PHOTO: {".jpg", ".jpeg", ".png"},
}


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            "id",
            "case",
            "doc_type",
            "file",
            "original_filename",
            "content_type",
            "file_size",
            "sha256_hash",
            "is_private",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "case",
            "original_filename",
            "content_type",
            "file_size",
            "sha256_hash",
            "is_private",
            "created_at",
        ]

    def validate(self, attrs):
        upload = attrs.get("file")
        doc_type = attrs.get("doc_type")

        if upload is None:
            raise serializers.ValidationError({"file": "A file is required."})

        if doc_type not in ALLOWED_CONTENT_TYPES_BY_DOC_TYPE:
            raise serializers.ValidationError({"doc_type": "Unsupported document type."})

        file_size = getattr(upload, "size", 0) or 0
        if file_size > MAX_UPLOAD_SIZE_BYTES:
            raise serializers.ValidationError(
                {"file": "File size must not exceed 5MB."}
            )

        content_type = (getattr(upload, "content_type", "") or "").lower()
        allowed_content_types = ALLOWED_CONTENT_TYPES_BY_DOC_TYPE[doc_type]
        if content_type not in allowed_content_types:
            raise serializers.ValidationError(
                {"file": "Unsupported file type for this document."}
            )

        extension = Path(getattr(upload, "name", "")).suffix.lower()
        allowed_extensions = ALLOWED_EXTENSIONS_BY_DOC_TYPE[doc_type]
        if extension not in allowed_extensions:
            raise serializers.ValidationError(
                {"file": "Unsupported file extension for this document."}
            )

        return attrs

    def create(self, validated_data):
        """
        Fill metadata (filename, size, content_type) automatically.
        The view will set `case` and `is_private`.
        """
        upload = validated_data.get("file")

        if upload is not None:
            validated_data["original_filename"] = getattr(upload, "name", None)
            validated_data["file_size"] = getattr(upload, "size", None)
            validated_data["content_type"] = getattr(upload, "content_type", None)
            sha256 = hashlib.sha256()

            for chunk in upload.chunks():
                sha256.update(chunk)

            validated_data["sha256_hash"] = sha256.hexdigest()

            if hasattr(upload, "seek"):
                upload.seek(0)

        return super().create(validated_data)
