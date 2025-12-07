# Coffee & Teff Supply Chain (UChain)

Blockchain‑inspired platform for transparent Coffee & Teff supply chains in Ethiopia. 

- Buyer, Seller, Driver roles with authentication
- Product listing, orders, and delivery tracking
- Integrated online payments via **Chapa**
- Modern Angular UI and Django REST API

This repository contains **both** the frontend and backend:

- `UChain-UI/` – Angular 19 frontend
- `UChain-API/` – Django + DRF + MySQL backend

---

## Prerequisites

- **Node.js & npm**  
  Recommended: Node **20** or **22** from [nodejs.org](https://nodejs.org/).
- **Angular CLI**  
  ```bash
  npm install -g @angular/cli
  ```
- **Python 3.10+** from [python.org](https://www.python.org/)
- **MySQL 8+** from [dev.mysql.com](https://dev.mysql.com/downloads/)
- **Git** for version control

---

## Quick Start

### 1. Frontend – UChain-UI (Angular)

```bash
cd UChain-UI
npm install
npm start
```

App runs at: `http://localhost:4200`

Build for production:

```bash
npm run build
```

More details: see [`UChain-UI/README.md`](UChain-UI/README.md).

### 2. Backend – UChain-API (Django + DRF)

```bash
cd UChain-API
python -m venv .venv
.\.venv\Scripts\activate   # Windows PowerShell
pip install -r requirements.txt
```

Create your `.env` by copying the template and filling values:

```bash
copy .env.example .env
```

At minimum, configure in `.env`:

- `DJANGO_SECRET_KEY` – your Django secret key
- `DJANGO_DEBUG` – `true` for local development
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` – MySQL connection
- `CHAPA_PUBLIC_KEY`, `CHAPA_SECRET_KEY` – Chapa API keys

Run migrations and start the server:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

API serves at: `http://localhost:8000`

More details: see [`UChain-API/README.md`](UChain-API/README.md).

---

## Security & Secrets

- **Never commit** real secrets (database passwords, Chapa keys, Django secret key).
- Use `.env` for all sensitive values – this file is already ignored by Git.
- The repository only documents **variable names**, not real credentials.

---

## Contributing

Pull requests and issues are welcome. Please open a discussion if you plan significant changes to the UI or payment flow.
