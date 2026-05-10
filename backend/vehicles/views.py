from rest_framework import viewsets
from .models import Vehicle
from .serializers import VehicleSerializer
from .permissions import IsVehicleOwnerOrModeratorOrReadOnly
from core.utils import log_activity
from core.models import ActivityLog


class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [IsVehicleOwnerOrModeratorOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        if not user or not user.is_authenticated:
            return Vehicle.objects.none()

        if getattr(user, "is_moderator", False) or getattr(user, "is_admin", False):
            return Vehicle.objects.all().order_by("-created_at")

        return Vehicle.objects.filter(owner=user).order_by("-created_at")

    def perform_create(self, serializer):
        vehicle = serializer.save(owner=self.request.user)

        log_activity(
            user=self.request.user,
            action=ActivityLog.ActionType.CREATE_VEHICLE,
            description=f"Vehicle created with VIN {vehicle.vin}.",
            target=vehicle,
            request=self.request,
        )
    
    def perform_update(self, serializer):
        vehicle = serializer.save()

        log_activity(
            user=self.request.user,
            action=ActivityLog.ActionType.UPDATE_VEHICLE,
            description=f"Vehicle updated with VIN {vehicle.vin}.",
            target=vehicle,
            request=self.request,
        )
        
    def perform_destroy(self, instance):
        vin = instance.vin

        log_activity(
            user=self.request.user,
            action=ActivityLog.ActionType.DELETE_VEHICLE,
            description=f"Vehicle deleted with VIN {vin}.",
            target=instance,
            request=self.request,
        )

        instance.delete()