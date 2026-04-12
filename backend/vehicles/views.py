from rest_framework import viewsets
from .models import Vehicle
from .serializers import VehicleSerializer
from .permissions import IsVehicleOwnerOrModeratorOrReadOnly


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
        """
        Always attach the logged-in user as the owner.
        """
        serializer.save(owner=self.request.user)