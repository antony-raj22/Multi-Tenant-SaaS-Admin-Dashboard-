# Multi-Tenant SaaS Admin Dashboard

## Backend

```powershell
cd backend
..\.venv\Scripts\python.exe manage.py migrate
..\.venv\Scripts\python.exe manage.py seed_sample_data
..\.venv\Scripts\python.exe manage.py runserver 8000
```

Use `backend/.env.example` as the environment reference. By default the backend uses SQLite and local memory cache for development.
The seed command creates demo dashboard data and a super admin login: `admin@nexasaas.io` / `Admin@12345`.

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend expects the API at `http://localhost:8000/api`. Override it with `NEXT_PUBLIC_API_URL`.
