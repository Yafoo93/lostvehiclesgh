# STOLEN VEHICLE REGISTRY GHANA PROJECT REQUIREMENTS DOCUMENT (PRD)

Version 1.0
Prepared By: Kassim Mutawakil

## 1. Project Overview

### 1.1 Project Name

Lost Vehicle Registry Ghana (LVR-GH)

### 1.2 Description

LVR-GH is a web-based platform that allows vehicle owners to report stolen or missing vehicles using verified police extracts. Car buyers, dealers, insurers, and the general public can search for a vehicle using its plate number, VIN, or engine number to determine if it has been reported stolen.
The system supports a secure moderation workflow where trained reviewers validate uploaded police documents before a case becomes publicly viewable.

## 2. Goals & Objectives
### 2.1 Primary Goals
Enable vehicle owners to report stolen or missing cars online using evidence.
Provide a secure, trustworthy public search tool for buyers and dealers.
Assist in the reduction of vehicle theft by creating an accessible national registry.
Support moderators to verify claims and prevent false reporting.
Help car buyers to buy a genuine car.
To help stolen car victims to trace and find their car

### 2.2 Secondary Goals
 Build a digital evidence trail accessible by law enforcement upon request.
Support insurers with reliable stolen-vehicle status checks.
Provide APIs for partners (dealers, insurers, banks).
Maintain full compliance with the Ghana Data Protection Act (Act 843).

## 3.Scope

### 3.1 In Scope

Web platform (mobile responsive)
Authentication (email/phone + OTP)
Vehicle reporting workflow
Document uploads (police extract, photos)
Case moderation with approval/rejection workflow
Public vehicle status search
Notifications (email/SMS)
Partner dashboard & API
Audit logs and monitoring
Secure storage for documents and images

### 3.2 Out of Scope (for MVP)
Integration with Ghana Police systems
Integration with DVLA or customs
Mobile app (later phase)
Blockchain or decentralized storage
Real-time GPS tracking or IoT integrations

## 4.Stakeholders
 Stakeholder 	Role
Victims (Vehicle Owners)	Submit stolen vehicle reports & evidence
Moderators/Admins	Verify cases, manage users, handle disputes
Public Users	Search vehicle status
Dealers/Insurers/Banks	Bulk search, API access
System Owner (Kassim)	Product owner, manager
Developers	Build, deploy, maintain system
Law Enforcement (supporting role)	Optionally validate official records 

## 5. User Roles & Permissions

### 5.1 Public User
Search VIN/engine number
View minimal case info

### 5.2 Registered User (Vehicle Owner)
Submit new stolen/missing case
Upload police extract + images
Manage their cases
Mark vehicle recovered (requires moderation)

### 5.3 Moderator
Review & validate cases
Review police extracts
Approve or reject cases
Add comments and mark suspicious activity

### 5.4 Admin
All moderator rights
Manage users
Manage partners
Configure system settings
View analytics
View all audit logs

### 5.5 Partner (Dealer, Insurer, Bank)
Bulk search
Use API for automated verification
Manage API keys

## 6.Functional Requirements

### 6.1 User Authentication
Register via email or phone number
OTP verification (SMS or email)
Login with password or magic link
Reset password via email/OTP
Account lockout after failed attempts
Multi-factor authentication for moderators

### 6.2 Stolen Vehicle Reporting

Users must be able to:

#### 1. Enter vehicle details:
Plate number
VIN
Engine number
Make, model, color
Year
Last-seen location
Date of incident
Police Station the Case is being investigated
Description of events

#### 2. Upload:
   Police extract (mandatory)
Photos of the vehicle (optional)

#### 3. Submit case for moderation:
   Status = Pending Review
User receives notification

#### Validation:
Plate format (Ghana formats)
VIN 11–17 characters
File size limits (max 5MB/document)
Allowed file types: JPG, PNG, PDF

### 6.3 Moderation Workflow

#### Moderators can:
View list of pending cases
Zoom/preview police extract
Validate police station name
Validate case number format
Compare data with uploaded details
Approve case → status becomes Verified Stolen
Reject case → store rejection reason
Request more info from user
Tag suspicious/fraudulent cases
Every moderation action is logged.

### 6.4 Public Vehicle Search

Public users can search via:
VIN
Engine number

Search results return:

Status: No Record / Verified Stolen / Recovered
Vehicle make, model, year, color
Case ID
Last updated date
“Vehicle Found” button
Police Station the case is being investigated.
Owner's Name
Phone number of the owner shown with his/her consent.
circumstance leading to the missing of the car.

### 6.5 Vehicle found work flow
1. A User searches vehicle's VIN or Engine number and found it listed stolen
2. He presses the "I found this vehicle" button
3. User submits short sighting report including location, message, optional phone/email
4. Owner and Moderator get notification
5. user then click the show owner phone number button and of consent was given, the owners number displays.
6. Before showing phone, the system Displays message “This contact is shared for recovery purposes only. Misuse may result in legal action.” then the button “Reveal Contact”.



### 6.6 Case Management (Owner)

Owners can:
View all their reports
Update case details (limited fields)
Upload additional photos
Request "Recovered" status
“Recovered” is not auto-approved — moderators verify it.

### 6.7 Notifications

System must send:
Case submission confirmation
Case approval/rejection
Recovery approval
Moderator messages
Vehicle found
Channels: Email, SMS.

## 7. Non-Functional Requirements

### 7.1 Security
HTTPS enforced
Sensitive fields encrypted at rest
Documents stored privately (presigned URLs)
Rate limiting on search endpoints
Captcha for heavy users
Audit logs for every sensitive action
Input validation & sanitization
Regular penetration testing

### 7.2 Privacy
Must comply with Ghana Data Protection Act
Public cannot view:
Police extract
Owner phone number is not shown in normal public search results, but may be revealed after a sighting report and warning screen if the owner explicitly consented.

### 7.3 Performance
Public searches must respond < 1 second under normal load
API must handle 100–500 searches per second with caching
Background jobs must not block API performance

### 7.4 Reliability
Daily backups of PostgreSQL
Object storage redundancy
Automatic retry for SMS/email failures
Uptime target: 99.5%

### 7.5 Scalability
Horizontal scaling of:
API servers
Worker servers
DB read replicas for search-heavy traffic
Object storage auto-scale

### 7.6 Auditability
Every update to vehicle, case, user, or document must have an audit record:

  actor_id
Timestamp
before/after values
IP address

## 8. System Architecture Summary
Backend: Django REST Framework
Frontend: Next.js
Database: PostgreSQL
Storage: AWS S3
Cache: Redis
Workers: Celery
Hosting: Render
CDN & Security: Cloudflare

## 10. Risks & Mitigation
Risk 1: Fake reports
Mitigation: Mandatory police extract, manual moderation.

Risk 2: Defamation & legal liability
Mitigation: Terms of use, disclaimers, audit logs.

Risk 3: Data leakage
Mitigation: Strict PII access rules, encrypted storage.

Risk 4: Abuse of public search
Mitigation: Rate limits, Captcha, throttling.

Risk 5: Criminal misuse
Mitigation: Only minimal public data shown.

## 11. Future Enhancements (Post-MVP)
USSD/SMS verification
Mobile apps (Android first)
DVLA integration
Police API integration
Vehicle recovery network
Machine learning fraud detection
Public notifications/alerts
Dealer verification badge

## 12. Success Criteria
The project is successful if:
Vehicle owners adopt it for reporting stolen cars
Dealers/insurers actively check records
Police acknowledge it as credible
False reports remain under 5%
Case moderation averages < 24 hours
System uptime > 99%

## 13. Deliverables
Backend API
Next.js frontend
Admin dashboard
Moderation dashboard
Database schema
Storage bucket setup
Notification system
Partner API
Documentation (tech + user manuals)
Deployment scripts












## 14. Current Implementation Status

This section reflects the current codebase and highlights where implementation differs from or only partially satisfies the full PRD.

### 14.1 Implemented User Flows

#### Public Search

1. User enters VIN and/or engine number.
2. API checks public cases only.
3. If no verified stolen or recovered case exists, the app returns no public record.
4. If a verified stolen case exists, the app shows vehicle summary and case summary.
5. User can submit a sighting report.
6. User can reveal owner phone only if the owner allowed public contact and a sighting exists.

#### Owner Onboarding

1. Owner registers with username, email, optional name, optional phone, and password.
2. Owner logs in with username or email.
3. Frontend stores JWT tokens in local storage.

#### Owner Vehicle And Case Management

1. Owner adds a vehicle with plate number, make, model, optional VIN, optional engine number, optional year, and optional color.
2. Owner creates a case for one of their vehicles.
3. Owner submits police station, police case number, incident date, optional location, optional description, public contact consent, police extract, and optional vehicle photos.
4. Owner dashboard shows vehicles, latest cases, sighting reports, and recovery request controls.

#### Moderation

1. Moderator/admin opens moderation dashboard.
2. Moderator/admin filters cases by status or recovery-submitted state.
3. Moderator/admin reviews vehicle details, case details, documents, notes, suspicious flag, and recovery details.
4. Moderator/admin can verify stolen, reject, request more info, update internal notes, flag suspicious, approve recovery, or reject recovery.

#### Recovery

1. Owner with a `VERIFIED_STOLEN` case submits recovery date, location, circumstances, vehicle condition, and optional notes.
2. Moderator/admin approves the recovery and marks the case `RECOVERED`, or rejects the recovery request with a note.

### 14.2 Implemented Functional Requirements

- Public search must require VIN or engine number.
- Pending and rejected cases must not be publicly disclosed.
- Final moderation decisions to verify or reject a case must require a police extract document.
- Owners must only create cases for their own vehicles unless they are moderators/admins.
- Sighting reports must only be accepted for verified stolen cases.
- Duplicate sightings within five minutes should be rejected when case, reporter phone, location, and message match.
- Documents must be capped at 5 MB and constrained by document type.
- Moderator-only fields must not be shown to ordinary owners.

### 14.3 Implemented Non-Functional Requirements

- API responses should use consistent DRF pagination for list endpoints.
- Public endpoints should be throttled.
- Sensitive uploaded documents should be treated as private.
- Moderation and recovery actions should be audit logged.
- Environment setup should work locally with SQLite.

### 14.4 Not Yet Implemented

- Production PostgreSQL settings.
- SMS/email/in-app notification delivery.
- Partner-specific workflows.
- OTP verification despite the current frontend route.
- Public unauthenticated missing-vehicle report flow.
- Private signed document download endpoints.
- Frontend automated tests.

KASSIM MUTAWAKIL
