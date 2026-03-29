from rest_framework import serializers
from .models import Case, SightingReport
from vehicles.models import Vehicle

class PublicVehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = ["plate_number", "vin", "engine_number", "make", "model", "year", "color"]

class CaseSerializer(serializers.ModelSerializer):
    vehicle_id = serializers.PrimaryKeyRelatedField(
        queryset=Vehicle.objects.all(),
        source="vehicle",
        write_only=True,
    )

    class Meta:
        model = Case
        fields = [
            "id",
            "vehicle",
            "vehicle_id",
            "reporter",
            "status",
            "police_station",
            "police_case_number",
            "incident_date",
            "last_seen_location_text",
            "description",
            "created_at",
            "updated_at",
            "allow_public_contact",
        ]
        read_only_fields = [
            "id",
            "vehicle",
            "reporter",
            "created_at",
            "updated_at",
           
        ]

    def create(self, validated_data):
        """
        Reporter is always the authenticated user.
        Status should start as PENDING (model default).
        """
        request = self.context.get("request")
        user = getattr(request, "user", None)

        validated_data["reporter"] = user
        # leave status to model default (PENDING)
        return super().create(validated_data)
    
    def validate_status(self, value):
        """
        Only moderators/admins can change the status field.
        Owners can NOT manually set status via PATCH/PUT.
        """
        request = self.context.get("request")
        user = getattr(request, "user", None)

        # If this is a create (no instance yet), just ignore; model default handles it.
        if not getattr(self, "instance", None):
            return value

        # If status is actually changing...
        if value != self.instance.status:
            if not user or not (user.is_moderator or user.is_admin):
                raise serializers.ValidationError(
                    "Only moderators or admins can change case status."
                )

        return value

class PublicVehicleStatusSerializer(serializers.Serializer):
    """
    Serializer for public vehicle status check.
    We don't expose sensitive or personal data.
    """

    found = serializers.BooleanField()
    has_verified_stolen_case = serializers.BooleanField()
    latest_status = serializers.CharField(allow_null=True)
    vehicle = PublicVehicleSerializer(allow_null=True)
    case_id = serializers.IntegerField(allow_null=True)
    last_updated = serializers.DateTimeField(allow_null=True)
    police_station = serializers.CharField(allow_null=True)
    description = serializers.CharField(allow_null=True)
    
class SightingReportCreateSerializer(serializers.Serializer):
    reporter_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    reporter_phone = serializers.CharField(max_length=50, required=False, allow_blank=True)
    reporter_email = serializers.EmailField(required=False, allow_blank=True)
    message = serializers.CharField()
    location = serializers.CharField(max_length=255)


class SightingReportResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()
    sighting_id = serializers.IntegerField()
    owner_phone = serializers.CharField(allow_null=True)
    contact_shared = serializers.BooleanField()    
    
class RevealContactResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()
    owner_phone = serializers.CharField(allow_null=True)
    contact_shared = serializers.BooleanField()
    
class SightingReportReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = SightingReport
        fields = [
            "id",
            "reporter_name",
            "reporter_phone",
            "reporter_email",
            "message",
            "location",
            "contact_revealed",
            "contact_revealed_at",
            "created_at",
        ]