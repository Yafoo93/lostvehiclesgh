# Lost Vehicle Registry Ghana API

This directory contains the Django REST API for Lost Vehicle Registry Ghana.

## Apps

- `accounts`: custom user model with roles: `OWNER`, `MODERATOR`, `ADMIN`, `PARTNER`.
- `vehicles`: vehicle records owned by users.
- `cases`: stolen/missing case workflow, public status search, sighting reports, moderation, and recovery requests.
- `documents`: private case document uploads and metadata.
- `core`: health check and activity logging.

## Environment

The backend loads environment variables from `backend/.env`.

```powershell
Copy-Item ..\.env.example .env
```

Important variables:

- `DJANGO_SECRET_KEY`: required outside local development.
- `DEBUG`: set `True` locally, `False` in production.
- `ALLOWED_HOSTS`: comma-separated hostnames.

## Commands

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000
```

Run tests:

```powershell
python manage.py test
```

## API Base

All API routes are mounted under `/api/`.

- `GET /api/health/`
- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `GET /api/auth/me/`
- `POST /api/auth/token/refresh/`
- `POST /api/auth/token/verify/`
- `GET|POST /api/vehicles/`
- `GET|POST /api/cases/`
- `GET|POST /api/cases/{case_id}/documents/`
- `GET /api/check-vehicle/?vin=...&engine_number=...`

See `docs/API_SPEC.md` for the fuller API contract.
