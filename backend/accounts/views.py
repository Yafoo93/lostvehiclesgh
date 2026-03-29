from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import AllowAny
from rest_framework import generics
from .models import User
from django.contrib.auth import get_user_model
from rest_framework.throttling import ScopedRateThrottle
from .serializers import (
    UserSerializer,
    RegistrationSerializer,
    MyTokenObtainPairSerializer,
)


User = get_user_model()



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """
    Return the currently authenticated user's details.
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)

class RegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [AllowAny]

class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = MyTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"