# NeuroTrack Setup & Deployment Guide

## 🏗️ Architecture Overview

The system consists of the following components:
1. **API Gateway**: Node.js router that proxies requests to microservices (`:5010`)
2. **Auth Service**: Manages user authentication & JWT (`:5001`)
3. **Tracking Service**: Manages goals, tracked blocks, and pomodoro (`:5002`)
4. **Realtime Service**: Manages WebSockets and live extension connections (`:5003`)
5. **Notification Service**: Manages email/push dispatching logic (`:5004`)
6. **AI Service**: Python FastAPI machine learning engine (`:8000`)
7. **Frontend Dashboard**: Next.js React application
8. **Chrome Extension**: Client-side tracker
9. **Infrastructure**: MongoDB (DB) and Redis (Cache/Message bus)

---

## 💻 Local Development Setup

### Prerequisites
- Docker & Docker Compose
- Node.js (v18+)
- Python (v3.11+)

### 1. Boot up the Backend Microservices
Ensure Docker is running, then orchestrate the backend stack:

```bash
cd backend
docker compose up --build
```

This will automatically start:
- MongoDB (`:27017`)
- Redis (`:6379`)
- All 5 microservices mapped to their respective ports.

### 2. Run the Next.js Dashboard
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
The dashboard will be available at `http://localhost:3000`.

### 3. Install the Chrome Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** in the top right.
3. Click **Load unpacked** and select the `extension` folder inside this repository.
4. Pin the extension to your toolbar.

---

## ☁️ Production Deployment (AWS / Vercel / Railway)

### Phase 1: Infrastructure
Deploy **MongoDB Atlas** and **Redis Labs** clusters. Obtain their connection URIs. Update the `.env` files in each microservice folder.

### Phase 2: Microservices (Railway or AWS ECS)
The easiest way to orchestrate the backend in production is to deploy the `backend` directory. 
1. Push your repository to GitHub.
2. Link the repository to Railway/Render.
3. Provide the environment variables (e.g., `MONGO_URI`, `REDIS_URL`, `JWT_SECRET`).
4. Railway will automatically detect the `Dockerfile` in each subfolder and spin up the services.

### Phase 3: Dashboard (Vercel)
1. Go to Vercel and import the repository.
2. Select `frontend` as the Root Directory.
3. Add the production URL of your API Gateway as `NEXT_PUBLIC_API_URL` in the environment variables.
4. Deploy!

### Phase 4: CI/CD
This repository is pre-configured with a `.github/workflows/deploy.yml`. When you push to the `main` branch, GitHub Actions will:
- Check out code
- Install Node & Python dependencies
- Build the dashboard
- (You can extend this to automatically trigger a Vercel/Railway rebuild via Webhook)
