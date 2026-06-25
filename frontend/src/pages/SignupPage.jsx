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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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
          ? "Mock account created. You are now signed in."
          : "Account created. Please confirm your email if required, then sign in."
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

  const inputClasses =
    "w-full rounded-xl border border-slate-200 px-4 py-3 text-base transition focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-[20px] border border-slate-200 bg-white p-8 shadow-[0_30px_60px_rgba(15,23,42,0.1)]">
        <h1 className="text-3xl font-bold text-slate-950 [text-wrap:balance]">Create an account</h1>
        <p className="mt-2 text-slate-600 [text-wrap:pretty]">
          Join SafeZone to receive alerts and manage your reports.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            First Name
            <input
              type="text"
              name="firstName"
              value={formValues.firstName}
              onChange={handleChange}
              autoComplete="given-name"
              required
              disabled={isBusy}
              className={inputClasses}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Last Name
            <input
              type="text"
              name="lastName"
              value={formValues.lastName}
              onChange={handleChange}
              autoComplete="family-name"
              required
              disabled={isBusy}
              className={inputClasses}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Email
            <input
              type="email"
              name="email"
              value={formValues.email}
              onChange={handleChange}
              autoComplete="email"
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
              autoComplete="new-password"
              required
              disabled={isBusy}
              className={inputClasses}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Confirm Password
            <input
              type="password"
              name="confirmPassword"
              value={formValues.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
              disabled={isBusy}
              className={inputClasses}
            />
          </label>

          {formError && (
            <div className="rounded-xl border border-rose-300/60 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700" role="alert">
              {formError}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-300/60 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700" role="status">
              {success}
            </div>
          )}

          <Button type="submit" disabled={isBusy}>
            {isBusy ? "Creating account…" : "Sign up"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <button
            type="button"
            className="font-semibold text-primary-600 underline"
            onClick={() => navigate("/login")}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;
