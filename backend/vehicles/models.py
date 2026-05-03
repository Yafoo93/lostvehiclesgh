from django.conf import settings
from django.db import models
from django.db.models import Q
from django.db.models.functions import Lower



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
        blank=True,
        null=True,
        db_index=True,
        help_text="Current registration/plate number, if available.",
    )
    vin = models.CharField(
        max_length=64,
        db_index=True,
        help_text="Vehicle Identification Number.",
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
        constraints = [
            models.UniqueConstraint(
                Lower("vin"),
                name="uniq_vehicle_vin_ci",
            ),
            models.CheckConstraint(
                condition=~Q(vin=""),
                name="vehicle_vin_not_blank",
            ),
            models.UniqueConstraint(
                Lower("engine_number"),
                condition=Q(engine_number__isnull=False) & ~Q(engine_number=""),
                name="uniq_vehicle_engine_number_ci",
            ),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        identifier = self.vin or self.plate_number or "Unknown VIN"
        return f"{identifier} - {self.make} {self.model}"

    def save(self, *args, **kwargs):
        self.plate_number = self.plate_number.strip().upper() if self.plate_number else None
        self.vin = self.vin.strip().upper() if self.vin else ""
        self.engine_number = (
            self.engine_number.strip().upper() if self.engine_number else None
        )
        super().save(*args, **kwargs)
