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
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    EmailVerificationRequestSerializer,
    EmailVerificationConfirmSerializer,
)
from core.utils import log_activity
from core.models import ActivityLog
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from core.notifications import send_email_notification
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.utils import timezone



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
    
    def perform_create(self, serializer):
        user = serializer.save()

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        verify_url = f"{settings.FRONTEND_URL}/verify-email?uid={uid}&token={token}"

        send_email_notification(
            subject="Verify your LostVehiclesGH email",
            message=(
                "Welcome to LostVehiclesGH.\n\n"
                "Please verify your email address using the link below:\n"
                f"{verify_url}\n\n"
                "If you did not create this account, you can ignore this email."
            ),
            recipient_list=[user.email],
        )

class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = MyTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        user_data = response.data.get("user", {})
        user_id = user_data.get("id")

        if user_id:
            user = User.objects.filter(id=user_id).first()
            if user:
                log_activity(
                    user=user,
                    action=ActivityLog.ActionType.LOGIN,
                    description=f"User {user.username} logged in.",
                    target=user,
                    request=request,
                )

        return response
    
class PasswordResetRequestView(generics.GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].strip().lower()
        user = User.objects.filter(email__iexact=email).first()
        
        if user:
            log_activity(
                user=user,
                action=ActivityLog.ActionType.PASSWORD_RESET_REQUEST,
                description=f"Password reset requested for user {user.username}.",
                target=user,
                request=request,
            )
        

        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

            send_email_notification(
                subject="Reset your LostVehiclesGH password",
                message=(
                    "You requested a password reset for your LostVehiclesGH account.\n\n"
                    f"Use this link to reset your password:\n{reset_url}\n\n"
                    "If you did not request this, you can ignore this email."
                ),
                recipient_list=[user.email],
            )

        return Response(
            {"detail": "If an account exists with this email, a password reset link has been sent."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        user = serializer.validated_data["user"]

        log_activity(
            user=user,
            action=ActivityLog.ActionType.PASSWORD_RESET,
            description=f"Password reset completed for user {user.username}.",
            target=user,
            request=request,
        )

        return Response(
            {"detail": "Password has been reset successfully."},
            status=status.HTTP_200_OK,
        )
    
class EmailVerificationRequestView(generics.GenericAPIView):
    serializer_class = EmailVerificationRequestSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "email_verification"

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"].strip().lower()
        user = User.objects.filter(email__iexact=email).first()

        if user and not user.email_verified:
            log_activity(
                user=user,
                action=ActivityLog.ActionType.EMAIL_VERIFICATION_REQUEST,
                description=f"Email verification requested for user {user.username}.",
                target=user,
                request=request,
            )
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            verify_url = f"{settings.FRONTEND_URL}/verify-email?uid={uid}&token={token}"

            send_email_notification(
                subject="Verify your LostVehiclesGH email",
                message=(
                    "Please verify your LostVehiclesGH email address.\n\n"
                    f"Use this link to verify your email:\n{verify_url}\n\n"
                    "If you did not create this account, you can ignore this email."
                ),
                recipient_list=[user.email],
            )

        return Response(
            {"detail": "If an account exists with this email, a verification link has been sent."},
            status=status.HTTP_200_OK,
        )


class EmailVerificationConfirmView(generics.GenericAPIView):
    serializer_class = EmailVerificationConfirmSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        user.email_verified = True
        user.email_verified_at = timezone.now()
        user.save(update_fields=["email_verified", "email_verified_at"])

        log_activity(
            user=user,
            action=ActivityLog.ActionType.EMAIL_VERIFIED,
            description=f"Email verified for user {user.username}.",
            target=user,
            request=request,
        )

        return Response(
            {"detail": "Email verified successfully."},
            status=status.HTTP_200_OK,
        )