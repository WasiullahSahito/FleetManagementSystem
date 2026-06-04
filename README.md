# Fleet Management System

A full-stack fleet management application built with React, Vite, Express, and MongoDB. The project includes vehicle tracking, inspections, maintenance, fueling logs, accident reports, and analytics.

## Project Structure

- `backend/`
  - Express API server
  - MongoDB models and controllers
  - Routes for authentication, vehicles, inspections, maintenance, fuel, reports, and accidents
  - File upload and static asset support
- `frontend/`
  - React app powered by Vite
  - Components for dashboard, login/register, vehicle profiles, mileage tracking, inspections, maintenance, fueling, and reporting
  - Uses Redux Toolkit, React Router, Bootstrap, Chart.js, Tailwind, and document export libraries

## Features

- User authentication and protected routes
- Vehicle profile management
- Inspection and maintenance logging
- Fueling and mileage tracking
- Accident reporting
- Reporting and analytics dashboards
- Document export using `docx`, `jspdf`, and `xlsx`

## Prerequisites

- Node.js 18+ (or compatible)
- npm
- MongoDB connection string

## Environment Variables

Create a `.env` file in `backend/` with the following values:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

## Backend Setup

1. Open a terminal in `backend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the backend server:
   ```bash
   npm run dev
   ```

The backend runs on `http://localhost:5000` by default.

## Frontend Setup

1. Open a terminal in `frontend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend app:
   ```bash
   npm run dev
   ```

The frontend uses Vite and typically runs on `http://localhost:5173`.

## Available Scripts

### Backend
- `npm run start` - Run the backend with Node
- `npm run dev` - Run the backend with nodemon (development)

### Frontend
- `npm run dev` - Start Vite development server
- `npm run build` - Build production assets
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint

## API Endpoints

The backend exposes these main routes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/vehicles`
- `POST /api/vehicles`
- `GET /api/inspections`
- `POST /api/inspections`
- `GET /api/maintenance`
- `POST /api/maintenance`
- `GET /api/fuel`
- `POST /api/fuel`
- `GET /api/reports`
- `GET /api/accidents`
- `POST /api/accidents`

> Adjust route details and request payloads to match your backend implementation as needed.

## Notes

- Static uploads are served from `backend/uploads`
- Static assets are served from `backend/assets`
- If your frontend needs to call the backend from a different origin, ensure the backend CORS settings allow it

## Recommended Improvements

- Add a root-level package manager script to run both frontend and backend concurrently
- Add tests for API and UI components
- Add Docker support for local development

## License

This project does not currently specify a license.
