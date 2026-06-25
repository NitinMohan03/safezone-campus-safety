import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import useAuth from "../auth/useAuth";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error } = useAuth();
  const [formValues, setFormValues] = useState({
    username: "",
    password: "",
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await login(formValues);
      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setFormError(err.message || "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = submitting || loading;

  const inputClasses =
    "w-full rounded-xl border border-slate-200 px-4 py-3 text-base transition focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-[20px] border border-slate-200 bg-white p-8 shadow-[0_30px_60px_rgba(15,23,42,0.1)]">
        <h1 className="text-3xl font-bold text-slate-950 [text-wrap:balance]">Welcome back</h1>
        <p className="mt-2 text-slate-600 [text-wrap:pretty]">
          Sign in with your SafeZone credentials to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Username / Email
            <input
              type="text"
              name="username"
              value={formValues.username}
              onChange={handleChange}
              autoComplete="username"
              required
              disabled={isBusy}
              className={inputClasses}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Password
            <input
              type="password"
              name="password"
              value={formValues.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
              disabled={isBusy}
              className={inputClasses}
            />
          </label>

          {(formError || error) && (
            <div className="rounded-xl border border-rose-300/60 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700" role="alert">
              {formError || error}
            </div>
          )}

          <Button type="submit" disabled={isBusy}>
            {isBusy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Need an account?{" "}
          <button
            type="button"
            className="font-semibold text-primary-600 underline"
            onClick={() => navigate("/signup")}
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
