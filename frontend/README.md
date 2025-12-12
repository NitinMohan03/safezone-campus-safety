# SafeZone Frontend

SafeZone is a React single-page application that helps NYU communities stay informed about campus safety. The app integrates a live incident feed, route planner, and report submission system, all connected to a lightweight backend for persistence.

## 🧩 Features

- **NYU Tandon Map Spotlight**: Interactive Mapbox map centered on the MetroTech campus.
- **Live Feed & Alerts**: Dynamic incident cards with severity levels, timestamps, and 👍 upvote buttons.
- **Route Safety Planner**: Overlay with Mapbox-powered address search and route preview.
- **Submit Report**: Includes geocoded location input powered by Mapbox and shared tags from `/src/models/tags.js`.
- **Votes System**: Each report includes a corresponding `vote` record in `/votes`, initialized when users submit incidents.
- **Admin Center**: Prototype dashboard for reviewing and moderating reports.
- **Responsive UI**: Optimized layout and typography for both desktop and mobile.

---

## ⚙️ Tech Stack

- **Frontend:** React 19 + React Router 7 + Vite 7
- **Styling:** CSS Modules (page-scoped styles)
- **Testing:** Vitest + React Testing Library
- **Mock Backend:** JSON Server

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Setup Environment Variables

You can use **one `.env` file** for simplicity or **two separate files** for dev and prod environments.

#### The `.env` file

```bash
VITE_MAPBOX_TOKEN=your_mapbox_access_token_here
```

#### Separate `.env` files

##### `.env.development`

```bash
VITE_API_BASE_URL=http://localhost:5001
```

##### `.env.production`

```bash
VITE_API_BASE_URL=https://your-production-api-domain.com
```

> 💡 **Tip:** Never commit `.env` files containing sensitive tokens. Use `.gitignore` or deployment secrets instead.

---

## 💻 Development

Run the frontend and mock backend together:

```bash
npm run dev
```

This starts:

- Vite frontend → `http://localhost:5173`
- JSON Server backend → `http://localhost:5001`

### Example `db.json`

```json
{
  "reports": [
    {
      "id": "409f",
      "title": "Fallen Tree Blocking Sidewalk",
      "category": "hazard",
      "description": "A large tree has fallen and is blocking the sidewalk.",
      "severity": "high",
      "status": "pending review",
      "time": "Just now",
      "tags": ["hazard", "emergency services"],
      "location": { "lat": 40.693, "lng": -73.986 },
      "reporter": "Manual submission",
      "createdAt": "2025-10-28T03:57:59.621Z",
      "zoneId": "z1",
      "userId": "u1",
      "upvotes": 0
    }
  ],
  "votes": [
    {
      "reportId": "409f",
      "totalVotes": 0,
      "userVotes": [],
      "createdAt": "2025-10-28T04:00:00.000Z"
    }
  ]
}
```

---

## 🧱 Models & API Integration

### `/src/models/tags.js`

Defines all available tag categories for incident reports (e.g. “Theft”, “Vandalism”, “Safety Hazard”, “Public Works”, etc.).

### `/src/hooks/useReports.js`

Handles fetching, posting, and updating reports, including votes.

### Backend Replacement

If you migrate from JSON Server to a real backend (e.g., Express or FastAPI), simply replace the API base URL in `useReports.js` — the data schema and endpoints are already REST-compatible.

---

## 🏗️ Production Build & Deployment

### Build the app

```bash
npm run build
```

### Preview locally

```bash
npm run preview
```

### Deployment Options

- **Static Hosting:** Netlify, Vercel, or GitHub Pages.
- **Custom Backend:** Serve `/dist` as static files and proxy `/api` to your backend.

Ensure `.env.production` contains correct Mapbox token and production API URL.

---

## 🧪 Testing

Run tests with:

```bash
npm run test
```

---

## 📁 Folder Structure

```
src/
  components/          # Navbar, shared UI elements
  features/routePlanner/
    IncidentTicker.jsx
    RouteMap.jsx
    RouteSearchOverlay.jsx
  hooks/
    useReports.js
  models/
    schema.js
    tags.js
  pages/
    AdminCenterPage.jsx / .css
    HomePage.jsx / .css
    LiveFeedPage.jsx / .css
    RoutePlannerPage.jsx / .css
    SubmitReportPage.jsx / .css
  db.json              # JSON Server mock database
```

---

## 💡 Future Enhancements

- Integrate a real backend service for persistence.
- Add authentication and user dashboards.
- Enable WebSocket-based live feed updates.
- Improve upvote tracking and moderation tools.
