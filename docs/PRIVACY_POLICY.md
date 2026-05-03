# Privacy Policy Draft

## Data Collected

Account data:

- Username.
- Email.
- First name.
- Last name.
- Phone number.
- Role.

Vehicle data:

- Plate number.
- VIN.
- Engine number.
- Make.
- Model.
- Year.
- Color.

Case data:

- Police station.
- Police case number.
- Incident date.
- Last seen location.
- Description.
- Case status.
- Recovery details when provided.
- Public contact sharing preference.

Documents:

- Police extract files.
- Vehicle photos.
- Original filename.
- MIME type.
- File size.
- SHA-256 hash.

Sighting reports:

- Reporter name.
- Reporter phone.
- Reporter email.
- Location.
- Message.
- Contact reveal status.

Audit data:

- User.
- Action.
- Target object metadata.
- IP address.
- User agent.
- Timestamp.

## Public Disclosure

The public search endpoint discloses only limited data for verified stolen or recovered cases.

Pending, more-info, and rejected cases are not publicly disclosed.

Owner phone is shared only when:

- The case is verified stolen.
- The owner opted into public contact sharing.
- The public user submitted or references a sighting report.

## Data Use

Data is used to:

- Let owners manage vehicles and cases.
- Support moderation and fraud review.
- Help the public identify verified stolen vehicles.
- Support recovery through sighting reports.
- Maintain audit logs for sensitive actions.

## Data Protection

Current safeguards:

- JWT authentication for owner and moderator workflows.
- Role-based permissions.
- Public disclosure filtering by case status.
- File type and file size validation.
- Private document flag.
- Throttling on public and sensitive endpoints.

Production requirements:

- Move private files behind authenticated downloads or signed URLs.
- Use HTTPS.
- Restrict CORS and allowed hosts.
- Define data retention and deletion policies.
- Add operational monitoring and backup controls.

## Data Retention

Retention periods are not implemented in code yet.

Recommended policy decisions:

- How long to retain recovered cases.
- How long to retain rejected cases.
- How long to retain uploaded police extracts and vehicle photos.
- How long to retain sighting reports and audit logs.

## User Rights

Before public launch, define processes for:

- Account data access.
- Data correction.
- Case removal requests.
- Evidence deletion requests.
- Lawful disclosure to authorities.

## Clarification Needed

- Whether plate-number search will be public.
- Whether partner agencies can access private documents.
- Whether owner phone sharing requires additional verification.
- Which country-specific data protection policy language should be published.
