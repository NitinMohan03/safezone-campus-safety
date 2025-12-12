import { Link } from "react-router-dom";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useReports } from "../hooks/useReports";
import { getRelativeTime } from "../utils/date";

function AnimatedBlock({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

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
        "transform-gpu transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
        visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
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

  const heroPrimaryButtonClasses =
    "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-sky-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-primary-500/20 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2";
  const heroSecondaryButtonClasses =
    "inline-flex items-center justify-center rounded-full border border-primary-200 bg-white/70 px-6 py-3 text-base font-semibold text-primary-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2";

  return (
    <div className="flex flex-col gap-14">
      <AnimatedBlock>
        <section className="grid gap-10 rounded-[24px] bg-gradient-to-br from-primary-500/10 via-sky-500/5 to-white p-8 shadow-[0_24px_48px_rgba(15,23,42,0.08)] sm:grid-cols-[minmax(0,1.1fr)_1fr] sm:p-10">
          <div className="flex max-w-xl flex-col gap-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-600">
              Community Safety Dashboard
            </p>
            <h1 className="text-4xl font-bold text-slate-950">
              Welcome to SafeZone
            </h1>
            <p className="text-lg text-slate-700">
              Stay informed about emerging incidents, collaborate with your
              neighbors, and report safety concerns in seconds. SafeZone keeps
              every resident in the loop with real-time updates and actionable
              insights.
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
            <div className="flex h-full flex-col gap-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur">
              <h3 className="text-2xl font-semibold text-slate-900">
                Today&apos;s Snapshot
              </h3>
              <ul className="grid gap-3 p-0 text-slate-700">
                <li className="flex items-center gap-3">
                  <strong className="text-3xl font-bold text-primary-600">
                    3
                  </strong>
                  <span>Active incidents being monitored</span>
                </li>
                <li className="flex items-center gap-3">
                  <strong className="text-3xl font-bold text-primary-600">
                    12
                  </strong>
                  <span>Reports submitted this week</span>
                </li>
                <li className="flex items-center gap-3">
                  <strong className="text-3xl font-bold text-primary-600">
                    8 mins
                  </strong>
                  <span>Average time to acknowledge a report</span>
                </li>
              </ul>
              <p className="text-slate-600">
                Data updates as new reports are filed.
              </p>
            </div>
          </AnimatedBlock>
        </section>
      </AnimatedBlock>

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
              <h2 className="text-3xl font-semibold text-slate-900">
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
                    <h3 className="text-xl font-semibold text-slate-900">
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

      <AnimatedBlock>
        <section className="space-y-8">
          <h2 className="text-3xl font-semibold text-slate-900">
            How SafeZone Helps Your Community
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <AnimatedBlock className="h-full" delay={0}>
              <article className="flex h-full flex-col gap-3 rounded-2xl border border-slate-900/10 bg-white p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/20 to-sky-500/20 text-base font-bold text-primary-700">
                  01
                </div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Live Safety Feed
                </h3>
                <p className="text-slate-700">
                  Track nearby incidents as they unfold with automatic updates
                  and intuitive status badges.
                </p>
              </article>
            </AnimatedBlock>

            <AnimatedBlock className="h-full" delay={120}>
              <article className="flex h-full flex-col gap-3 rounded-2xl border border-slate-900/10 bg-white p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/20 to-sky-500/20 text-base font-bold text-primary-700">
                  02
                </div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Quick Reporting
                </h3>
                <p className="text-slate-700">
                  Share what you see in just a few fields. Attach key details so
                  responders know what to expect.
                </p>
              </article>
            </AnimatedBlock>

            <AnimatedBlock className="h-full" delay={240}>
              <article className="flex h-full flex-col gap-3 rounded-2xl border border-slate-900/10 bg-white p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/20 to-sky-500/20 text-base font-bold text-primary-700">
                  03
                </div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Collaborative Response
                </h3>
                <p className="text-slate-700">
                  Empower neighbors and responders to communicate swiftly,
                  reducing uncertainty when seconds matter.
                </p>
              </article>
            </AnimatedBlock>
          </div>
        </section>
      </AnimatedBlock>

      <AnimatedBlock>
        <section className="flex flex-col items-center gap-7 rounded-[28px] border border-slate-900/10 bg-white p-8 text-center shadow-[0_30px_60px_rgba(15,23,42,0.12)] sm:p-10">
          <div className="grid max-w-3xl gap-4">
            <h2 className="text-3xl font-semibold text-slate-900">
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

      {/* <AnimatedBlock>
        <section className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-gradient-to-r from-primary-500/15 to-sky-500/10 p-8 shadow-[0_18px_40px_rgba(15,23,42,0.1)]">
          <div className="max-w-xl space-y-3">
            <h2 className="text-3xl font-semibold text-slate-900">
              Ready to make your neighborhood safer?
            </h2>
            <p className="text-slate-700">
              Every report—large or small—helps paint a clearer picture.
              Let&apos;s keep each other informed and prepared.
            </p>
          </div>
          <Link to="/submit-report" className={heroPrimaryButtonClasses}>
            Share an Incident
          </Link>
        </section>
      </AnimatedBlock> */}
    </div>
  );
}

export default HomePage;
