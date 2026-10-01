# Yaycha

Yaycha is a full-stack social media MVP delivered through a web client and an Expo mobile client. Users can register, publish posts, comment, like content, manage profiles, and access admin moderation features.

## Architecture

The repository contains three independently runnable applications:

- `backend`: versioned Express API at `/api/v1`, with JWT authentication, validation, rate limiting, uploads, and Prisma persistence.
- `frontend`: React web application using Vite, React Router, React Query, React Hook Form, Tailwind CSS, and shadcn/ui patterns.
- `mobile`: React Native application using Expo Router, Expo UI, React Query, React Hook Form, secure token storage, and shared English/Myanmar localization.

The clients communicate with the backend over HTTP. The backend uses SQLite for local development and is structured for PostgreSQL in production. Client query caches are invalidated after mutations so feeds, posts, comments, and profiles stay current.

## Current Implementation Status

- The repository contains a working full-stack MVP across the backend, web client, and Expo mobile app.
- Implemented backend features include authentication, JWT refresh, post and comment APIs, likes, uploads, profiles, follow management, admin moderation, search, notification history/read APIs, and real-time WebSocket updates.
- Multi-level comment threads, per-level reply pagination, and follow/search flows are available on both web and mobile clients.
- The web and mobile apps include auth, feed, post detail, profile, notifications, settings, admin, and search screens, with safe-area handling and keyboard-aware layouts.
- Planned future work remains intentionally documented in `PROJECT_SPEC.md` and `PROJECT_SPEC.html`, including password recovery, privacy settings, enhanced profile fields, and notification UX refinements.

## Technology Stack

- TypeScript across all applications
- Node.js, Express, Prisma, JWT, Zod, and Jest/Supertest for the backend
- React, Vite, React Router, React Query, Tailwind CSS, and Vitest for the web client
- React Native, Expo SDK 57, Expo Router, and Expo UI for mobile
- English and Myanmar translations, with light/dark theme support

## Setup

Prerequisites: Node.js 20 or newer and npm. Install dependencies in each application:

```sh
cd backend && npm install
cd ../frontend && npm install
cd ../mobile && npm install
```

Start the backend first:

```sh
cd backend
npm run prisma:generate
npx prisma migrate deploy
npm run dev
```

The API listens on `http://localhost:3000` by default. Backend environment variables are optional for local development; defaults are defined in `backend/src/config/env.ts`. For real deployments, provide strong JWT secrets and an explicit `DATABASE_URL`.

Start the web client in a second terminal:

```sh
cd frontend
npm run dev
```

The web client uses the Railway API by default in development and production. Set `VITE_API_URL=http://localhost:3000/api/v1` to use a local backend, or provide another API URL as needed.

Start the mobile client in a third terminal:

```sh
cd mobile
npm run start
```

Override the API endpoint with `EXPO_PUBLIC_API_URL`. Android emulators and physical devices generally need a host-accessible LAN address rather than `localhost`.

## Development Workflow

Run commands from the relevant application directory. Before opening a change, format code using the project conventions, run the affected tests, and verify a production build where available.

```sh
# backend
npm run lint
npm run test
npm run build

# frontend
npm run lint
npm run test -- --run
npm run build
```

Database schema changes belong in `backend/prisma/migrations`. Keep secrets in local `.env` files and never commit generated output, local databases, uploads, or dependency directories. Use small, focused commits that describe the behavior changed.

## Directory Structure

```text
.
├── backend/
│   ├── prisma/              Prisma schema and migrations
│   └── src/                 API app, routes, controllers, services, and tests
├── frontend/
│   ├── public/              Static web assets
│   └── src/                 React pages, components, contexts, hooks, and API code
├── mobile/
│   ├── app/                 Expo Router screens and route groups
│   ├── assets/              Fonts and images
│   └── contexts, i18n, lib/ Mobile state, translations, and API/storage helpers
├── PROJECT_SPEC.md          Product scope and functional requirements
└── README.md                Project setup and development guide
```
