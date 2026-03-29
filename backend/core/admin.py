from django.contrib import admin

from .models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = (
        "created_at",
        "user",
        "action",
        "target_app_label",
        "target_model",
        "target_object_id",
        "ip_address",
    )
    list_filter = ("action", "target_app_label", "target_model", "created_at")
    search_fields = (
        "user__username",
        "description",
        "target_app_label",
        "target_model",
        "target_object_id",
        "ip_address",
    )
    date_hierarchy = "created_at"
