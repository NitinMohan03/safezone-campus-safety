import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import useAuth from "../auth/useAuth";

function SignupPage() {
  const navigate = useNavigate();
  const { signup, login, loading, useMock } = useAuth();
  const [formValues, setFormValues] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);

    if (!formValues.firstName.trim() || !formValues.lastName.trim()) {
      setFormError("First and last name are required.");
      return;
    }
    if (formValues.password !== formValues.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await signup({
        username: formValues.email,
        password: formValues.password,
        attributes: {
          email: formValues.email,
          name: `${formValues.firstName} ${formValues.lastName}`.trim(),
          given_name: formValues.firstName,
          family_name: formValues.lastName,
        },
      });
      setSuccess(
        useMock
          ? "Account created. You are now signed in."
          : "Account created. Please confirm your email, then sign in."
      );
      if (useMock) {
        await login({ username: formValues.email, password: formValues.password });
        navigate("/", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    } catch (err) {
      setFormError(err.message || "Unable to sign up right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = submitting || loading;

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-base text-slate-900 transition placeholder:text-slate-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-stretch overflow-hidden rounded-[28px] border border-slate-200 shadow-[0_32px_64px_rgba(15,23,42,0.12)]">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[360px] lg:shrink-0 lg:flex-col lg:items-start lg:justify-between lg:bg-gradient-to-br lg:from-slate-900 lg:via-slate-800 lg:to-primary-950 lg:px-10 lg:py-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/20 ring-1 ring-primary-400/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-primary-400">
              <path d="M12 2L3 6v6c0 5.523 3.814 10.693 9 12 5.186-1.307 9-6.477 9-12V6l-9-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white">SafeZone</span>
        </div>

        <div className="flex flex-col gap-5">
          <h2 className="text-3xl font-bold leading-tight text-white [text-wrap:balance]">
            Join your campus safety network.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Create an account to submit reports, receive real-time alerts for incidents near you, and help keep the NYU community safe.
          </p>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-sm text-slate-300">Live incident feed active</span>
          </div>
        </div>

        <p className="text-xs text-slate-600">© 2026 SafeZone · NYU Tandon</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-7">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 lg:hidden">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-primary-600">
                <path d="M12 2L3 6v6c0 5.523 3.814 10.693 9 12 5.186-1.307 9-6.477 9-12V6l-9-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-950">Create an account</h1>
            <p className="mt-1.5 text-slate-500">Join SafeZone to report and stay informed.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                First Name
                <input
                  type="text"
                  name="firstName"
                  value={formValues.firstName}
                  onChange={handleChange}
                  autoComplete="given-name"
                  required
                  disabled={isBusy}
                  placeholder="Jane"
                  className={inputClass}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Last Name
                <input
                  type="text"
                  name="lastName"
                  value={formValues.lastName}
                  onChange={handleChange}
                  autoComplete="family-name"
                  required
                  disabled={isBusy}
                  placeholder="Doe"
                  className={inputClass}
                />
              </label>
            </div>

            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Email
              <input
                type="email"
                name="email"
                value={formValues.email}
                onChange={handleChange}
                autoComplete="email"
                required
                disabled={isBusy}
                placeholder="you@nyu.edu"
                className={inputClass}
              />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Password
              <input
                type="password"
                name="password"
                value={formValues.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
                disabled={isBusy}
                placeholder="••••••••"
                className={inputClass}
              />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
              Confirm Password
              <input
                type="password"
                name="confirmPassword"
                value={formValues.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
                disabled={isBusy}
                placeholder="••••••••"
                className={inputClass}
              />
            </label>

            {formError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700" role="alert">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-rose-500">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 5v3M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {formError}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm font-medium text-emerald-700" role="status">
                {success}
              </div>
            )}

            <Button type="submit" disabled={isBusy} className="mt-1 w-full">
              {isBusy ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <button
              type="button"
              className="font-semibold text-primary-600 underline underline-offset-2 transition hover:text-primary-700"
              onClick={() => navigate("/login")}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
