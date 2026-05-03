# Moderation Policy

## Purpose

Moderation exists to prevent false public accusations, reduce fraud risk, and ensure only supported stolen-vehicle reports become publicly searchable.

## Case Statuses

- `PENDING`: submitted by owner and waiting for review.
- `NEEDS_INFO`: moderator/admin requested more information.
- `VERIFIED_STOLEN`: confirmed enough to make public.
- `REJECTED`: not accepted as a valid public stolen-vehicle case.
- `RECOVERED`: previously verified case has been confirmed recovered.

## Evidence Requirements

A case must include a police extract before a moderator/admin can:

- Verify it as stolen.
- Reject it as a final decision.

Accepted police extract file types:

- PDF.
- JPG/JPEG.
- PNG.

Maximum upload size is 5 MB.

Vehicle photos are optional and limited to JPG/JPEG/PNG.

## Moderator Actions

Moderators/admins can:

- Verify stolen.
- Reject with a rejection reason.
- Request more information with a note.
- Add internal moderator notes.
- Flag suspicious/fraudulent reports with a reason.
- Clear suspicious/fraud flags.
- Approve owner-submitted recovery requests.
- Reject recovery requests with a note.

## Public Disclosure Rules

Only these statuses are public through vehicle search:

- `VERIFIED_STOLEN`
- `RECOVERED`

These statuses are not publicly disclosed:

- `PENDING`
- `NEEDS_INFO`
- `REJECTED`

## Sighting Reports

Public users can submit sightings only for `VERIFIED_STOLEN` cases.

Required fields:

- Location.
- Message.

Optional fields:

- Reporter name.
- Reporter phone.
- Reporter email.

Duplicate reports with the same case, reporter phone, location, and message are rejected if submitted within five minutes.

## Contact Reveal

Owner phone may be shared only when the case owner opted into public contact sharing.

The UI should continue to warn users that contact details are shared only for vehicle recovery purposes.

## Recovery Review

Owners can request recovery only for `VERIFIED_STOLEN` cases.

Required recovery fields:

- Recovery date.
- Recovery location.
- Recovery circumstances.
- Vehicle condition when found.

Moderator/admin review outcomes:

- Approve: status becomes `RECOVERED`.
- Reject: case remains `VERIFIED_STOLEN` and the recovery rejection note is stored.

## Escalation Criteria

Moderators should flag cases as suspicious when:

- Evidence appears inconsistent with vehicle details.
- Multiple reports appear duplicated or coordinated.
- Police references are malformed or unverifiable.
- Reporter contact details look unreliable.
- Recovery request details conflict with earlier case data.

## Open Policy Questions

- Who has authority to validate police extracts?
- Should rejected cases remain visible to owners indefinitely?
- Should owner phone reveal require a stronger consent step?
- Should partner institutions have direct verification permissions?
