// src/components/Navbar.jsx
import { Link } from "react-router-dom";
import useAuth from "../auth/useAuth";

function Navbar() {
  const { isAuthenticated, isAdmin, user, logout, useMock } = useAuth();
  const attrs = user?.attributes || {};
  const firstName =
    attrs.given_name || (attrs.name ? attrs.name.split(" ")[0] : undefined);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Failed to logout", err);
    }
  };

  return (
    <nav className="sticky top-0 z-[999] flex justify-center border-b border-slate-900/10 bg-white/90 backdrop-blur-lg">
      <div className="flex w-full max-w-content min-h-[72px] flex-col gap-3 px-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {/* Brand Logo/Title - Links to homepage */}
        <Link
          to="/"
          className="inline-flex items-center text-2xl font-bold tracking-wide text-primary-700 sm:text-[1.8rem]"
        >
          SafeZone
        </Link>

        {/* Navigation Links */}
        <ul className="flex list-none flex-col items-center gap-2 p-0 sm:flex-row sm:gap-2">
          <li>
            <Link
              to="/live-feed"
              className="group relative inline-flex items-center justify-center rounded-full px-3 py-1 text-base font-medium text-slate-700 transition-all duration-200 hover:text-primary-600 after:absolute after:left-0 after:right-0 after:-bottom-1.5 after:h-[3px] after:rounded-full after:bg-gradient-to-r after:from-primary-500 after:to-sky-400 after:opacity-0 after:transition after:duration-200 after:ease-out hover:after:opacity-100 hover:after:scale-100"
            >
              Live Feed
            </Link>
          </li>
          <li>
            <Link
              to="/route-planner"
              className="group relative inline-flex items-center justify-center rounded-full px-3 py-1 text-base font-medium text-slate-700 transition-all duration-200 hover:text-primary-600 after:absolute after:left-0 after:right-0 after:-bottom-1.5 after:h-[3px] after:rounded-full after:bg-gradient-to-r after:from-primary-500 after:to-sky-400 after:opacity-0 after:transition after:duration-200 after:ease-out hover:after:opacity-100 hover:after:scale-100"
            >
              Route Check
            </Link>
          </li>
          <li>
            <Link
              to="/returned-reports"
              className="group relative inline-flex items-center justify-center rounded-full px-3 py-1 text-base font-medium text-slate-700 transition-all duration-200 hover:text-primary-600 after:absolute after:left-0 after:right-0 after:-bottom-1.5 after:h-[3px] after:rounded-full after:bg-gradient-to-r after:from-primary-500 after:to-sky-400 after:opacity-0 after:transition after:duration-200 after:ease-out hover:after:opacity-100 hover:after:scale-100"
            >
              Returned Reports
            </Link>
          </li>
          {isAdmin && (
            <li>
              <Link
                to="/admin-center"
                className="group relative inline-flex items-center justify-center rounded-full px-3 py-1 text-base font-medium text-slate-700 transition-all duration-200 hover:text-primary-600 after:absolute after:left-0 after:right-0 after:-bottom-1.5 after:h-[3px] after:rounded-full after:bg-gradient-to-r after:from-primary-500 after:to-sky-400 after:opacity-0 after:transition after:duration-200 after:ease-out hover:after:opacity-100 hover:after:scale-100"
              >
                Admin Center
              </Link>
            </li>
          )}
          <li>
            <Link
              to="/submit-report"
              className="inline-flex min-h-[2.5rem] items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary-500/30"
            >
              Submit Report
            </Link>
          </li>
        </ul>

        <div className="flex items-center justify-center gap-3 sm:justify-end">
          {isAuthenticated ? (
            <>
              <span className="flex flex-col items-center gap-1 text-center font-semibold text-slate-700 sm:items-start sm:text-left">
                <span>Welcome back</span>
                <span className="flex items-center gap-2">
                  <span className="text-primary-600">
                    {firstName || 'SafeZone user'}
                  </span>
                  {isAdmin && (
                    <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider text-primary-600">
                      Admin
                    </span>
                  )}
                  {useMock && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider text-amber-700">
                      Mock
                    </span>
                  )}
                </span>
              </span>
              <button
                type="button"
                className="rounded-full border-0 bg-transparent px-2 py-1 text-base font-medium text-slate-600 transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="group relative inline-flex items-center justify-center rounded-full px-3 py-1 text-base font-medium text-slate-700 transition-all duration-200 hover:text-primary-600 after:absolute after:left-0 after:right-0 after:-bottom-1.5 after:h-[3px] after:rounded-full after:bg-gradient-to-r after:from-primary-500 after:to-sky-400 after:opacity-0 after:transition after:duration-200 after:ease-out hover:after:opacity-100 hover:after:scale-100"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="group relative inline-flex items-center justify-center rounded-full px-3 py-1 text-base font-medium text-slate-700 transition-all duration-200 hover:text-primary-600 after:absolute after:left-0 after:right-0 after:-bottom-1.5 after:h-[3px] after:rounded-full after:bg-gradient-to-r after:from-primary-500 after:to-sky-400 after:opacity-0 after:transition after:duration-200 after:ease-out hover:after:opacity-100 hover:after:scale-100"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
