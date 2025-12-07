# UChain-UI (Angular Frontend)

UChain-UI is the Angular frontend for the Coffee & Teff Supply Chain system. It provides role‑based dashboards and flows for buyers, sellers, and drivers, including product browsing, ordering, delivery tracking, and payment confirmations.

---

## Tech Stack

- **Angular 19**
- **Angular Material**
- **Leaflet** for map visualizations
- **ApexCharts / ngx-charts** for dashboards
- **Sass** for theming based on the RedStar admin template

The app communicates with the Django backend at `UChain-API` over HTTP.

---

## Requirements

- Node.js **20** or **22**
- npm
- Angular CLI (globally):

```bash
npm install -g @angular/cli
```

---

## Setup & Run

Install dependencies:

```bash
cd UChain-UI
npm install
```

Start the dev server:

```bash
npm start
```

Then open: `http://localhost:4200`

The frontend expects the backend API to be available (by default at `http://localhost:8000`). You can adjust the API base URL in the Angular environment files under `src/environments/`.

---

## Build

Create a production build:

```bash
npm run build
```

The build output will be written to `dist/dark/`.

> Note: You may see Sass deprecation warnings (for `@import`, `darken`, `transparentize`, etc.). These do **not** affect the current build and will be addressed in a future UI template refactor.

---

## Environment & Secrets

- The frontend itself does **not** store secrets.
- Backend credentials and Chapa keys live in the backend `.env` file (see `UChain-API/README.md`).
- Only non‑sensitive configuration (like API base URL) should be stored in the Angular environment files.