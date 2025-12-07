# UChain-API (Django Backend)

UChain-API is the Django REST backend for the Coffee & Teff Supply Chain system. It exposes authenticated APIs for:

- User registration and authentication (buyer, seller, driver roles)
- Product listing and management
- Order creation, status updates, and tracking
- Payment initialization and verification via **Chapa**

---

## Tech Stack

- **Django 5**
- **Django REST Framework**
- **MySQL** as the primary database
- **Chapa** payment gateway integration

Configuration is driven by environment variables loaded from a local `.env` file.

---

## Requirements

- Python **3.10+**
- MySQL **8+**
- `pip` for dependency management

---

## Setup

From the project root (this folder):

```bash
python -m venv .venv
.\.venv\Scripts\activate   # Windows PowerShell
pip install -r requirements.txt
```

Create your environment file by copying the example:

```bash
copy .env.example .env
```

Then edit `.env` and provide values for:

- `DJANGO_SECRET_KEY` – secret key for Django
- `DJANGO_DEBUG` – `true` or `false`
- `DJANGO_ALLOWED_HOSTS` – comma‑separated list (e.g. `localhost,127.0.0.1`)
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` – MySQL connection
- `CHAPA_PUBLIC_KEY`, `CHAPA_SECRET_KEY` – Chapa API keys
- `CORS_ORIGIN_WHITELIST` – comma‑separated origins allowed to call the API (e.g. `http://localhost:4200`)

> **Important:** Do **not** commit `.env` or real keys to Git. This file is already ignored.

---

## Database & Migrations

Make sure a MySQL database exists matching your `DB_NAME`. Then run:

```bash
python manage.py makemigrations
python manage.py migrate
```

You can create a superuser for admin access:

```bash
python manage.py createsuperuser
```

---

## Run the Development Server

```bash
python manage.py runserver
```

The API will be available at: `http://localhost:8000`

The Angular frontend (`UChain-UI`) is configured to communicate with this backend during local development.

---

## Payments with Chapa

- The backend initializes payment sessions with Chapa and verifies completed payments.
- All communication with Chapa uses the keys stored in `.env`.
- For production, switch to your live Chapa keys and ensure `DJANGO_DEBUG=false` and `DJANGO_ALLOWED_HOSTS` are set appropriately.
