# Code Vimarsh — Step-by-Step Code Reading Roadmap

Follow this roadmap **in order** to build a complete mental model of how this application works. Do not skip steps, as later concepts build on earlier ones.

---

## **PHASE 1: The Foundation (Configuration & Entry)**

**Goal:** Understand how the app starts and connects to the outside world.

### Step 1: usage of Environment Variables
- **File:** `backend/.env` (or `.env.example`)
- **Key Items:**
    - `MONGODB_URI`: Database connection.
    - `SUPABASE_URL` / `SUPABASE_ANON_KEY`: Auth service connection.
    - `CLOUDINARY_*`: Image host connection.
- **Why:** Every feature uses these. If these are missing, nothing works.

### Step 2: Backend Entry Point
- **File:** [backend/server.js](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/server.js)
- **Action:** Read from top to bottom.
- **Look for:**
    - `mongoose.connect()`: Database connection.
    - `app.use(cors(...))`: Security rules (who can call this API).
    - `app.use('/api/...', ...)`: Where the routes are defined. **Note usage of `/api/profile`, `/api/admin`, etc.**

### Step 3: Frontend Routes (The Map)
- **File:** [src/App.tsx](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/App.tsx)
- **Action:** improved understanding of the URL structure.
- **Look for:**
    - `<Routes>`: The list of all pages.
    - `element={<AdminProtectedRoute>...}`: How some pages are locked.
    - `SupabaseAuthProvider`: The wrapper that provides login state to the whole app.

---

## **PHASE 2: The Core Mechanism (Authentication)**

**Goal:** Understand how a user logs in and how the Backend knows who they are. **This is the most critical part.**

### Step 4: Frontend Session Handling
- **File:** [src/contexts/SupabaseAuthContext.tsx](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/contexts/SupabaseAuthContext.tsx)
- **Look for:**
    - `supabase.auth.getSession()`: Checks if user is logged in on load.
    - `supabase.auth.onAuthStateChange()`: Listens for login/logout events.
    - `session` object: This contains the `access_token` sent to the backend.

### Step 5: The Bridge (Backend Middleware)
- **File:** [backend/middleware/supabaseAuth.js](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/middleware/supabaseAuth.js)
- **Action:** Read this file carefully line-by-line.
- **Understanding Check:**
    - How does it read the `Authorization` header?
    - How does it verify the token with Supabase?
    - **Crucial:** See how it finds/creates a User in MongoDB (`User.findOne({ supabaseId: ... })`) and attaches it to `req.user`.

---

## **PHASE 3: Feature Deep Dive (Profile System)**

**Goal:** Trace a complete feature from UI button click to Database save.

### Step 6: The Database Model
- **File:** [backend/models/UserProfile.js](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/models/UserProfile.js)
- **Look for:**
    - The Schema fields (`prnNumber`, `class`, `division`).
    - Validations (Regex for PRN, Enums for Division).

### Step 7: The Backend Route
- **File:** [backend/routes/profile.js](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/routes/profile.js)
- **Action:** Find `router.post('/', ...)` (Create/Update Profile).
- **Trace:**
    - It uses `supabaseAuth` middleware (so `req.user` is available).
    - It extracts data from `req.body`.
    - It saves to `UserProfile` collection.

### Step 8: The Frontend API Layer
- **File:** [src/lib/profileApi.ts](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/lib/profileApi.ts)
- **Action:** Look at `createOrUpdateProfile`.
- **Note:** It gets the `token` and sends it in `headers: { Authorization: ... }`.

### Step 9: The UI Component
- **File:** [src/components/ProfileCompletion.tsx](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/components/ProfileCompletion.tsx)
- **Action:** Find `handleSubmit`.
- **Trace:**
    - It gathers form data.
    - It calls `profileAPI.createOrUpdateProfile`.
    - It handles success/error (toast notifications).

---

## **PHASE 4: Admin Power (Separate System)**

**Goal:** See how Admins are handled differently.

### Step 10: Admin Protection
- **File:** [backend/middleware/requireAdmin.js](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/middleware/requireAdmin.js)
- **Compare:** How is this different from `supabaseAuth.js`?
- **Answer:** It verifies a specific `admin-token` secret, not a user session.

### Step 11: Admin Routes
- **File:** [backend/routes/admin.js](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/routes/admin.js)
- **Look for:** `router.get('/dashboard-stats')`. Note it requires `requireAdmin`.

---

## **SUMMARY: The Mental Model**

1.  **User Visits Site** -> `App.tsx` loads.
2.  **User Logs In** -> `SupabaseAuthContext` gets a session token.
3.  **User Views Profile** -> Component calls `profileApi`.
4.  **API Call** -> Sends HTTP GET with `Bearer <token>` to Backend.
5.  **Backend Middleware** -> `supabaseAuth` validates token & loads User from Mongo.
6.  **Backend Route** -> `profile.js` reads UserProfile from Mongo.
7.  **Response** -> JSON data sent back to Frontend.

---

## **Quick Reference: The File Reading List**

If you just want the list of files to open in order:

1.  [`backend/.env`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/.env) (Config)
2.  [`backend/server.js`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/server.js) (Server Entry)
3.  [`src/App.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/App.tsx) (Frontend Routes)
4.  [`src/contexts/SupabaseAuthContext.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/contexts/SupabaseAuthContext.tsx) (Frontend Auth)
5.  [`backend/middleware/supabaseAuth.js`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/middleware/supabaseAuth.js) (Backend Auth)
6.  [`backend/models/UserProfile.js`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/models/UserProfile.js) (Database Schema)
7.  [`backend/routes/profile.js`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/routes/profile.js) (API Route)
8.  [`src/lib/profileApi.ts`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/lib/profileApi.ts) (Frontend API Client)
9.  [`src/components/ProfileCompletion.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/components/ProfileCompletion.tsx) (UI Component)
10. [`backend/middleware/requireAdmin.js`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/middleware/requireAdmin.js) (Admin Auth)
11. [`backend/routes/admin.js`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/routes/admin.js) (Admin Routes)

### **Frontend Core & Utils**
12. [`src/main.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/main.tsx) (App Bootstrap)
13. [`src/components/Navbar.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/components/Navbar.tsx) (Global Navigation)
14. [`src/lib/apiClient.ts`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/lib/apiClient.ts) (Base API Client)

### **Feature: Events**
15. [`src/pages/AllEvents.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/pages/AllEvents.tsx) (Events Page)
16. [`backend/routes/events.js`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/routes/events.js) (Events API)
17. [`backend/models/Event.js`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/models/Event.js) (Event Model)

### **Feature: Teams**
18. [`src/pages/TeamPage.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/pages/TeamPage.tsx) (Teams Page)
19. [`backend/routes/teams.js`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/routes/teams.js) (Teams API)
20. [`backend/models/Team.js`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/models/Team.js) (Team Model)

### **Feature: Admin Dashboard**
21. [`src/pages/AdminDashboard.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/pages/AdminDashboard.tsx) (Admin UI)
22. [`src/lib/adminApi.ts`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/lib/adminApi.ts) (Admin API Client)
23. [`backend/routes/admin.js`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/routes/admin.js) (Admin API)

### **Auth Pages**
24. [`src/components/SignIn.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/components/SignIn.tsx) (Login Page)
25. [`src/pages/EmailVerification.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/pages/EmailVerification.tsx) (Verify Email)

### **Landing Page Components**
26. [`src/pages/Index.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/pages/Index.tsx) (Home Page Container)
27. [`src/components/HeroSection.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/components/HeroSection.tsx) (Hero Banner)
28. [`src/components/AboutSection.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/components/AboutSection.tsx) (About Info)
29. [`src/components/EventsSection.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/components/EventsSection.tsx) (Event Previews)
30. [`src/components/TeamSection.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/components/TeamSection.tsx) (Team Previews)
31. [`src/components/ContactSection.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/components/ContactSection.tsx) (Contact Form)
32. [`src/components/Footer.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/components/Footer.tsx) (Footer)
33. [`src/components/ResourcesSection.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/components/ResourcesSection.tsx) (Resources)
34. [`src/components/AnimatedBackground.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/components/AnimatedBackground.tsx) (Visuals)

### **Advanced Auth & Recovery**
35. [`src/contexts/AdminAuthContext.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/contexts/AdminAuthContext.tsx) (Admin Session)
36. [`src/pages/ForgotPassword.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/pages/ForgotPassword.tsx) (Forgot Password)
37. [`src/pages/ResetPassword.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/pages/ResetPassword.tsx) (Reset Password)
38. [`src/pages/OTPVerification.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/pages/OTPVerification.tsx) (OTP UI)
39. [`backend/routes/adminAuth.js`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/routes/adminAuth.js) (Admin Login API)
40. [`backend/routes/auth.js`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/routes/auth.js) (General Auth API)

### **Detailed Components & Models**
41. [`src/components/ProfileManagement.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/components/ProfileManagement.tsx) (View Profile UI)
42. [`src/components/ProfileGuard.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/components/ProfileGuard.tsx) (Profile Protection)
43. [`src/components/JoinUs.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/components/JoinUs.tsx) (Join UI)
44. [`backend/models/User.js`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/models/User.js) (Core User Model)
45. [`backend/models/TeamMember.js`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/models/TeamMember.js) (Team Member Model)
46. [`backend/models/EventRegistration.js`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/backend/models/EventRegistration.js) (Event Reg Model)

### **Helpers & Config**
47. [`src/lib/eventsApi.ts`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/lib/eventsApi.ts) (Events Fetcher)
48. [`src/lib/teamsApi.ts`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/lib/teamsApi.ts) (Teams Fetcher)
49. [`src/lib/supabaseClient.ts`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/lib/supabaseClient.ts) (Supabase Config)
50. [`src/components/AdminGate.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/components/AdminGate.tsx) (Admin Gate)
51. [`src/components/AdminProtectedRoute.tsx`](file:///e:/Krushit_ALL/WebDevelopment/Vimarsh/kinetic-vimarsh-forge-main/src/components/AdminProtectedRoute.tsx) (Admin Route Guard)
