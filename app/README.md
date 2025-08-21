
# POS React Frontend

A minimalist, friendly POS frontend built with React + Vite + TypeScript, Tailwind, React Router, Zustand, react-hook-form and i18next. 
- Light & dark themes (system-aware) and accent color personalization
- Role & permission guard (RBAC) for routes and UI
- Sections: Dashboard, Sales (POS), Inventory, Customers, Users, Settings, Personalization
- Multilanguage (ES/EN) with keys and easy extension
- API-ready: set `VITE_API_URL` to your Node backend

## Quickstart
```bash
pnpm i    # or npm i / yarn
cp .env.example .env
# edit .env to point to your API
pnpm dev
```
