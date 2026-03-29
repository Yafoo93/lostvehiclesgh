from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Roles(models.TextChoices):
        OWNER = 'OWNER', 'Owner'
        MODERATOR = 'MODERATOR', 'Moderator'
        ADMIN = 'ADMIN', 'Admin'
        PARTNER = 'PARTNER', 'Partner'

   
    role = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.OWNER,
    )

    # Optional: phone field for future OTP support
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        unique=False,  # we'll handle uniqueness/format later
    )

    def __str__(self) -> str:
        return f"{self.username} ({self.role})"


    # 👇 add these
    @property
    def is_owner(self) -> bool:
        return self.role == self.Roles.OWNER

    @property
    def is_moderator(self) -> bool:
        return self.role == self.Roles.MODERATOR

    @property
    def is_admin(self) -> bool:
        return self.role == self.Roles.ADMIN

    @property
    def is_partner(self) -> bool:
        return self.role == self.Roles.PARTNER