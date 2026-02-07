# Code Vimarsh — End-to-End Code Walkthrough (Read From Start to End)

This document is a **single place** you can read to understand the Code Vimarsh codebase from **entry points → core systems → feature flows → deployment**.

---

## 0) What this project is

**Code Vimarsh** is a full-stack MERN app:

- **Frontend**: Vite + React + TypeScript + Tailwind + shadcn/ui
- **Backend**: Node.js + Express
- **Database**: MongoDB (Atlas)
- **Auth**: Supabase Auth (frontend session token), plus **Admin JWT** for admin panel
- **Media**: Cloudinary (profile images, admin uploads)

The key mental model:

- Frontend gets a Supabase access token
- Frontend calls backend endpoints with `Authorization: Bearer <token>`
- Backend validates token via Supabase and maps it to a MongoDB `User`
- Backend reads/writes MongoDB models (`UserProfile`, `Event`, `Team`, etc.)

---

## 1) Repository layout (what lives where)

- `src/`
  - React frontend code
- `backend/`
  - Express backend code

Important subfolders:

### Frontend (`src/`)

- `src/main.tsx`
  - React app bootstrap (mounts the app)
- `src/App.tsx`
  - Route definitions (which page loads for which URL)
- `src/pages/*`
  - “Page” components for routes (Admin Dashboard, etc.)
- `src/components/*`
  - Reusable UI blocks (Navbar, Profile screens, modals)
- `src/contexts/*`
  - Auth/session contexts (Supabase user, Admin)
- `src/lib/*`
  - API clients (calls to backend), Supabase client

### Backend (`backend/`)

- `backend/server.js`
  - Express app entry point + middleware + route mounting
- `backend/routes/*`
  - Express route modules (profile/admin/auth/events/teams)
- `backend/models/*`
  - Mongoose schemas/models (User, UserProfile, Event, etc.)
- `backend/middleware/*`
  - Auth middleware (`supabaseAuth`, `requireAdmin`)

---

## 2) Environment variables (how frontend knows backend URL)

### Frontend

Frontend uses:

- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`

In production, **`VITE_API_BASE_URL` must be your deployed backend URL**.

### Backend

Backend uses:

- `MONGODB_URI`
- `FRONTEND_URL` (CORS)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `CLOUDINARY_*`
- Admin credentials / JWT secret

---

## 3) Frontend entry points: “How the app starts”

### 3.1 `src/main.tsx`

- Creates the React root.
- Wraps the app with providers (router, query client, context providers) depending on current setup.

What to learn here:

- Which providers exist (React Query, contexts)
- How routing is enabled

### 3.2 `src/App.tsx`

This is the **URL → Page** mapping.

When you visit a URL like:

- `/profile`
- `/admin`

`App.tsx` decides which component renders.

---

## 4) Core frontend systems

### 4.1 Supabase auth context

File: `src/contexts/SupabaseAuthContext.tsx`

Responsibilities:

- Keeps track of logged-in user session
- Provides `user`, `session`, `isLoading`, `signOut` to components

Where it’s used:

- Profile pages (need user)
- Navbar (user menu)

### 4.2 Admin auth context

File: `src/contexts/AdminAuthContext.tsx`

Responsibilities:

- Stores admin token in `localStorage` (key: `adminToken`)
- Calls backend admin auth endpoints
- Determines whether current user is admin

### 4.3 API calling style

There are **multiple API clients** in this repo:

- `src/lib/apiClient.ts` (generic helper for requests)
- `src/lib/adminApi.ts` (admin endpoints)
- `src/lib/profileApi.ts` (profile endpoints)

All should use:

- `VITE_API_BASE_URL` (falls back to `http://localhost:5000/api` for local dev)

---

## 5) Backend entry point: “How the server starts”

File: `backend/server.js`

Responsibilities:

- Connects to MongoDB
- Enables CORS
- Parses JSON
- Mounts routes under `/api/*`

Important section:

- CORS allowlist must include:
  - local origins (`http://localhost:5173`, `http://127.0.0.1:5173`)
  - deployed frontend origin via `FRONTEND_URL`

---

## 6) The most important backend middleware: Supabase → Mongo user

File: `backend/middleware/supabaseAuth.js`

When frontend calls protected routes (like `/api/profile`), it sends:

- `Authorization: Bearer <supabase_access_token>`

This middleware:

1. Reads token from header
2. Calls Supabase `auth.getUser(token)`
3. Gets Supabase user info (email + metadata)
4. Finds or creates a MongoDB `User` document
5. Attaches it to `req.user`

Why this matters:

- If `req.user` is wrong or missing, profile data won’t save/fetch.

---

## 7) Feature walkthroughs (read like stories)

### 7.1 Feature: Profile Management (View profile)

Frontend UI files:

- `src/components/ProfileManagement.tsx`
- `src/components/ProfileGuard.tsx`

Frontend API:

- `src/lib/profileApi.ts`

Backend:

- `backend/routes/profile.js`
- `backend/models/UserProfile.js`

Flow (GET):

1. UI loads Profile page
2. Calls `profileAPI.getProfile()`
3. `GET /api/profile` with Supabase token
4. Backend middleware sets `req.user`
5. Backend reads `UserProfile` by `req.user._id`
6. Returns profile (or `null`)

### 7.2 Feature: Profile Completion (Create / Update)

Frontend UI:

- `src/components/ProfileCompletion.tsx`

Flow (POST):

1. User fills profile form
2. Calls `profileAPI.createOrUpdateProfile(formData)`
3. `POST /api/profile` with Supabase token
4. Backend validates fields
5. Backend upserts a `UserProfile` document for `req.user._id`
6. Returns updated profile

### 7.3 Feature: Profile image upload

Frontend:

- `ProfileCompletion.tsx` calls `profileAPI.uploadImage(base64)`

Backend:

- `POST /api/profile/upload-image`

Flow:

1. UI reads image and converts to base64
2. Sends base64 to backend
3. Backend uploads to Cloudinary
4. Backend returns `secure_url`
5. UI stores `profileImage` URL in profile form

Common problems:

- Wrong `VITE_API_BASE_URL` on deployed site → "Network error"
- Missing Cloudinary env vars on backend
- CORS misconfiguration

### 7.4 Feature: Admin Dashboard

Frontend:

- `src/pages/AdminDashboard.tsx`
- `src/lib/adminApi.ts`

Backend:

- `backend/routes/admin.js`
- `backend/middleware/requireAdmin.js`

Flow:

1. Admin logs in
2. `adminToken` is stored
3. Admin pages call endpoints with `Authorization: Bearer <adminToken>`
4. Backend `requireAdmin` validates admin JWT

---

## 8) How to understand any page fast (debug technique)

When you open a page and want to understand it:

1. Identify the page file in `src/pages/*` (or component in `src/components/*`)
2. Search within the file for:
   - `useQuery` / `useMutation` (data fetching)
   - `api.*` calls (`profileAPI`, `adminApi`)
   - submit handlers (`handleSubmit`)
3. For each API call, jump to the API client function
4. Find the backend endpoint string (like `/profile`)
5. Jump to the backend route file in `backend/routes/*`
6. See which Mongoose model is used

This gives you full understanding without reading everything.

---

## 9) Key “map” of the codebase

### Frontend high-value files

- `src/main.tsx`
- `src/App.tsx`
- `src/components/Navbar.tsx`
- `src/components/ProfileManagement.tsx`
- `src/components/ProfileCompletion.tsx`
- `src/pages/AdminDashboard.tsx`
- `src/lib/apiClient.ts`
- `src/lib/profileApi.ts`
- `src/lib/adminApi.ts`
- `src/contexts/SupabaseAuthContext.tsx`
- `src/contexts/AdminAuthContext.tsx`

### Backend high-value files

- `backend/server.js`
- `backend/middleware/supabaseAuth.js`
- `backend/middleware/requireAdmin.js`
- `backend/routes/profile.js`
- `backend/routes/admin.js`
- `backend/models/User.js`
- `backend/models/UserProfile.js`

---

## 10) Deployment understanding

### Frontend (Vercel)

Must set:

- `VITE_API_BASE_URL=https://<backend-domain>/api`

### Backend (Render)

Must set:

- `FRONTEND_URL=https://<frontend-domain>`
- MongoDB, Supabase, Cloudinary env vars

If profile saving fails on production:

- 80% chance: wrong API base URL on frontend
- 20% chance: CORS / backend env / Cloudinary missing

---

## 11) Your next learning steps (recommended)

Read and trace in this exact order:

1. `src/App.tsx` (routes)
2. `src/contexts/SupabaseAuthContext.tsx` (user session)
3. `src/lib/profileApi.ts` (how profile API calls are made)
4. `backend/middleware/supabaseAuth.js` (token → Mongo user)
5. `backend/routes/profile.js` + `backend/models/UserProfile.js` (profile CRUD)
6. `src/pages/AdminDashboard.tsx` + `backend/routes/admin.js` (admin)

---

## 12) If you want a guided walkthrough

Tell me one feature you want to learn first:

- Profile
- Auth
- Admin
- Events/Teams

I’ll explain that feature line-by-line and diagram the flow.
