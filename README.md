# Graphyte — Professional Networking Platform for Builders

Graphyte is a premium, dark-first professional networking platform inspired by modern interfaces like Linear and Vercel. It is built using the MERN stack and designed specifically for developers, creators, and engineers to showcase work, collaborate in real-time, and discover career opportunities.

## Live Demo
🔗 **Frontend (Vercel):** [https://graphyte-client.vercel.app](https://graphyte-client.vercel.app)  
🔗 **Backend API (Render):** [https://graphyte-server.onrender.com](https://graphyte-server.onrender.com)

---

## Tech Stack

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![TanStack Query](https://img.shields.io/badge/-TanStack%20Query-FF4154?style=for-the-badge&logo=react%20query&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=Cloudinary&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/framer%20motion-black?style=for-the-badge&logo=framer)

---

## Features

| Feature Group | Implemented Capabilities |
| :--- | :--- |
| **Authentication & Core** | ✅ JWT Auth with automatic 401 interception & auto-logout on session expiration. |
| **Onboarding Wizard** | ✅ 3-step setup (Profile photo upload, 3-10 tags input, first recommended connections). |
| **Tactile UX & Motion** | ✅ Premium Dark Mode defaults with Framer Motion page exits/enters & Button tap spring physics. |
| **Social Feed** | ✅ Cursor-based infinite scroll feed. Support for images, links, likes, comments, and specific **Career Milestones / Achievement Posts**. |
| **Real-time Messaging** | ✅ SCOPED chat rooms via Socket.IO with typing indicators, read receipts, and **Instant Quick Replies**. |
| **Sleek Layout & Loading** | ✅ Left Navigation Rail layout with global Cmd+K/Ctrl+K Search overlay, sequential hotkeys (G+H/N/J/M), and premium Dark shimmer skeletons. |
| **Job Market** | ✅ listings board with client-side filters and a **Visual Skill Match Score**. |
| **Connections Graph** | ✅ Bidirectional connection flows, pending status badges, and mutual friend counts. |
| **Activity Tracking** | ✅ Weekly visibility stats, notification grouping (likes/comments), and traction event alerts. |
| **Profile & SEO** | ✅ completeness scoring, rich showcase section, and dynamic OG meta tags for profile sharing. |

---

## Architecture Highlights

### ⚡ Cursor-Based Pagination
MongoDB compound indexing on `(createdAt, _id)` drives our social feed and messaging queries. By avoiding SQL-style `OFFSET` operations, Graphyte maintains consistent `O(log n)` database lookup performance regardless of feed depth, avoiding missing or duplicate posts during real-time updates.

### 🔌 Scoped WebSocket Rooms
Direct messaging and typing notifications are structured using dedicated Socket.IO rooms. Socket communication is strictly scoped to conversation IDs to prevent server memory bloat and keep packet transfers isolated to active participants.

### 🔄 Optimistic Client Updates
TanStack Query state management is used to intercept server interactions. Likes, bookmark saves, and connection triggers immediately reflect in the client UI state, updating context and local states before backend requests complete. Failed requests trigger automatic rollback.

### 🎨 Dark-First Shimmer Skeletons
No generic spinners or Tailwind pulses. Skeletons replicate the real layout using linear-gradient CSS classes (`.skeleton`) with hardware-accelerated shimmer keyframes.

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas cluster
- Cloudinary developer API credentials
- Mailer account (Gmail app password recommended)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/chiragsethi12/graphyte.git
   cd graphyte
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env # Fill in your MongoDB connection, Cloudinary API keys, and JWT secrets
   npm run dev
   ```

3. **Frontend Setup (New Terminal):**
   ```bash
   cd frontend
   npm install
   cp .env.example .env # Fill in VITE_API_URL and VITE_SOCKET_URL
   npm run dev
   ```

---

## Environment Variables

Check the example configuration files for full details on expected environment keys:
- [backend/.env.example](file:///c:/Users/chira/OneDrive/Desktop/graphite/backend/.env.example)
- [frontend/.env.example](file:///c:/Users/chira/OneDrive/Desktop/graphite/frontend/.env.example)

---

## Screenshots

*Screenshots demonstrating the redesigned Dark UI theme, the Messaging Hub with Quick Replies, the Job recommendations dashboard, and the onboarding flow will be placed here.*

---

## API Overview

- `/api/auth` - Register, login, password reset requests
- `/api/users` - Public profiles, skills, interests, and profile photo updates
- `/api/posts` - Feed queries, likes, comments, and milestone creation
- `/api/connections` - Connection requests, withdrawals, response controls, and mutuals
- `/api/messages` - Messaging history, unread counts, and active thread states
- `/api/jobs` - Job posts, filters, applications, and recommendations
- `/api/notifications` - Unread notification alerts, read status toggles, and notification grouping
- `/api/saved` - Bookmarked posts retrieval
- `/api/analytics` - Profile view history and visibility statistics
