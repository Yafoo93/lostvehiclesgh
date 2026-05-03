from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APITestCase

from cases.models import Case
from vehicles.models import Vehicle
from .models import Document


class CaseDocumentUploadTests(APITestCase):
    def setUp(self):
        self.owner = get_user_model().objects.create_user(
            username="owner",
            password="test-pass-123",
        )
        self.vehicle = Vehicle.objects.create(
            owner=self.owner,
            plate_number="GR-4321-24",
            vin="DOCVIN12345",
            engine_number="DOCENG12345",
            make="Toyota",
            model="Corolla",
            year=2018,
            color="White",
        )
        self.case = Case.objects.create(
            vehicle=self.vehicle,
            reporter=self.owner,
            status=Case.Status.PENDING,
            police_station="Adabraka Police Station",
            police_case_number="GPS/DOC/2026",
            incident_date="2026-04-01",
        )
        self.url = reverse("case-documents", args=[self.case.id])
        self.client.force_authenticate(self.owner)

    def test_upload_valid_police_extract(self):
        upload = SimpleUploadedFile(
            "police-extract.pdf",
            b"%PDF-1.4 test police extract",
            content_type="application/pdf",
        )

        response = self.client.post(
            self.url,
            {
                "doc_type": Document.DocumentType.POLICE_EXTRACT,
                "file": upload,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        document = Document.objects.get(id=response.data["id"])
        self.assertEqual(document.doc_type, Document.DocumentType.POLICE_EXTRACT)
        self.assertEqual(document.content_type, "application/pdf")
        self.assertEqual(document.original_filename, "police-extract.pdf")
        self.assertTrue(document.sha256_hash)

    def test_rejects_unsupported_police_extract_type(self):
        upload = SimpleUploadedFile(
            "police-extract.txt",
            b"not an allowed file",
            content_type="text/plain",
        )

        response = self.client.post(
            self.url,
            {
                "doc_type": Document.DocumentType.POLICE_EXTRACT,
                "file": upload,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)

    def test_rejects_pdf_vehicle_photo(self):
        upload = SimpleUploadedFile(
            "vehicle-photo.pdf",
            b"%PDF-1.4 not a photo",
            content_type="application/pdf",
        )

        response = self.client.post(
            self.url,
            {
                "doc_type": Document.DocumentType.VEHICLE_PHOTO,
                "file": upload,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)

    def test_rejects_file_larger_than_five_mb(self):
        upload = SimpleUploadedFile(
            "large-extract.pdf",
            b"x" * ((5 * 1024 * 1024) + 1),
            content_type="application/pdf",
        )

        response = self.client.post(
            self.url,
            {
                "doc_type": Document.DocumentType.POLICE_EXTRACT,
                "file": upload,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)
