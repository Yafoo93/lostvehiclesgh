# API Specification

Base URL: `/api`

Authentication uses JWT bearer tokens returned from `POST /api/auth/login/`.

```http
Authorization: Bearer <access_token>
```

Most list endpoints are paginated using DRF page-number pagination with `count`, `next`, `previous`, and `results`.

## Health

### `GET /health/`

Public health check.

Response:

```json
{
  "status": "ok",
  "message": "API is healthy"
}
```

## Authentication

### `POST /auth/register/`

Creates an owner account. Public.

Body:

```json
{
  "username": "owner",
  "email": "owner@example.com",
  "first_name": "Ama",
  "last_name": "Mensah",
  "phone": "0240000000",
  "password": "test-pass-123",
  "password2": "test-pass-123"
}
```

Normal registrations are assigned role `OWNER`.

### `POST /auth/login/`

Public. Accepts username or email in the `username` field.

Body:

```json
{
  "username": "owner",
  "password": "test-pass-123"
}
```

Response includes `access`, `refresh`, and `user`.

### `GET /auth/me/`

Authenticated. Returns the current user.

### `POST /auth/token/refresh/`

Public Simple JWT refresh endpoint.

### `POST /auth/token/verify/`

Public Simple JWT verify endpoint.

## Vehicles

### `GET /vehicles/`

Authenticated.

- Owners see only their own vehicles.
- Moderators/admins see all vehicles.

### `POST /vehicles/`

Authenticated. Creates a vehicle for the current user.

VIN is required and case-insensitively unique. Plate number and engine number are optional because plate numbers can change; engine number is deduplicated when supplied.

Body:

```json
{
  "vin": "TESTVIN12345",
  "plate_number": "GR-1234-24",
  "engine_number": "ENG12345",
  "make": "Toyota",
  "model": "Corolla",
  "year": 2018,
  "color": "White"
}
```

### `GET|PUT|PATCH|DELETE /vehicles/{id}/`

Authenticated.

- Moderators/admins can manage any vehicle.
- Owners can modify only their own vehicles.

## Cases

Case statuses:

- `PENDING`
- `NEEDS_INFO`
- `VERIFIED_STOLEN`
- `REJECTED`
- `RECOVERED`

### `GET /cases/`

Authenticated.

- Owners see only cases they reported.
- Moderators/admins see all cases.
- Optional query: `?status=PENDING`
- Optional ordering: `?ordering=created_at`, `?ordering=-incident_date`

### `POST /cases/`

Authenticated. Creates a case for a vehicle the user owns. Moderators/admins can create for any vehicle.

Body:

```json
{
  "vehicle_id": 1,
  "police_station": "Adabraka Police Station",
  "police_case_number": "GPS/123/2026",
  "incident_date": "2026-04-01",
  "last_seen_location_text": "Accra",
  "description": "Vehicle was last seen near Circle.",
  "allow_public_contact": true
}
```

Owner-created cases start as `PENDING`.

### `GET|PUT|PATCH|DELETE /cases/{id}/`

Authenticated.

- Moderators/admins can manage any case.
- Owners can modify only cases they reported.
- Moderator-only fields such as `moderator_notes`, `suspicious_flag`, and `suspicious_flag_reason` are hidden from non-moderator responses.

## Case Documents

### `GET /cases/{case_id}/documents/`

Authenticated. Accessible to the case reporter and moderators/admins.
Returns document metadata and a protected `download_url`. Raw storage paths are not exposed.

### `GET /documents/{document_id}/download/`

Authenticated. Streams a private document only to the case reporter or moderators/admins.

### `POST /cases/{case_id}/documents/`

Authenticated multipart upload.

Fields:

- `doc_type`: `POLICE_EXTRACT` or `VEHICLE_PHOTO`
- `file`: uploaded file

Validation:

- Maximum file size: 5 MB.
- `POLICE_EXTRACT`: PDF, JPG, JPEG, PNG.
- `VEHICLE_PHOTO`: JPG, JPEG, PNG.
- Metadata captured: original filename, MIME type, size, SHA-256 hash.
- Documents are stored with `is_private=true`.

## Moderation Actions

All moderation actions require role `MODERATOR` or `ADMIN`.

### `POST /cases/{id}/verify-stolen/`

Marks a case as `VERIFIED_STOLEN`.

Requires at least one `POLICE_EXTRACT` document.

### `POST /cases/{id}/reject/`

Marks a case as `REJECTED`.

Requires at least one `POLICE_EXTRACT` document.

Body:

```json
{
  "rejection_reason": "Police extract does not match vehicle details."
}
```

### `POST /cases/{id}/request-more-info/`

Marks a case as `NEEDS_INFO`.

Body:

```json
{
  "more_info_request_note": "Upload a clearer police extract."
}
```

### `POST /cases/{id}/moderator-notes/`

Updates internal moderator notes.

Body:

```json
{
  "moderator_notes": "Call station before approval."
}
```

### `POST /cases/{id}/flag-suspicious/`

Sets or clears the suspicious/fraud flag.

Body:

```json
{
  "suspicious_flag": true,
  "suspicious_flag_reason": "Duplicate report pattern."
}
```

When `suspicious_flag` is true, a reason is required.

## Recovery Workflow

### `POST /cases/{id}/request-recovery/`

Authenticated. Only the case owner can submit a recovery request, and only while the case is `VERIFIED_STOLEN`.

Body:

```json
{
  "recovery_date": "2026-04-20",
  "recovery_location": "Tema Community 1",
  "recovery_circumstances": "Police recovered the vehicle after a tip-off.",
  "recovery_vehicle_condition": "Minor front bumper damage.",
  "recovery_additional_notes": "Owner has retrieved the vehicle."
}
```

### `POST /cases/{id}/mark-recovered/`

Moderator/admin only. Approves a submitted recovery request and marks the case as `RECOVERED`.

### `POST /cases/{id}/reject-recovery/`

Moderator/admin only. Rejects a submitted recovery request while the case remains `VERIFIED_STOLEN`.

Body:

```json
{
  "recovery_rejection_note": "Recovery evidence is incomplete."
}
```

## Public Vehicle Search

### `GET /check-vehicle/?vin=...&engine_number=...`

Public. At least one query parameter is required.

VIN is the preferred search key. Engine-number search remains available for public checks when the engine number is known.

Only `VERIFIED_STOLEN` and `RECOVERED` cases are publicly disclosed. Pending and rejected cases return a no-record response.

Response when no public case exists:

```json
{
  "found": false,
  "has_verified_stolen_case": false,
  "latest_status": null,
  "vehicle": null,
  "case_id": null,
  "reporter_name": null,
  "reported_at": null,
  "last_updated": null,
  "police_station": null,
  "description": null
}
```

## Public Sighting Reports

### `POST /cases/{id}/report-sighting/`

Public. Only available for `VERIFIED_STOLEN` cases.

Body:

```json
{
  "reporter_name": "Kojo",
  "reporter_phone": "0240000000",
  "reporter_email": "kojo@example.com",
  "message": "I saw the vehicle parked near the station.",
  "location": "Kaneshie"
}
```

Duplicate sightings with the same case, phone, location, and message are rejected within a five-minute window.

If `allow_public_contact` is enabled on the case and the owner has a phone number, the owner phone can be shared in the response.

### `POST /cases/{id}/reveal-contact/`

Public. Reveals owner phone for a prior sighting if the case allows public contact.

Body:

```json
{
  "sighting_id": 10
}
```

### `GET /cases/{id}/sightings/`

Authenticated. Case owner, moderators, and admins can list sighting reports for the case.

## Throttling

Configured scopes:

- `anon`: `50/day`
- `user`: `1000/day`
- `public_search`: `30/min`
- `login`: `10/min`
- `case_create`: `20/hour`
- `report_sighting`: `10/min`
- `reveal_contact`: `5/min`
