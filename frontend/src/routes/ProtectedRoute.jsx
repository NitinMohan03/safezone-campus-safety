import React from "react";
import PropTypes from "prop-types";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../auth/useAuth";

function ProtectedRoute({ redirectPath = "/login", children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/80 px-6 py-8 text-center text-slate-600 shadow-lg">
        Checking session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace state={{ from: location }} />;
  }

  return children || <Outlet />;
}

ProtectedRoute.propTypes = {
  redirectPath: PropTypes.string,
  children: PropTypes.node,
};

export default ProtectedRoute;
