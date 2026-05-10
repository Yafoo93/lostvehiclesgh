from django.urls import path
from .views import RegistrationView, LoginView, me
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from .views import (
    PasswordResetRequestView,
    PasswordResetConfirmView,
    EmailVerificationRequestView,
    EmailVerificationConfirmView,
)

urlpatterns = [
    path("register/", RegistrationView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("me/", me, name="auth-me"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token-verify"),
    path(
        "password-reset/request/",
        PasswordResetRequestView.as_view(),
        name="password-reset-request",
    ),
    path(
        "password-reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
    path(
        "email-verification/request/",
        EmailVerificationRequestView.as_view(),
        name="email-verification-request",
    ),

    path(
        "email-verification/confirm/",
        EmailVerificationConfirmView.as_view(),
        name="email-verification-confirm",
    ),
]

