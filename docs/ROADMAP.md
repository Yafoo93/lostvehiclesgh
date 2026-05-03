# Roadmap

This roadmap reflects the current codebase as of May 2026.

## Implemented

- Django REST backend with custom user roles.
- Next.js frontend with public search, authentication, owner dashboard, vehicle creation, case creation, and moderation dashboard.
- Public search by VIN or engine number.
- Public disclosure limited to verified stolen and recovered cases.
- Owner vehicle management.
- Case submission with police station, police case number, incident date, location, description, and public contact consent.
- Document upload for police extracts and vehicle photos.
- File validation by document type, MIME type, extension, and 5 MB size limit.
- Moderator/admin case review:
  - Verify stolen.
  - Reject case with reason.
  - Request more information.
  - Add moderator notes.
  - Flag or clear suspicious/fraud cases.
- Recovery workflow:
  - Owner submits recovery request.
  - Moderator/admin approves recovery.
  - Moderator/admin rejects recovery with note.
- Public sighting report workflow.
- Owner contact reveal workflow controlled by `allow_public_contact`.
- Basic activity logging for moderation, recovery, sighting, and case update actions.
- Backend tests for public disclosure, final-decision police extract requirement, moderation transitions, and document upload validation.

## Next Priorities

1. Production database support.
   - Add PostgreSQL settings driven by `DATABASE_URL` or explicit DB env vars.
   - Update Docker Compose production services to use PostgreSQL once settings support it.
   - Add backup and restore documentation.

2. Notification delivery.
   - Replace sighting-flow `print` payloads with email/SMS/in-app notification services.
   - Notify owners when sightings are submitted.
   - Notify moderators when suspicious or high-priority cases need review.

3. Public report pages.
   - Implement `/report` and `/cases/new` public-facing flows or remove placeholders.
   - Decide whether unauthenticated users can start a report and finish after registration.

4. Role administration.
   - Add admin UI/API flows for assigning `MODERATOR`, `ADMIN`, and `PARTNER` roles.
   - Add tests for role transitions and role-based frontend access.

5. Secure file delivery.
   - Keep documents private in production through authenticated download endpoints or signed URLs.
   - Avoid directly exposing private media paths.

6. Case evidence review.
   - Add document review status and moderator comments per document.
   - Require police extract quality checks before final decisions.

7. Search hardening.
   - Add plate-number search only if privacy policy and disclosure rules are approved.
   - Normalize VIN, engine number, and plate number formats on write.
   - Add duplicate vehicle and duplicate case detection.

8. Audit and compliance.
   - Expand activity logging to vehicle create/update/delete and document uploads.
   - Add admin-facing activity log views.
   - Define retention periods for cases, documents, sightings, and logs.

9. Frontend quality.
   - Replace `window.prompt` moderation inputs with structured forms/modals.
   - Add token refresh handling and logout-on-expiry behavior.
   - Add route guards for dashboard pages.
   - Add frontend tests for public search, owner dashboard, and moderation flows.

10. Deployment readiness.
    - Finalize Docker production database and static/media strategy.
    - Add CI for backend tests and frontend type/build checks.
    - Add environment-specific CORS and allowed-host configuration.

## Clarification Needed

- Which organization will verify police extracts: internal moderators only, Ghana Police Service partners, or both?
- Should public search support plate number lookup, or should it stay limited to VIN and engine number for privacy?
- What SMS/email provider should be used for owner and moderator notifications?
- What is the intended production host/domain?
- Should partner users have their own dashboard and API access, and what actions should partners be allowed to perform?
