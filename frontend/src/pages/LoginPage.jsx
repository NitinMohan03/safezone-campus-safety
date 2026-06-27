import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import useAuth from "../auth/useAuth";

const FEATURES = [
  "Report incidents as they happen",
  "Plan safer routes across campus",
  "Stay informed with live alerts",
];

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error } = useAuth();
  const [formValues, setFormValues] = useState({ username: "", password: "" });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await login(formValues);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setFormError(err.message || "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = submitting || loading;

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-stretch overflow-hidden rounded-[28px] border border-slate-200 shadow-[0_32px_64px_rgba(15,23,42,0.12)]">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[400px] lg:shrink-0 lg:flex-col lg:items-start lg:justify-between lg:bg-gradient-to-br lg:from-slate-900 lg:via-slate-800 lg:to-primary-950 lg:px-10 lg:py-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/20 ring-1 ring-primary-400/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-primary-400">
              <path d="M12 2L3 6v6c0 5.523 3.814 10.693 9 12 5.186-1.307 9-6.477 9-12V6l-9-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white">SafeZone</span>
        </div>

        <div className="flex flex-col gap-8">
          <div>
            <h2 className="text-3xl font-bold leading-tight text-white [text-wrap:balance]">
              Your campus,<br />safer together.
            </h2>
            <p className="mt-3 text-slate-400">
              Real-time incident reporting for the NYU community.
            </p>
          </div>
          <ul className="grid gap-3">
            {FEATURES.map((text) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500/25 ring-1 ring-primary-400/30">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                    <path d="M1 4l2.5 2.5L9 1" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-600">© 2026 SafeZone · NYU Tandon</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 lg:hidden">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-primary-600">
                <path d="M12 2L3 6v6c0 5.523 3.814 10.693 9 12 5.186-1.307 9-6.477 9-12V6l-9-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-950">Welcome back</h1>
            <p className="mt-1.5 text-slate-500">Sign in to your SafeZone account.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Username or Email
              <input
                type="text"
                name="username"
                value={formValues.username}
                onChange={handleChange}
                autoComplete="username"
                required
                disabled={isBusy}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-base text-slate-900 transition placeholder:text-slate-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Password
              <input
                type="password"
                name="password"
                value={formValues.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
                disabled={isBusy}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-base text-slate-900 transition placeholder:text-slate-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            {(formError || error) && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700" role="alert">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-rose-500">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 5v3M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {formError || error}
              </div>
            )}

            <Button type="submit" disabled={isBusy} className="mt-1 w-full">
              {isBusy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Need an account?{" "}
            <button
              type="button"
              className="font-semibold text-primary-600 underline underline-offset-2 transition hover:text-primary-700"
              onClick={() => navigate("/signup")}
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
