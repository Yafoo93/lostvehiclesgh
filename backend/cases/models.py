from django.conf import settings
from django.db import models

from vehicles.models import Vehicle
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta



class Case(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending Review"
        NEEDS_INFO = "NEEDS_INFO", "More Info Requested"
        VERIFIED_STOLEN = "VERIFIED_STOLEN", "Verified Stolen"
        REJECTED = "REJECTED", "Rejected"
        RECOVERED = "RECOVERED", "Recovered"

    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name="cases",
        help_text="The vehicle involved in this case.",
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reported_cases",
        help_text="User who submitted this stolen/missing report.",
    )

    status = models.CharField(
        max_length=32,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    police_station = models.CharField(
        max_length=255,
        help_text="Name of the police station handling the case.",
    )
    police_case_number = models.CharField(
        max_length=128,
        help_text="Official police case reference number.",
    )

    incident_date = models.DateField(
        help_text="Date when the vehicle was stolen or went missing.",
    )
    last_seen_location_text = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Description of last seen location (address, area, etc.).",
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Additional details about the incident.",
    )

    allow_public_contact = models.BooleanField(
        default=False,
        help_text="If enabled, owner's phone may be shared after a valid vehicle sighting report.",
    )

    recovery_requested_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the owner submitted a recovered-vehicle request.",
    )
    recovery_date = models.DateField(
        blank=True,
        null=True,
        help_text="Date the vehicle was recovered.",
    )
    recovery_location = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Where the vehicle was recovered.",
    )
    recovery_circumstances = models.TextField(
        blank=True,
        null=True,
        help_text="How the vehicle was recovered and the circumstances around it.",
    )
    recovery_vehicle_condition = models.TextField(
        blank=True,
        null=True,
        help_text="The condition/state of the vehicle when it was found.",
    )
    recovery_additional_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Any other relevant recovery details provided by the owner.",
    )

    recovery_reviewed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the recovery request was reviewed by a moderator/admin.",
    )
    recovery_rejected_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the recovery request was rejected by a moderator/admin.",
    )
    recovery_rejection_note = models.TextField(
        blank=True,
        null=True,
        help_text="Reason provided by moderator/admin when rejecting a recovery request.",
    )

    rejection_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason provided by moderator/admin when rejecting the case.",
    )
    moderator_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Internal notes visible to moderators/admins only.",
    )
    more_info_requested_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When a moderator/admin requested additional information.",
    )
    more_info_request_note = models.TextField(
        blank=True,
        null=True,
        help_text="Message explaining what additional information is needed.",
    )
    suspicious_flag = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether this case has been flagged as suspicious/fraudulent.",
    )
    suspicious_flag_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason this case was flagged as suspicious/fraudulent.",
    )
    moderated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="moderated_cases",
        help_text="Last moderator/admin who made a moderation decision.",
    )
    moderated_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the last moderation decision was made.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["police_case_number"]),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Case #{self.id} - {self.vehicle.plate_number} ({self.status})"
    
class SightingReport(models.Model):
    case = models.ForeignKey(
        Case,
        on_delete=models.CASCADE,
        related_name="sightings",
    )
    reporter_name = models.CharField(max_length=255, blank=True)
    reporter_phone = models.CharField(max_length=50, blank=True)
    reporter_email = models.EmailField(blank=True)
    message = models.TextField()
    location = models.CharField(max_length=255)
    contact_revealed = models.BooleanField(default=False)
    contact_revealed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["case", "created_at"]),
        ]

    def clean(self):
        recent_time = timezone.now() - timedelta(minutes=5)

        duplicate = SightingReport.objects.filter(
            case=self.case,
            reporter_phone=self.reporter_phone,
            location__iexact=self.location.strip(),
            message__iexact=self.message.strip(),
            created_at__gte=recent_time,
        ).exclude(pk=self.pk)

        if duplicate.exists():
            raise ValidationError(
                "Duplicate sighting detected. This same sighting was already submitted recently."
            )

    def __str__(self):
        return f"SightingReport #{self.id} for Case #{self.case_id}"
