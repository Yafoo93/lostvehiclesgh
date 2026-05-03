# Lost Vehicle Registry Ghana

Lost Vehicle Registry Ghana is a Django REST API and Next.js web app for reporting, moderating, and publicly checking stolen or missing vehicle cases in Ghana.

The current product supports:

- Public vehicle status search by VIN or engine number.
- Public sighting reports for verified stolen vehicles.
- Owner registration, login, vehicle management, and case submission.
- Police extract and vehicle photo uploads for cases.
- Moderator/admin review workflows for verifying stolen cases, rejecting cases, requesting more information, flagging suspicious reports, and approving or rejecting recovery requests.
- Basic audit logging for important case actions.

## Tech Stack

- Backend: Django 5.2, Django REST Framework, Simple JWT, SQLite in the current settings.
- Frontend: Next.js 16, React 19, TypeScript.
- Auth: JWT access/refresh tokens stored by the frontend in local storage.
- File uploads: Django local media storage under `backend/media/`.

## Repository Layout

```text
backend/                 Django API project
frontend/                Next.js app
docs/                    Product, API, security, moderation, privacy, and roadmap docs
infrastructure/          Docker Compose, Dockerfiles, and Nginx config
```

## Local Development

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item ..\.env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000
```

The API health check should respond at `http://127.0.0.1:8000/api/health/`.

### Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

The app should be available at `http://localhost:3000`.

## Key URLs

- Public search: `/`
- Login: `/auth/login`
- Register: `/auth/register`
- Owner dashboard: `/dashboard`
- Add vehicle: `/dashboard/vehicles/new`
- Create case: `/dashboard/cases/new`
- Moderation dashboard: `/dashboard/moderation`

## Tests

Run backend tests from the backend directory:

```powershell
python manage.py test
```

The current automated coverage focuses on public vehicle disclosure rules, case moderation decisions, police extract requirements, and document upload validation.

## Docker

Development compose file:

```powershell
docker compose -f infrastructure/docker-compose.dev.yml up --build
```

Production compose template:

```powershell
docker compose -f infrastructure/docker-compose.prod.yml up --build
```

The current Docker setup mirrors the current app settings. It does not yet add PostgreSQL, object storage, background workers, or hardened static/private media delivery.

## Current Constraints

- Production database configuration is not implemented yet; the current Django settings use SQLite.
- SMS, email, and in-app notifications are represented as TODO payloads in the sighting flow.
- Partner workflows and OTP verification screens are planned or stubbed, not fully implemented.
- Uploaded files are private by model flag, but local development media is served directly while `DEBUG=True`.

See [docs/ROADMAP.md](docs/ROADMAP.md) for the implementation plan.
