from rest_framework import viewsets, permissions
from .models import Vehicle
from .serializers import VehicleSerializer
from rest_framework.permissions import IsAuthenticated
from .permissions import IsVehicleOwnerOrModeratorOrReadOnly


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all().order_by("-created_at")
    serializer_class = VehicleSerializer
    permission_classes = [IsVehicleOwnerOrModeratorOrReadOnly]

    def perform_create(self, serializer):
        """
        Always attach the logged-in user as the owner.
        """
        serializer.save(owner=self.request.user)
