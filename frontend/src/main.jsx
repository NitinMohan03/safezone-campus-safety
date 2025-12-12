// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import './index.css'; // Import global styles
import './aws-config';

// Import the layout and page components
import App from './App.jsx';
import HomePage from './pages/HomePage.jsx';
import SubmitReportPage from './pages/SubmitReportPage.jsx';
import LiveFeedPage from './pages/LiveFeedPage.jsx';
import RoutePlannerPage from './pages/RoutePlannerPage.jsx';
import AdminCenterPage from './pages/AdminCenterPage.jsx';
import ReviewRequestPage from './pages/ReviewRequestPage.jsx';
import ReturnedReportsPage from './pages/ReturnedReportsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import AdminRoute from './routes/AdminRoute.jsx';
import { AuthProvider } from './auth/AuthProvider.jsx';

// Create the router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // The App component is the main layout
    children: [
      {
        index: true, // This makes HomePage the default child route for '/'
        element: <HomePage />,
      },
      {
        path: 'submit-report',
        element: (
          <ProtectedRoute>
            <SubmitReportPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'live-feed',
        element: <LiveFeedPage />,
      },
      {
        path: 'route-planner',
        element: <RoutePlannerPage />,
      },
      {
        path: 'admin-center',
        element: (
          <AdminRoute>
            <AdminCenterPage />
          </AdminRoute>
        ),
      },
      {
        path: 'review-request/:reportId',
        element: (
          <ProtectedRoute>
            <ReviewRequestPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'returned-reports',
        element: (
          <ProtectedRoute>
            <ReturnedReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'signup',
        element: <SignupPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);
