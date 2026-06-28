# Ment-X Production Deployment Guide

This guide explains in simple English how the Ment-X platform is set up and deployed in the cloud for free ($0 cost) with full security. Use this document as a future reference when redeploying or configuring the application.

---

## The Big Picture (How it works)

Ment-X is divided into three separate parts:
1. **The Database (Neon)**: Stores all users, tasks, updates, and scores securely.
2. **The Backend API (Render)**: The Java Spring Boot engine that processes logic, hashes passwords, verifies roles, and talks to the database.
3. **The Frontend Website (Vercel)**: The React user interface that users interact with.

```
[Web Browser] ──(HTTPS)──> [Vercel Frontend]
     │
     └──(API Requests)──> [Render Backend] ──(SSL JDBC)──> [Neon Database]
```

---

## Step 1: Database Setup (Neon PostgreSQL)

We use **Neon** because it offers a serverless PostgreSQL database with automated backups and SSL encryption for free.

1. Create a project named `Ment-X` on Neon.
2. Choose Postgres version **18** and region **US East (N. Virginia)**.
3. Keep the **Authentication Service unchecked** (we use our own Java security).
4. Get your connection string. It will look like:
   `postgresql://neondb_owner:PASSWORD@ep-host.us-east-1.aws.neon.tech/neondb?sslmode=require`
5. Convert this into a **JDBC connection string** for the Java backend by replacing `postgresql://` with `jdbc:postgresql://`:
   `jdbc:postgresql://ep-host.us-east-1.aws.neon.tech/neondb?sslmode=require`

---

## Step 2: Backend Setup (Render Web Service)

We use **Render** to run our Spring Boot backend. It builds the project automatically using the custom `backend/Dockerfile` we created.

1. Push your repository to a private GitHub repo.
2. Create a new **Web Service** on Render and connect your repository.
3. Configure the settings:
   * **Name**: `mentx-backend`
   * **Language**: `Docker` (tells Render to look for our `Dockerfile`)
   * **Region**: `US East (Virginia)` or `US East (Ohio)` (matches database region to keep connection speeds fast)
   * **Root Directory**: `backend` (tells Render that the Java code is inside the `backend` folder)
   * **Instance Type**: `Free`
4. Add these **Environment Variables** in Render settings:
   * `SPRING_DATASOURCE_URL` = Your JDBC URL from Step 1
   * `SPRING_DATASOURCE_USERNAME` = `neondb_owner`
   * `SPRING_DATASOURCE_PASSWORD` = Your Neon Password
   * `JWT_SECRET` = A long secure random password of your choice (used to sign user login tokens)
   * `SEED_ADMIN_EMAIL` = `admin@mentx.com` (Master admin login)
   * `SEED_ADMIN_PASSWORD` = `Ash@adminMent-X` (Master admin password)
   * `BYPASS_SUNDAY_RESTRICTION` = `false` (forces actual production Sunday rule for task updates)
   * `BYPASS_DEADLINE_RESTRICTION` = `false` (forces task deadline validation)
   * `FRONTEND_URL` = `https://ment-x.vercel.app` (tells backend to trust requests coming from this website domain)

---

## Step 3: Frontend Setup (Vercel Static Hosting)

We use **Vercel** to host the React UI. It serves the files using a global CDN with built-in DDoS protection.

1. Create a new project on Vercel and import your GitHub repository.
2. Configure the settings:
   * **Root Directory**: `frontend`
   * **Framework Preset**: `Vite` (detected automatically)
3. Add this **Environment Variable** in Vercel settings:
   * `VITE_API_BASE_URL` = `https://mentx-backend.onrender.com` (your Render backend URL)
4. Click **Deploy**. Vercel will build your website and generate a live URL (e.g. `https://ment-x.vercel.app`).

---

## Critical Fixes Added for Production

### 1. Hardcoded Password Seeder (Security)
* **Problem**: Storing the seed administrator password directly in the code is unsafe.
* **Fix**: Parameterized the `DatabaseSeeder.java` and `application.properties` to read from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` environment variables.

### 2. Vercel 404 Page Reload Error (SPA Routing)
* **Problem**: Because React is a Single Page Application, direct links like `/login` or `/register` return a Vercel 404 error when loaded directly.
* **Fix**: Created `frontend/vercel.json`. This tells Vercel to route all traffic back to `index.html` and let the React code handle the routing:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```

### 3. Render Free Tier Sleep (UptimeRobot)
* **Problem**: Render's free tier goes to sleep after 15 minutes of inactivity, causing a 50-second delay for the next user.
* **Fix**: Set up a free monitor on **UptimeRobot.com** to ping `https://mentx-backend.onrender.com/swagger-ui.html` every 14 minutes. This keeps the backend awake 24/7.

### 4. Admin Group Override
* **Problem**: Administrators were blocked by the service layer from modifying group members or deleting groups created by mentors.
* **Fix**: Updated `GroupService.java` to check the caller's role. If the caller is an `ADMIN`, the service skips the mentor-ownership check and allows them full override capabilities.
