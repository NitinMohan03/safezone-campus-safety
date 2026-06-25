import { Link } from "react-router-dom";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useReports } from "../hooks/useReports";
import { getRelativeTime } from "../utils/date";

function AnimatedBlock({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={[
        "transform-gpu transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
        visible ? "translate-y-0" : "translate-y-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

function StatItem({ label, value, loading }) {
  return (
    <li className="flex items-center gap-3">
      {loading ? (
        <span className="inline-block h-9 w-14 animate-pulse motion-reduce:animate-none motion-reduce:opacity-60 rounded-lg bg-primary-100" />
      ) : (
        <strong className="text-3xl font-bold tabular-nums text-primary-600">
          {value}
        </strong>
      )}
      <span className="text-slate-700">{label}</span>
    </li>
  );
}

function HomePage() {
  const {
    reports,
    isLoading: reportsLoading,
    error: reportsError,
  } = useReports();

  const highSeverityIncidents = useMemo(
    () =>
      reports
        .filter((incident) => incident.severity === "high")
        .map((incident) => ({
          ...incident,
          statusLabel: (incident.status || "").replace(/(^|\s)\S/g, (s) =>
            s.toUpperCase()
          ),
          relativeTime:
            getRelativeTime(incident.updatedAt || incident.createdAt) ||
            "Recently",
        }))
        .slice(0, 4),
    [reports]
  );

  const approvedCount = useMemo(
    () => reports.filter((r) => r.status === "approved").length,
    [reports]
  );

  const highSeverityCount = useMemo(
    () => reports.filter((r) => r.severity === "high").length,
    [reports]
  );

  const heroPrimaryButtonClasses =
    "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-sky-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-primary-500/20 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2";
  const heroSecondaryButtonClasses =
    "inline-flex items-center justify-center rounded-full border border-primary-200 bg-white/70 px-6 py-3 text-base font-semibold text-primary-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2";

  return (
    <div className="flex flex-col gap-14">
      {/* Hero */}
      <AnimatedBlock>
        <section className="grid gap-10 rounded-[24px] bg-gradient-to-br from-primary-500/10 via-sky-500/5 to-white p-8 shadow-[0_24px_48px_rgba(15,23,42,0.08)] sm:grid-cols-[minmax(0,1.1fr)_1fr] sm:p-10">
          <div className="flex max-w-xl flex-col gap-5">
            <h1 className="text-5xl font-bold text-slate-950 [text-wrap:balance]">
              Welcome to SafeZone
            </h1>
            <p className="text-lg text-slate-700">
              Report safety incidents, see what&apos;s happening near campus in
              real time, and plan safer routes across the NYU community.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/submit-report" className={heroPrimaryButtonClasses}>
                Share an Incident
              </Link>
              <Link to="/live-feed" className={heroSecondaryButtonClasses}>
                View Live Feed
              </Link>
            </div>
          </div>

          <AnimatedBlock delay={120} className="h-full">
            <div className="flex h-full flex-col gap-5 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur">
              <h3 className="text-xl font-semibold text-slate-900">
                Live Overview
              </h3>
              <ul className="grid gap-4 p-0 text-slate-700">
                <StatItem
                  label="approved incidents"
                  value={approvedCount}
                  loading={reportsLoading}
                />
                <StatItem
                  label="total community reports"
                  value={reports.length}
                  loading={reportsLoading}
                />
                <StatItem
                  label="high severity"
                  value={highSeverityCount}
                  loading={reportsLoading}
                />
              </ul>
              <p className="text-sm text-slate-600">
                Updates as new reports are filed.
              </p>
            </div>
          </AnimatedBlock>
        </section>
      </AnimatedBlock>

      {/* High Severity Alerts */}
      {reportsLoading && (
        <AnimatedBlock>
          <section
            className="flex flex-col gap-7 rounded-[24px] border border-rose-700/20 bg-gradient-to-br from-rose-500/20 via-orange-100/20 to-white p-8 shadow-[0_24px_52px_rgba(185,28,28,0.18)] sm:p-10"
            aria-live="polite"
          >
            <p className="text-slate-600">Loading latest safety alerts…</p>
          </section>
        </AnimatedBlock>
      )}

      {!reportsLoading && highSeverityIncidents.length > 0 && (
        <AnimatedBlock>
          <section
            className="flex flex-col gap-7 rounded-[24px] border border-rose-700/20 bg-gradient-to-br from-rose-500/20 via-orange-100/20 to-white p-8 shadow-[0_24px_52px_rgba(185,28,28,0.18)] sm:p-10"
            aria-live="polite"
          >
            <div className="grid gap-3">
              <h2 className="text-3xl font-semibold text-slate-900 [text-wrap:balance]">
                High Severity Alert
              </h2>
              <p className="text-slate-600">
                Immediate attention required. Stay clear of the impacted zones
                and follow official guidance.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {highSeverityIncidents.map((incident, index) => (
                <AnimatedBlock
                  key={incident.id}
                  delay={80 * index}
                  className="h-full"
                >
                  <article className="flex h-full flex-col gap-4 rounded-2xl border border-rose-700/20 bg-white/90 p-6 shadow-[0_18px_46px_rgba(185,28,28,0.16)]">
                    <div className="flex items-start justify-between gap-4">
                      <span className="inline-flex items-center rounded-full bg-rose-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.05em] text-rose-700">
                        {incident.statusLabel || incident.status}
                      </span>
                      <span className="text-sm text-slate-600">
                        {incident.relativeTime}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 [text-wrap:balance]">
                      {incident.title}
                    </h3>
                    <p className="text-slate-700">{incident.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {incident.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link
                      to="/live-feed"
                      className="mt-auto inline-flex items-center font-semibold text-rose-600 transition-transform duration-200 hover:translate-x-1"
                    >
                      View in Live Feed →
                    </Link>
                  </article>
                </AnimatedBlock>
              ))}
            </div>
          </section>
        </AnimatedBlock>
      )}

      {reportsError && (
        <AnimatedBlock>
          <p className="rounded-2xl border border-rose-300/60 bg-rose-200/30 px-4 py-3 text-sm font-medium text-rose-800">
            Unable to load live alerts right now. Please try again shortly.
          </p>
        </AnimatedBlock>
      )}

      {/* Features */}
      <AnimatedBlock>
        <section className="space-y-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-semibold text-slate-900 [text-wrap:balance]">
              How SafeZone Helps Your Community
            </h2>
            <p className="max-w-2xl text-slate-600">
              From spotting an incident to coordinating a response — everything
              you need to stay informed and act fast.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            <AnimatedBlock className="flex flex-col gap-3" delay={0}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="2" fill="currentColor" />
                  <path d="M6.343 13.657a6 6 0 0 1 0-8.485M13.657 6.343a6 6 0 0 1 0 8.485" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M3.515 16.485A10 10 0 0 1 3.515 3.515M16.485 3.515a10 10 0 0 1 0 13.97" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Live Safety Feed
              </h3>
              <p className="text-slate-600">
                Track nearby incidents as they unfold with real-time updates and
                intuitive status indicators.
              </p>
            </AnimatedBlock>

            <AnimatedBlock className="flex flex-col gap-3" delay={100}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M4 4h12a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7 8h6M7 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Quick Reporting
              </h3>
              <p className="text-slate-600">
                Share what you see in seconds. Attach location, images, and
                details so responders know what to expect.
              </p>
            </AnimatedBlock>

            <AnimatedBlock className="flex flex-col gap-3" delay={200}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M1 17c0-3.038 2.686-5.5 6-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="14" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10.5 16.5c0-2.485 1.567-4.5 3.5-4.5s3.5 2.015 3.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Collaborative Response
              </h3>
              <p className="text-slate-600">
                Empower community members and responders to communicate swiftly,
                reducing uncertainty when seconds matter.
              </p>
            </AnimatedBlock>
          </div>
        </section>
      </AnimatedBlock>

      {/* NYU Coverage Map */}
      <AnimatedBlock>
        <section className="flex flex-col items-center gap-7 rounded-[28px] border border-slate-900/10 bg-white p-8 text-center shadow-[0_30px_60px_rgba(15,23,42,0.12)] sm:p-10">
          <div className="grid max-w-3xl gap-4">
            <h2 className="text-3xl font-semibold text-slate-900 [text-wrap:balance]">
              NYU Safety Coverage
            </h2>
            <p className="text-slate-700">
              SafeZone prioritizes the NYU community with real-time insights for
              MetroTech Center and the surrounding Brooklyn neighborhoods.
            </p>
          </div>

          <div className="relative w-full max-w-[880px] overflow-hidden rounded-[22px] shadow-[0_26px_50px_rgba(15,23,42,0.18)] aspect-[4/3] sm:aspect-video">
            <iframe
              title="SafeZone NYU Coverage"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3023.043546566278!2d-73.99139412372358!3d40.693318241782274!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a43f7229dbb%3A0x9f5268724a5d03d9!2sNYU%20Tandon%20School%20of%20Engineering!5e0!3m2!1sen!2sus!4v1738622192000!5m2!1sen!2sus"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full border-0"
            />
          </div>
        </section>
      </AnimatedBlock>
    </div>
  );
}

export default HomePage;
