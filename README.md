# Graphyte — Professional Networking Platform
[Add a screenshot or GIF of the app here after deployment]

## Live Demo
[Your Vercel URL here]

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

## Features
| Feature | Description |
| :--- | :--- |
| ✅ **JWT Authentication** | With auto-logout on token expiry |
| ✅ **Social Feed** | With cursor-based infinite scroll |
| ✅ **Real-time Messaging** | With typing indicators and read receipts |
| ✅ **Professional Profiles** | With completeness tracking |
| ✅ **Job Listings** | With skill-matched recommendations |
| ✅ **Smart Notifications** | With real-time badge updates |
| ✅ **Advanced Search** | Across users, jobs, and posts |
| ✅ **Saved Posts** | Bookmarks / Saved Posts functionality |
| ✅ **Connection Network** | With mutual connection detection |
| ✅ **Responsive design** | Mobile-first layout |

## Architecture Highlights
- Cursor-based pagination for O(log n) feed and message queries via MongoDB compound indexes
- Real-time bidirectional communication via Socket.IO with conversation room scoping
- TanStack Query for server state with optimistic updates on like/save/connect
- JWT with automatic 401 interception — expired sessions handled gracefully client-side
- Cloudinary for media storage with Multer multipart handling

## Local Setup
### Prerequisites
- Node.js 18+, MongoDB Atlas account, Cloudinary account

### Installation
```bash
git clone <repo-url>
cd Graphyte

# Backend
cd backend && npm install
cp .env.example .env  # fill in your values
npm run dev

# Frontend (new terminal)
cd ../frontend && npm install
cp .env.example .env
npm run dev
```

### Environment Variables
Check the `.env.example` files in their respective directories for all required keys:
- `backend/.env.example`
- `frontend/.env.example`

## Screenshots
[Add 3-4 screenshots: Feed, Profile, Messaging, Jobs]

## API Overview
- `/api/auth` - Authentication & password reset
- `/api/users` - Profiles, suggestions, search
- `/api/posts` - Feed, creation, likes, comments
- `/api/connections` - Requests, network graph
- `/api/messages` - Real-time chat history
- `/api/jobs` - Postings, filtering, applications
- `/api/notifications` - Real-time alerts & unread counts
- `/api/saved` - Bookmarked posts

## What I'd Add Next
- Refresh token rotation
- Redis for unread count caching
- Elasticsearch for advanced search
- Push notifications
