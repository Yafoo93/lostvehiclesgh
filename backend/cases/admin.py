from django.contrib import admin
from .models import Case, SightingReport


@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "vehicle",
        "reporter",
        "status",
        "suspicious_flag",
        "police_station",
        "police_case_number",
        "incident_date",
        "moderated_by",
        "moderated_at",
        "recovery_requested_at",
        "recovery_reviewed_at",
        "recovery_rejected_at",
        "created_at",
        "allow_public_contact",
    )
    list_filter = (
        "status",
        "suspicious_flag",
        "police_station",
        "incident_date",
        "moderated_at",
        "recovery_requested_at",
        "recovery_reviewed_at",
        "recovery_rejected_at",
        "created_at",
    )
    search_fields = (
        "vehicle__plate_number",
        "vehicle__vin",
        "vehicle__engine_number",
        "police_case_number",
        "rejection_reason",
        "moderator_notes",
        "more_info_request_note",
        "suspicious_flag_reason",
        "reporter__username",
        "reporter__email",
    )

@admin.register(SightingReport)
class SightingReportAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "case",
        "reporter_name",
        "location",
        "contact_revealed",
        "created_at",
    )
    list_filter = ("contact_revealed", "created_at")
    search_fields = (
        "case__id",
        "reporter_name",
        "reporter_phone",
        "reporter_email",
        "location",
    )
