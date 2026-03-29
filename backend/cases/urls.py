from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CaseViewSet, PublicVehicleStatusView

router = DefaultRouter()
router.register(r"cases", CaseViewSet, basename="case")

urlpatterns = [
    path("", include(router.urls)),
    path("check-vehicle/", PublicVehicleStatusView.as_view(), name="public-vehicle-status"),
]
