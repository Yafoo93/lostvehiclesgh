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
        self.moderator = get_user_model().objects.create_user(
            username="moderator",
            password="test-pass-123",
            role="MODERATOR",
        )
        self.other_user = get_user_model().objects.create_user(
            username="other",
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

    def create_document(self):
        return Document.objects.create(
            case=self.case,
            doc_type=Document.DocumentType.POLICE_EXTRACT,
            file=SimpleUploadedFile(
                "police-extract.pdf",
                b"%PDF-1.4 private police extract",
                content_type="application/pdf",
            ),
            original_filename="police-extract.pdf",
            content_type="application/pdf",
            file_size=31,
            sha256_hash="test",
            is_private=True,
        )

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
        self.assertNotIn("file", response.data)
        self.assertIn("download_url", response.data)

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

    def test_list_documents_exposes_protected_download_url_not_media_path(self):
        document = self.create_document()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 200)
        result = response.data["results"][0]
        self.assertEqual(result["id"], document.id)
        self.assertNotIn("file", result)
        self.assertIn(
            reverse("document-download", args=[document.id]),
            result["download_url"],
        )

    def test_owner_can_download_private_document(self):
        document = self.create_document()
        url = reverse("document-download", args=[document.id])

        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertEqual(response["Cache-Control"], "private, no-store")
        self.assertEqual(
            b"".join(response.streaming_content),
            b"%PDF-1.4 private police extract",
        )

    def test_moderator_can_download_private_document(self):
        document = self.create_document()
        self.client.force_authenticate(self.moderator)

        response = self.client.get(reverse("document-download", args=[document.id]))

        self.assertEqual(response.status_code, 200)

    def test_other_user_cannot_download_private_document(self):
        document = self.create_document()
        self.client.force_authenticate(self.other_user)

        response = self.client.get(reverse("document-download", args=[document.id]))

        self.assertEqual(response.status_code, 403)

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
