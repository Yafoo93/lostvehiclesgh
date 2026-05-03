from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APITestCase

from documents.models import Document
from vehicles.models import Vehicle
from .models import Case


class PublicVehicleStatusViewTests(APITestCase):
    def setUp(self):
        self.owner = get_user_model().objects.create_user(
            username="owner",
            password="test-pass-123",
            first_name="Ama",
            last_name="Mensah",
            phone="0240000000",
        )
        self.moderator = get_user_model().objects.create_user(
            username="moderator",
            password="test-pass-123",
            role="MODERATOR",
        )
        self.url = reverse("public-vehicle-status")

    def create_vehicle(self, vin="TESTVIN12345", engine_number="ENG12345"):
        return Vehicle.objects.create(
            owner=self.owner,
            plate_number="GR-1234-24",
            vin=vin,
            engine_number=engine_number,
            make="Toyota",
            model="Corolla",
            year=2018,
            color="White",
        )

    def create_case(self, vehicle, status):
        return Case.objects.create(
            vehicle=vehicle,
            reporter=self.owner,
            status=status,
            police_station="Adabraka Police Station",
            police_case_number="GPS/123/2026",
            incident_date="2026-04-01",
            last_seen_location_text="Accra",
            description="Vehicle was last seen near Circle.",
        )

    def create_police_extract(self, case):
        return Document.objects.create(
            case=case,
            doc_type=Document.DocumentType.POLICE_EXTRACT,
            file=SimpleUploadedFile(
                "police-extract.pdf",
                b"%PDF-1.4 test police extract",
                content_type="application/pdf",
            ),
            original_filename="police-extract.pdf",
            content_type="application/pdf",
            file_size=28,
            sha256_hash="test",
            is_private=True,
        )

    def test_pending_case_is_not_publicly_disclosed(self):
        vehicle = self.create_vehicle()
        self.create_case(vehicle, Case.Status.PENDING)

        response = self.client.get(self.url, {"vin": vehicle.vin})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "found": False,
                "has_verified_stolen_case": False,
                "latest_status": None,
                "vehicle": None,
                "case_id": None,
                "reporter_name": None,
                "reported_at": None,
                "last_updated": None,
                "police_station": None,
                "description": None,
            },
        )

    def test_rejected_case_is_not_publicly_disclosed(self):
        vehicle = self.create_vehicle(vin="REJECTEDVIN1", engine_number="REJ123")
        self.create_case(vehicle, Case.Status.REJECTED)

        response = self.client.get(self.url, {"engine_number": vehicle.engine_number})

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["found"])
        self.assertIsNone(response.data["vehicle"])
        self.assertIsNone(response.data["case_id"])
        self.assertIsNone(response.data["latest_status"])

    def test_verified_stolen_case_remains_public(self):
        vehicle = self.create_vehicle(vin="VERIFIEDVIN1", engine_number="VER123")
        case = self.create_case(vehicle, Case.Status.VERIFIED_STOLEN)

        response = self.client.get(self.url, {"vin": vehicle.vin})

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["found"])
        self.assertTrue(response.data["has_verified_stolen_case"])
        self.assertEqual(response.data["latest_status"], Case.Status.VERIFIED_STOLEN)
        self.assertEqual(response.data["case_id"], case.id)
        self.assertEqual(response.data["police_station"], case.police_station)
        self.assertEqual(response.data["description"], case.description)
        self.assertEqual(response.data["vehicle"]["make"], vehicle.make)
        self.assertEqual(response.data["vehicle"]["model"], vehicle.model)

    def test_latest_public_case_ignores_newer_pending_case(self):
        vehicle = self.create_vehicle(vin="MIXEDVIN1234", engine_number="MIX123")
        verified_case = self.create_case(vehicle, Case.Status.VERIFIED_STOLEN)
        self.create_case(vehicle, Case.Status.PENDING)

        response = self.client.get(self.url, {"vin": vehicle.vin})

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["found"])
        self.assertEqual(response.data["latest_status"], Case.Status.VERIFIED_STOLEN)
        self.assertEqual(response.data["case_id"], verified_case.id)

    def test_moderator_rejects_case_with_reason(self):
        vehicle = self.create_vehicle(vin="REASONVIN123", engine_number="REASON123")
        case = self.create_case(vehicle, Case.Status.PENDING)
        self.create_police_extract(case)
        self.client.force_authenticate(self.moderator)

        response = self.client.post(
            reverse("case-reject", args=[case.id]),
            {"rejection_reason": "Police extract does not match vehicle details."},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        case.refresh_from_db()
        self.assertEqual(case.status, Case.Status.REJECTED)
        self.assertEqual(
            case.rejection_reason,
            "Police extract does not match vehicle details.",
        )
        self.assertEqual(case.moderated_by, self.moderator)
        self.assertIsNotNone(case.moderated_at)

    def test_moderator_cannot_make_final_decision_without_police_extract(self):
        vehicle = self.create_vehicle(vin="NOEXTRACTVIN", engine_number="NOEXT123")
        case = self.create_case(vehicle, Case.Status.PENDING)
        self.client.force_authenticate(self.moderator)

        verify_response = self.client.post(reverse("case-verify-stolen", args=[case.id]))
        reject_response = self.client.post(
            reverse("case-reject", args=[case.id]),
            {"rejection_reason": "Missing police extract."},
            format="json",
        )

        self.assertEqual(verify_response.status_code, 400)
        self.assertEqual(reject_response.status_code, 400)
        case.refresh_from_db()
        self.assertEqual(case.status, Case.Status.PENDING)

    def test_moderator_can_verify_case_with_police_extract(self):
        vehicle = self.create_vehicle(vin="EXTRACTVIN123", engine_number="EXT123")
        case = self.create_case(vehicle, Case.Status.PENDING)
        self.create_police_extract(case)
        self.client.force_authenticate(self.moderator)

        response = self.client.post(reverse("case-verify-stolen", args=[case.id]))

        self.assertEqual(response.status_code, 200)
        case.refresh_from_db()
        self.assertEqual(case.status, Case.Status.VERIFIED_STOLEN)

    def test_moderator_requests_more_info(self):
        vehicle = self.create_vehicle(vin="INFOVIN12345", engine_number="INFO123")
        case = self.create_case(vehicle, Case.Status.PENDING)
        self.client.force_authenticate(self.moderator)

        response = self.client.post(
            reverse("case-request-more-info", args=[case.id]),
            {"more_info_request_note": "Upload a clearer police extract."},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        case.refresh_from_db()
        self.assertEqual(case.status, Case.Status.NEEDS_INFO)
        self.assertEqual(
            case.more_info_request_note,
            "Upload a clearer police extract.",
        )
        self.assertIsNotNone(case.more_info_requested_at)

    def test_moderator_updates_notes_and_suspicious_flag(self):
        vehicle = self.create_vehicle(vin="FLAGVIN12345", engine_number="FLAG123")
        case = self.create_case(vehicle, Case.Status.PENDING)
        self.client.force_authenticate(self.moderator)

        notes_response = self.client.post(
            reverse("case-update-moderator-notes", args=[case.id]),
            {"moderator_notes": "Call station before approval."},
            format="json",
        )
        flag_response = self.client.post(
            reverse("case-flag-suspicious", args=[case.id]),
            {
                "suspicious_flag": True,
                "suspicious_flag_reason": "Duplicate report pattern.",
            },
            format="json",
        )

        self.assertEqual(notes_response.status_code, 200)
        self.assertEqual(flag_response.status_code, 200)
        case.refresh_from_db()
        self.assertEqual(case.moderator_notes, "Call station before approval.")
        self.assertTrue(case.suspicious_flag)
        self.assertEqual(case.suspicious_flag_reason, "Duplicate report pattern.")
