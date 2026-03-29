from rest_framework import serializers

from .models import Document


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

        return super().create(validated_data)
