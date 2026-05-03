from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import Vehicle


class VehicleIdentifierConstraintTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="owner",
            password="pass12345",
        )

    def create_vehicle(self, **overrides):
        data = {
            "owner": self.user,
            "plate_number": "GR-1234-24",
            "vin": "VIN12345",
            "engine_number": "ENG12345",
            "make": "Toyota",
            "model": "Corolla",
        }
        data.update(overrides)
        return Vehicle.objects.create(**data)

    def test_vehicle_identifiers_are_normalized_on_save(self):
        vehicle = self.create_vehicle(
            plate_number=" gr-1234-24 ",
            vin=" vin12345 ",
            engine_number=" eng12345 ",
        )

        self.assertEqual(vehicle.plate_number, "GR-1234-24")
        self.assertEqual(vehicle.vin, "VIN12345")
        self.assertEqual(vehicle.engine_number, "ENG12345")

    def test_blank_optional_identifiers_are_stored_as_null(self):
        vehicle = self.create_vehicle(
            plate_number="",
            vin="VIN55555",
            engine_number="",
        )

        self.assertIsNone(vehicle.plate_number)
        self.assertIsNone(vehicle.engine_number)

    def test_database_allows_duplicate_plate_number(self):
        self.create_vehicle(plate_number="GR-1234-24")

        vehicle = self.create_vehicle(
            plate_number="gr-1234-24",
            vin="DIFFERENTVIN",
            engine_number="DIFFERENTENG",
        )

        self.assertEqual(vehicle.plate_number, "GR-1234-24")

    def test_database_rejects_duplicate_vin_case_insensitively(self):
        self.create_vehicle(vin="VIN12345")

        with self.assertRaises(IntegrityError), transaction.atomic():
            self.create_vehicle(
                plate_number="GT-2222-24",
                vin="vin12345",
                engine_number="DIFFERENTENG",
            )

    def test_database_rejects_duplicate_engine_number_case_insensitively(self):
        self.create_vehicle(engine_number="ENG12345")

        with self.assertRaises(IntegrityError), transaction.atomic():
            self.create_vehicle(
                plate_number="GT-3333-24",
                vin="DIFFERENTVIN",
                engine_number="eng12345",
            )

    def test_database_rejects_missing_vin(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            self.create_vehicle(
                plate_number="GT-4444-24",
                vin="",
                engine_number="DIFFERENTENG",
            )

    def test_multiple_vehicles_can_omit_optional_plate_and_engine_numbers(self):
        self.create_vehicle(
            plate_number=None,
            vin="VIN1000",
            engine_number=None,
        )
        vehicle = self.create_vehicle(
            plate_number=None,
            vin="VIN2000",
            engine_number=None,
        )

        self.assertIsNone(vehicle.plate_number)


class VehicleSerializerDeduplicationTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="owner",
            password="pass12345",
        )
        self.client.force_authenticate(self.user)
        self.url = reverse("vehicle-list")

    def payload(self, **overrides):
        data = {
            "plate_number": "GR-1234-24",
            "vin": "VIN12345",
            "engine_number": "ENG12345",
            "make": "Toyota",
            "model": "Corolla",
            "year": 2020,
            "color": "White",
        }
        data.update(overrides)
        return data

    def test_api_allows_duplicate_plate_number(self):
        first = self.client.post(self.url, self.payload(), format="json")
        self.assertEqual(first.status_code, 201)

        response = self.client.post(
            self.url,
            self.payload(
                plate_number="gr-1234-24",
                vin="DIFFERENTVIN",
                engine_number="DIFFERENTENG",
            ),
            format="json",
        )

        self.assertEqual(response.status_code, 201)

    def test_api_rejects_duplicate_vin(self):
        first = self.client.post(self.url, self.payload(), format="json")
        self.assertEqual(first.status_code, 201)

        response = self.client.post(
            self.url,
            self.payload(
                plate_number="GT-2222-24",
                vin="vin12345",
                engine_number="DIFFERENTENG",
            ),
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("vin", response.data)

    def test_api_rejects_missing_vin(self):
        response = self.client.post(
            self.url,
            self.payload(plate_number="GT-1000-24", vin="", engine_number="ENG1000"),
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("vin", response.data)

    def test_api_allows_multiple_missing_plate_and_engine_numbers(self):
        first = self.client.post(
            self.url,
            self.payload(plate_number="", vin="VIN1000", engine_number=""),
            format="json",
        )
        self.assertEqual(first.status_code, 201)

        response = self.client.post(
            self.url,
            self.payload(plate_number="", vin="VIN2000", engine_number=""),
            format="json",
        )

        self.assertEqual(response.status_code, 201)
