from django.contrib import admin

from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "case",
        "doc_type",
        "original_filename",
        "content_type",
        "file_size",
        "is_private",
        "created_at",
    )
    list_filter = ("doc_type", "is_private", "created_at")
    search_fields = (
        "case__id",
        "case__vehicle__plate_number",
        "original_filename",
    )
