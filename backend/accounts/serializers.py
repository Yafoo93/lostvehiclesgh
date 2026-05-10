from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Used for returning user details (e.g. /api/auth/me/).
    """
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "role",
        ]
        read_only_fields = ["id", "role"]  # role is controlled by admins/moderators


class RegistrationSerializer(serializers.ModelSerializer):
    """
    Public registration serializer.
    We default role=OWNER for normal signups.
    """
    email = serializers.EmailField(required=True, allow_blank=False)
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8, required=False)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "password",
            "password2",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        email = attrs.get("email", "").strip().lower()
        pwd = attrs.get("password")
        pwd2 = attrs.get("password2")

        if not email:
            raise serializers.ValidationError({"email": "Email is required."})

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                {"email": "A user with this email already exists."}
            )

        attrs["email"] = email

        if pwd2 and pwd != pwd2:
            raise serializers.ValidationError({"password2": "Passwords do not match."})

        return attrs

    def create(self, validated_data):
        validated_data.pop("password2", None)
        password = validated_data.pop("password")

        user = User(
            **validated_data,
            role=User.Roles.OWNER,  # normal signup = OWNER
        )
        user.set_password(password)
        user.save()
        return user


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer to include user info in token & login response.
    Also allows login with either username or email.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token["username"] = user.username
        token["email"] = user.email
        token["role"] = user.role
        token["phone"] = user.phone or ""
        token["first_name"] = user.first_name
        token["last_name"] = user.last_name

        return token

    def validate(self, attrs):
        login_value = attrs.get("username", "").strip()

        # Allow email login by resolving email -> username first
        if login_value and "@" in login_value:
            matched_user = User.objects.filter(email__iexact=login_value).first()
            if matched_user:
                attrs["username"] = matched_user.username

        data = super().validate(attrs)

        user = self.user
        data["user"] = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone or "",
            "role": user.role,
        }

        return data

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        try:
            uid = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=uid)
        except Exception:
            raise serializers.ValidationError({"uid": "Invalid reset link."})

        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError({"token": "Invalid or expired reset token."})

        attrs["user"] = user
        return attrs

    def save(self):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user