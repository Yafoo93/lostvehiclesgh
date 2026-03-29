from rest_framework import serializers
from .models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source="owner.id")
    class Meta:
        model = Vehicle
        fields = [
            "id",
            "owner",
            "plate_number",
            "vin",
            "engine_number",
            "make",
            "model",
            "year",
            "color",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "owner", "created_at", "updated_at"]
