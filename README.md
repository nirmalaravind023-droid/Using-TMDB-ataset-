# 🎬 moviePortal

A movie discovery platform built with Next.js 14, PostgreSQL, and Elasticsearch for typo-tolerant search.

---

## 🛠️ Requirements (Prerequisites)

Before running the project, ensure you have the following installed:

1.  **Node.js (v18 or higher):** To run the Next.js application and ingestion scripts.
2.  **Docker Desktop:** To run the infrastructure (PostgreSQL, Keycloak, Elasticsearch, Redis).
3.  **Git:** To manage the source code.
4.  **TMDB API Key:** Required for fetching movie data (already configured in `.env.local`).

---

## 🏗️ Architecture Overview

The platform is built using a modern distributed architecture:

1.  **Frontend (Next.js 14):** High-performance React application using the App Router.
2.  **Database (PostgreSQL 16):** Stores relational data for movies, persons, and users.
3.  **Search (Elasticsearch):** Powers advanced, typo-tolerant search capabilities.
4.  **Auth (Keycloak):** Enterprise-grade Identity and Access Management.
5.  **Cache (Redis):** Ready for high-speed data caching.

---

## 🚦 How to Operate & Run

### 1. Start the Infrastructure
Open your terminal in the project folder and run:
```bash
docker compose up -d
```
*This starts Postgres, Keycloak, Elasticsearch, and Redis in the background.*

### 2. Initialize the Database
If this is the first time running the project, sync your database schema:
```bash
npx prisma db push
```

### 3. Ingest Movie Data
To populate the database with movies from TMDB, run the sync script:
```bash
node sync-tmdb.js
```
*This will fetch trending movies, cast members, and trailers.*

### 4. Index into Elasticsearch (manual batch — run once after seeding)
Search falls back to PostgreSQL automatically when Elasticsearch is unavailable. To enable typo-tolerant search, run this after the database is populated:
```bash
node sync-elastic.js
```
This is a one-shot script, not a continuous sync. Re-run it whenever you add a large batch of new movies.

### 5. Start the Web App
Run the development server:
```bash
npm run dev
```
Open **[http://localhost:4005](http://localhost:4005)** in your browser.

---

## 📂 File Architecture (What each file does)

| File / Folder | Purpose |
| :--- | :--- |
| **`app/`** | The heart of the Next.js app. Contains pages, API routes, and layouts. |
| **`components/`** | Reusable UI components (Hero Sliders, Movie Cards, Search bars). |
| **`prisma/`** | Database schema definition (`schema.prisma`) and migrations. |
| **`lib/`** | Utility functions and shared library configurations (e.g., `db.ts` for database connection). |
| **`sync-tmdb.js`** | Script that talks to TMDB API to download movie metadata and images. |
| **`sync-elastic.js`** | Script that transfers data from PostgreSQL to Elasticsearch for faster searching. |
| **`ingest.js`** | Main entry point for various data ingestion tasks. |
| **`docker-compose.yml`** | Defines all the services (Postgres, Redis, etc.) needed to run the app. |
| **`package.json`** | Lists all dependencies and scripts like `npm run dev`. |
| **`.env.local`** | Stores secrets like Database URLs and API keys. |
| **`tailwind.config.ts`** | Configuration for the premium UI styling system. |

---

## 🛑 How to Stop
1.  **Stop App:** Press `Ctrl + C` in the terminal running the web server.
2.  **Stop Containers:** Run `docker compose down` to free up system resources.