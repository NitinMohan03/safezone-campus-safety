# SafeZone 🛡️

> A community safety reporting and incident management platform for campus communities

SafeZone is a full-featured React application that empowers campus communities to report safety incidents, view live incident feeds, plan safer routes, and stay informed about their environment. Built with modern web technologies and designed for both demo and production use.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://safezone-campus-safety.vercel.app)
[![Mock API](https://img.shields.io/badge/Mock%20API-Render-46E3B7?logo=render)](https://safezone-campus-safety.onrender.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ✨ Features

### 🗺️ **Interactive Campus Maps**
- Real-time incident visualization on Mapbox maps
- Heatmap view showing incident density and severity
- Route planning with safety-aware routing
- Address search and geocoding

### 📊 **Live Incident Feed**
- Dynamic incident cards with severity levels and timestamps
- Real-time upvoting system for community verification
- Advanced filtering by severity, status, and category
- Community statistics and trending insights

### 📝 **Report Submission**
- Multi-category incident reporting (Safety, Infrastructure, Environmental, etc.)
- Image upload via Cloudinary
- Location tagging with Mapbox geocoding
- Anonymous reporting option
- Daily submission limits for spam prevention

### 🔐 **Authentication & Authorization**
- AWS Cognito integration for secure authentication
- Mock authentication mode for demos
- Role-based access control (User/Admin)
- Protected routes and secure API calls

### 👨‍💼 **Admin Center**
- Incident review and moderation dashboard
- Status management (Pending, Approved, Needs Review)
- Admin feedback system
- Email notifications via Make.com webhooks
- Mailchimp integration for alert subscriptions

### 🔔 **Smart Alerts**
- Location-based alert subscriptions
- Email notifications for nearby incidents
- Integration with Make.com for workflow automation

---

## 🏗️ Architecture

```
SafeZone/
├── frontend/              # React + Vite application
│   ├── src/
│   │   ├── auth/         # Authentication logic (Cognito + Mock)
│   │   ├── components/   # Reusable UI components
│   │   ├── features/     # Feature modules (route planner, etc.)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   ├── routes/       # Protected/Admin route guards
│   │   ├── services/     # API services and integrations
│   │   └── utils/        # Utility functions
│   ├── db.json           # Mock database for local development
│   └── vercel.json       # Vercel SPA routing config
├── mock-api/              # json-server for portfolio demo API
│   ├── db.json           # Full mock dataset (reports, users, zones)
│   └── package.json      # json-server setup for Render
└── backend/               # Django REST Framework (production backend)
    ├── api/              # API endpoints
    └── backend/          # Django settings
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Mapbox Account**: Get a free token at [mapbox.com](https://account.mapbox.com/)
- **AWS Account** (optional, for Cognito auth)
- **Cloudinary Account** (optional, for image uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/NitinMohan03/safezone-campus-safety.git
   cd safezone-campus-safety
   ```

2. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the `frontend/` directory:
   ```bash
   # API Mode (json for mock, django for real backend)
   VITE_API_MODE=json
   VITE_USE_MOCK_AUTH=true

   # Mock API (points to Render json-server or localhost)
   VITE_API_BASE_URL=https://safezone-campus-safety.onrender.com

   # Mapbox (REQUIRED for maps)
   VITE_MAPBOX_TOKEN=your_mapbox_token_here

   # AWS Cognito (for real authentication)
   VITE_AWS_REGION=us-east-1
   VITE_COGNITO_USER_POOL_ID=your_pool_id
   VITE_COGNITO_WEB_CLIENT_ID=your_client_id
   VITE_COGNITO_ADMIN_GROUP=admin-group

   # Cloudinary (for image uploads)
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_preset

   # Make.com Webhooks (optional)
   VITE_MAKE_WEBHOOK_URL=your_webhook_url
   VITE_ALERT_WEBHOOK_URL=your_alert_webhook_url
   ```

4. **Start the development server**
   ```bash
   cd frontend
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser! 🎉

---

## 🎮 Usage

### Mock Mode (Recommended for Demos)

Perfect for testing, demos, and development without backend setup:

```bash
VITE_API_MODE=json
VITE_USE_MOCK_AUTH=true
VITE_API_BASE_URL=https://safezone-campus-safety.onrender.com
```

**Features:**
- ✅ All UI features work
- ✅ Mock authentication (no signup needed)
- ✅ Data served from Render json-server
- ✅ Perfect for demos and testing
- ✅ Zero backend dependencies

**Mock Login Credentials:**
- Regular user: Any email/password works
- Admin user: Set `isAdmin=true` in mock mode

### Production Mode

Connect to real AWS Cognito and backend:

```bash
VITE_API_MODE=django
VITE_USE_MOCK_AUTH=false
# ... add real Cognito credentials
```

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on http://localhost:5173 |
| `npm run build` | Build for production → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run tests with Vitest |
| `npm run lint` | Lint code with ESLint |

---

## 🌐 Deployment

The live portfolio demo uses a zero-cost stack:

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | https://safezone-campus-safety.vercel.app |
| Mock API | Render | https://safezone-campus-safety.onrender.com |

### Frontend — Vercel

1. Import repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Build command: `npm run build` / Output: `dist`
4. Add environment variables:
   - `VITE_API_MODE=json`
   - `VITE_USE_MOCK_AUTH=true`
   - `VITE_API_BASE_URL=https://safezone-campus-safety.onrender.com`
   - `VITE_MAPBOX_TOKEN=your_token`

### Mock API — Render

1. New **Web Service** on [render.com](https://render.com) → connect repo
2. Set **Root Directory** to `mock-api`
3. Runtime: Node, Build: `npm install`, Start: `npm start`
4. Free tier — spins down after 15 min idle (first request after idle takes ~30s)

**Cost:** $0 🎉

---

## 🧪 Testing

```bash
npm run test
```

**Test Stack:**
- Vitest for unit/integration tests
- React Testing Library for component tests
- jsdom for browser simulation

---

## 🛠️ Tech Stack

### Frontend
- **React** 19 - UI library
- **React Router** 7 - Client-side routing
- **Vite** 7 - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework

### Maps & Location
- **Mapbox GL JS** - Interactive maps
- **@mapbox/mapbox-gl-geocoder** - Address search
- **@turf/turf** - Geospatial analysis

### Authentication
- **AWS Amplify** - AWS SDK wrapper
- **AWS Cognito** - User authentication and management

### Media & Integrations
- **Cloudinary** - Image upload and storage
- **Make.com** - Workflow automation and webhooks
- **Mailchimp** - Email notifications (via Make.com)

### Testing
- **Vitest** - Test runner
- **React Testing Library** - Component testing
- **jsdom** - DOM simulation

---

## 📋 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_MODE` | Yes | API mode: `json` or `django` |
| `VITE_API_BASE_URL` | Yes | Base URL for the API server |
| `VITE_MAPBOX_TOKEN` | Yes | Mapbox access token |
| `VITE_USE_MOCK_AUTH` | No | Enable mock authentication |
| `VITE_AWS_REGION` | For Cognito | AWS region for Cognito |
| `VITE_COGNITO_USER_POOL_ID` | For Cognito | Cognito User Pool ID |
| `VITE_COGNITO_WEB_CLIENT_ID` | For Cognito | Cognito App Client ID |
| `VITE_COGNITO_ADMIN_GROUP` | For Cognito | Admin group name |
| `VITE_CLOUDINARY_CLOUD_NAME` | For uploads | Cloudinary cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | For uploads | Upload preset name |
| `VITE_MAKE_WEBHOOK_URL` | For webhooks | Make.com webhook URL |
| `VITE_ALERT_WEBHOOK_URL` | For alerts | Alert webhook URL |

---

## 🎯 Key Features Explained

### Mock vs Real Authentication

**Mock Mode** (`VITE_USE_MOCK_AUTH=true`):
- No signup/login required
- Perfect for demos and testing
- Simulates user sessions in localStorage
- Admin mode can be toggled manually

**Real Mode** (AWS Cognito):
- Full user registration and login
- Email verification
- Password recovery
- Role-based access via Cognito Groups

### Admin Features

Access admin features at `/admin`:
- Review submitted reports
- Approve/reject reports
- Add feedback to reports
- Manage report status
- View community statistics

**Note:** In mock mode, any user can access admin. In production, users must be in the Cognito admin group.

### Route Planning

The Route Planner uses Mapbox Directions API to:
- Calculate routes between two points
- Avoid high-severity incident areas
- Show incident density along routes
- Provide alternative safer routes

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🐛 Troubleshooting

### Maps not loading?
- Verify `VITE_MAPBOX_TOKEN` is set correctly
- Check browser console for errors
- Ensure token has correct permissions

### Authentication not working?
- Check Cognito User Pool ID and Client ID
- Verify AWS region matches your pool
- Try mock mode first: `VITE_USE_MOCK_AUTH=true`

### Images not uploading?
- Verify Cloudinary cloud name and upload preset
- Check preset allows unsigned uploads
- Ensure file size is within limits

### API slow on first load?
- Render free tier spins down after 15 min idle
- First request after idle takes ~30s to wake up
- Subsequent requests are fast

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/NitinMohan03/safezone-campus-safety/issues)
- **Email**: nitinmohanofficial@gmail.com

---

## 🙏 Acknowledgments

- Built for NYU Tandon School of Engineering
- Maps powered by [Mapbox](https://www.mapbox.com/)
- Icons from [Heroicons](https://heroicons.com/)
- Hosted on [Vercel](https://vercel.com) + [Render](https://render.com)

---

**Made with ❤️ for safer campuses**
