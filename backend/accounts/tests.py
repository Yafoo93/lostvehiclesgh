from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase


class RegistrationTests(APITestCase):
    def setUp(self):
        self.url = reverse("auth-register")

    def payload(self, **overrides):
        data = {
            "username": "owner",
            "email": "owner@example.com",
            "first_name": "Ama",
            "last_name": "Mensah",
            "phone": "0240000000",
            "password": "test-pass-123",
            "password2": "test-pass-123",
        }
        data.update(overrides)
        return data

    def test_registration_requires_email(self):
        response = self.client.post(
            self.url,
            self.payload(email=""),
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)

    def test_registration_rejects_duplicate_email_case_insensitively(self):
        User = get_user_model()
        User.objects.create_user(
            username="existing",
            email="owner@example.com",
            password="test-pass-123",
        )

        response = self.client.post(
            self.url,
            self.payload(username="new-owner", email="OWNER@example.com"),
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)

    def test_registration_normalizes_email(self):
        response = self.client.post(
            self.url,
            self.payload(email=" OWNER@EXAMPLE.COM "),
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        user = get_user_model().objects.get(username="owner")
        self.assertEqual(user.email, "owner@example.com")
