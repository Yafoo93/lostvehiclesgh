from django.contrib import admin
from .models import Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ("plate_number", "vin", "engine_number", "make", "model", "year", "color", "created_at")
    list_filter = ("make", "color", "year")
    search_fields = ("plate_number", "vin", "engine_number", "make", "model")
