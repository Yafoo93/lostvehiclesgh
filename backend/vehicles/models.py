from django.db import models
from django.conf import settings



class Vehicle(models.Model):
    """
    Represents a physical vehicle that may be reported as stolen.
    This is separate from cases (reports), because one vehicle
    could theoretically have multiple cases over its lifetime.
    """
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vehicles",
        help_text="User who owns this vehicle.",
    )
    
    plate_number = models.CharField(
        max_length=32,
        db_index=True,
        help_text="Registration/plate number as it appears on the vehicle.",
    )
    vin = models.CharField(
        max_length=64,
        blank=True,
        null=True,
        db_index=True,
        help_text="Vehicle Identification Number (if available).",
    )
    engine_number = models.CharField(
        max_length=64,
        blank=True,
        null=True,
        db_index=True,
        help_text="Engine number (if available).",
    )

    make = models.CharField(max_length=64, help_text="Manufacturer, e.g., Toyota, Hyundai.")
    model = models.CharField(max_length=64, help_text="Model name, e.g., Corolla, Elantra.")
    year = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Manufacturing year, if known.",
    )
    color = models.CharField(
        max_length=32,
        blank=True,
        null=True,
        help_text="Primary color, e.g., White, Black, Blue.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["plate_number"]),
            models.Index(fields=["vin"]),
            models.Index(fields=["engine_number"]),
        ]
        unique_together = [
            ("plate_number", "vin", "engine_number"),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.plate_number} - {self.make} {self.model}"
