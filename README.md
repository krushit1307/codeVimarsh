# Code Vimarsh

Full-stack MERN application with:

- **Frontend**: Vite + React + TypeScript + Tailwind + shadcn/ui
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas
- **Auth**: Supabase Auth
- **Media**: Cloudinary (direct client uploads via backend-signed signature)

## Live URLs

- **Frontend (Vercel)**: `https://code-vimarsh.vercel.app`
- **Backend (Render)**: `https://<your-render-service>.onrender.com`

## Repo structure

- `src/` Frontend (Vite)
- `backend/` Backend (Express)
- `vercel.json` SPA rewrites so routes like `/verify-email` and `/reset-password` work on Vercel

## Local development

### 1) Frontend

```bash
npm install
npm run dev
```

Frontend runs on Vite (usually `http://localhost:5173`).

### 2) Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:5000` by default.

## Environment variables

### Frontend (`.env`)

Create `.env` in the repo root:

```bash
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SUPABASE_URL=__YOUR_SUPABASE_URL__
VITE_SUPABASE_ANON_KEY=__YOUR_SUPABASE_ANON_KEY__
VITE_APP_URL=http://localhost:5173
```

### Backend (`backend/.env`)

Create `backend/.env`:

```bash
NODE_ENV=development
PORT=5000

MONGODB_URI=__YOUR_MONGODB_ATLAS_URI__

JWT_SECRET=__YOUR_JWT_SECRET__
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173

SUPABASE_URL=__YOUR_SUPABASE_URL__
SUPABASE_ANON_KEY=__YOUR_SUPABASE_ANON_KEY__

ADMIN_NAME=__ADMIN_NAME__
ADMIN_EMAIL=__ADMIN_EMAIL__
ADMIN_PASSWORD=__ADMIN_PASSWORD__
ADMIN_JWT_EXPIRES_IN=12h

CLOUDINARY_CLOUD_NAME=__CLOUD_NAME__
CLOUDINARY_API_KEY=__API_KEY__
CLOUDINARY_API_SECRET=__API_SECRET__

SEED_DEFAULT_EVENTS=false
```

## Deployment

### Backend (Render)

1. Create a **Web Service** from this GitHub repo.
2. Set **Root Directory** to `backend`.
3. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add Render environment variables (same keys as `backend/.env` above), especially:
   - `MONGODB_URI`
   - `FRONTEND_URL=https://code-vimarsh.vercel.app`
   - Supabase + Cloudinary credentials
5. Deploy and verify:
   - `GET /api/health` → `https://<your-render-service>.onrender.com/api/health`

### Database (MongoDB Atlas)

1. Create a cluster and database user.
2. Copy the Atlas connection string into `MONGODB_URI`.
3. Ensure **Network Access** allows your server to connect (common dev option is `0.0.0.0/0`).

### Frontend (Vercel)

1. Import the GitHub repo into Vercel.
2. Add Vercel environment variables:
   - `VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api`
   - `VITE_SUPABASE_URL=...`
   - `VITE_SUPABASE_ANON_KEY=...`
   - `VITE_APP_URL=https://code-vimarsh.vercel.app`
3. Deploy.

## Supabase configuration (email verification + reset password)

Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://code-vimarsh.vercel.app`
- **Redirect URLs**:
  - `https://code-vimarsh.vercel.app/*`
  - (optional local) `http://localhost:5173/*`

## Notes

- **SPA routing on Vercel**: `vercel.json` rewrites all routes to `index.html` so direct links from email work.
- **Cloudinary uploads**: client uploads directly to Cloudinary using a signature from the backend.
- **Seeding**: event seeding only runs when `SEED_DEFAULT_EVENTS=true`.

## Troubleshooting

- **CORS errors**: confirm Render `FRONTEND_URL` matches your deployed frontend exactly.
- **MongoDB connection errors**: verify `MONGODB_URI` and Atlas Network Access.
- **Supabase email links opening localhost**: check Supabase Site URL/Redirect URLs and resend a new email.
