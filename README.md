# SafeZone 🛡️

> A community safety reporting and incident management platform for campus communities

SafeZone is a full-featured React application that empowers campus communities to report safety incidents, view live incident feeds, plan safer routes, and stay informed about their environment. Built with modern web technologies and designed for both demo and production use.

[![Deploy to AWS Amplify](https://img.shields.io/badge/Deploy-AWS%20Amplify-orange?logo=amazonaws)](./frontend/DEPLOYMENT.md)
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
│   ├── db.json           # Mock database for JSON mode
│   ├── amplify.yml       # AWS Amplify build config
│   └── DEPLOYMENT.md     # Deployment guide
└── .env                  # Environment configuration
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
   git clone https://github.com/YOUR_USERNAME/safezone-frontend.git
   cd safezone-frontend
   ```

2. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Configure environment variables**
   
   Copy the example environment file:
   ```bash
   # From the root directory
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```bash
   # API Mode (json for mock, django for real backend)
   VITE_API_MODE=json
   VITE_USE_MOCK_AUTH=true
   
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
# In .env
VITE_API_MODE=json
VITE_USE_MOCK_AUTH=true
```

**Features:**
- ✅ All UI features work
- ✅ Mock authentication (no signup needed)
- ✅ Data stored in `db.json`
- ✅ Perfect for demos and testing
- ✅ Zero backend dependencies

**Mock Login Credentials:**
- Regular user: Any email/password works
- Admin user: Set `isAdmin=true` in mock mode

### Production Mode

Connect to real AWS Cognito and backend:

```bash
# In .env
VITE_API_MODE=django  # or your backend mode
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

### AWS Amplify (Recommended)

Deploy with zero backend maintenance and free hosting:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Follow the deployment guide**
   
   See detailed instructions in [DEPLOYMENT.md](./frontend/DEPLOYMENT.md)

3. **Set environment variables in Amplify Console**
   - `VITE_API_MODE=json`
   - `VITE_MAPBOX_TOKEN=your_token`
   - `VITE_USE_MOCK_AUTH=true`

**Cost:** $0 on AWS free tier! 🎉

### Other Platforms

- **Netlify/Vercel**: Drag `dist/` folder or connect GitHub
- **Custom Server**: Serve `dist/` as static files with your web server

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

See [`.env.example`](.env.example) for a complete template.

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

### Build fails in Amplify?
- Verify `amplify.yml` is in the repository
- Check Node.js version (18+ required)
- Review build logs in Amplify Console

---

## 📞 Support

- **Documentation**: See [DEPLOYMENT.md](./frontend/DEPLOYMENT.md)
- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/safezone-frontend/issues)
- **Email**: your-email@example.com

---

## 🙏 Acknowledgments

- Built for NYU Tandon School of Engineering
- Maps powered by [Mapbox](https://www.mapbox.com/)
- Icons from [Heroicons](https://heroicons.com/)
- Hosting by [AWS Amplify](https://aws.amazon.com/amplify/)

---

**Made with ❤️ for safer campuses**
