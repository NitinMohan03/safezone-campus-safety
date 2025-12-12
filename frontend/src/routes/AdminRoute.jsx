import React from "react";
import PropTypes from "prop-types";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../auth/useAuth";

function AdminRoute({ redirectPath = "/login", children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/80 px-6 py-8 text-center text-slate-600 shadow-lg">
        Checking admin access…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children || <Outlet />;
}

AdminRoute.propTypes = {
  redirectPath: PropTypes.string,
  children: PropTypes.node,
};

export default AdminRoute;
