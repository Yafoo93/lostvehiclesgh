# Security Model

## Authentication

The API uses Simple JWT.

- Access token lifetime: 30 minutes.
- Refresh token lifetime: 7 days.
- Frontend stores tokens in local storage.
- Authenticated API calls use `Authorization: Bearer <access_token>`.

## Roles

The custom user model supports:

- `OWNER`: normal registered user.
- `MODERATOR`: can review cases and moderate status.
- `ADMIN`: can perform moderator actions and use Django admin.
- `PARTNER`: reserved for future partner workflows.

Public registration always creates `OWNER` accounts. Role assignment should be handled by trusted admins only.

## Permissions

- Vehicle endpoints require authentication.
- Owners see their own vehicles.
- Moderators/admins see all vehicles.
- Case endpoints require authentication except public sighting and contact reveal actions.
- Owners see cases they reported.
- Moderators/admins see all cases.
- Case documents are accessible only to the case reporter and moderators/admins.
- Public vehicle search discloses only `VERIFIED_STOLEN` and `RECOVERED` cases.

## Public Data Exposure

Public search returns limited case data:

- Vehicle summary.
- Case ID.
- Reporter display name.
- Reported and updated timestamps.
- Police station.
- Description.

Public search does not disclose pending or rejected cases.

Owner phone is only shared after a sighting flow when:

- The case is `VERIFIED_STOLEN`.
- The owner enabled `allow_public_contact`.
- The owner has a phone number on the account.

## Document Security

Documents are modeled as private by default.

Current local behavior:

- Files are stored under local media.
- Django serves media during `DEBUG=True`.
- Application document access uses authenticated download endpoints.
- Document list responses expose protected `download_url` values, not raw storage paths.

Required before production:

- Store documents in durable object storage.
- Prevent direct public access to private media paths.

## Throttling

Configured throttles:

- Anonymous: `50/day`
- Authenticated users: `1000/day`
- Public search: `30/min`
- Login: `10/min`
- Case creation: `20/hour`
- Sighting reports: `10/min`
- Contact reveal: `5/min`

## Audit Logging

The `ActivityLog` model records action, description, optional user, target object metadata, IP address, user agent, and timestamp.

Currently logged actions include moderation decisions, recovery actions, suspicious flags, and sighting/contact events.

Recommended expansion:

- Vehicle create/update/delete.
- Document upload.
- Login/logout.
- Role changes.

## Production Requirements

- Use a strong `DJANGO_SECRET_KEY`.
- Set `DEBUG=False`.
- Restrict `ALLOWED_HOSTS`.
- Restrict CORS origins to production frontend domains.
- Move from SQLite to PostgreSQL or another managed production database.
- Configure HTTPS at the edge.
- Add secure cookie/session settings if browser cookies are introduced.
- Add retention and deletion policies for personal data and evidence.
