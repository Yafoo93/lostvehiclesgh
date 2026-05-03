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
        extra_kwargs = {
            "plate_number": {
                "required": False,
                "allow_blank": True,
                "allow_null": True,
            },
            "vin": {
                "required": True,
                "allow_blank": False,
                "allow_null": False,
            },
            "engine_number": {
                "required": False,
                "allow_blank": True,
                "allow_null": True,
            },
        }

    def validate(self, attrs):
        attrs = super().validate(attrs)

        for field in ("plate_number", "vin", "engine_number"):
            if field not in attrs:
                continue

            value = attrs[field]
            if value is None:
                continue

            value = value.strip().upper()
            attrs[field] = value or None

        instance = getattr(self, "instance", None)
        vin = attrs.get("vin")
        if vin is None and instance is not None:
            vin = instance.vin

        if not vin:
            raise serializers.ValidationError({
                "vin": "VIN is required."
            })

        checks = [
            ("vin", "A vehicle with this VIN already exists."),
            ("engine_number", "A vehicle with this engine number already exists."),
        ]

        for field, message in checks:
            value = attrs.get(field)
            if value is None and instance is not None:
                value = getattr(instance, field)

            if not value:
                continue

            queryset = Vehicle.objects.filter(**{f"{field}__iexact": value})
            if instance is not None:
                queryset = queryset.exclude(pk=instance.pk)

            if queryset.exists():
                raise serializers.ValidationError({field: message})

        return attrs
