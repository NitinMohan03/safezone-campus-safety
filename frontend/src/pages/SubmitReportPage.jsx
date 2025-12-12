// src/pages/SubmitReportPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/ui/Button";
import ReportForm from "../components/forms/ReportForm";
import { api } from "../services/api";
import { createReport } from "../models/schema";
import { incidentTypes } from "../models/tags";
import useAuth from "../auth/useAuth";
import { Filter } from "bad-words";
import LocationSearchResult from "../components/ui/LocationSearchResult";
import useMapboxSearch from "../hooks/useMapboxSearch";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const DAILY_REPORT_LIMIT = 3;

const initialFormState = {
  title: "",
  description: "",
  category: "",
  locationText: "",
  location: null,
  severity: "low",
  incident_type: [],
};

const toDateKey = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join("-");
};

function SubmitReportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editingReportId = searchParams.get("reportId");
  const isEditing = Boolean(editingReportId);
  const { user } = useAuth();

  const [formData, setFormData] = useState(initialFormState);
  const [loadedReport, setLoadedReport] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [submitAnonymously, setSubmitAnonymously] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const profanityFilter = useMemo(() => new Filter(), []);
  const locationSearch = useMapboxSearch();

  const sanitizeDescription = useCallback(
    (value) => {
      if (!value) return "";
      return value.replace(/\w+/g, (word) => {
        if (!profanityFilter.isProfane(word)) return word;
        if (word.length <= 1) return "*";
        return `${word[0]}${"*".repeat(word.length - 1)}`;
      });
    },
    [profanityFilter]
  );

  const reporterName = useMemo(() => {
    if (!user) return "Manual submission";
    const attrs = user.attributes || {};
    const name =
      attrs.name ||
      [attrs.given_name, attrs.family_name].filter(Boolean).join(" ") ||
      user.username;
    return name || "Manual submission";
  }, [user]);

  const reporterId = useMemo(() => {
    if (!user) return "anonymous";
    const raw = user.attributes?.sub || user.username || "anonymous";
    return String(raw).replace(/[^a-zA-Z0-9_-]/g, "_");
  }, [user]);

  const reporterEmail = useMemo(() => {
    return user?.attributes?.email || null;
  }, [user]);

  const reporterIdentity = useMemo(() => {
    const attrs = user?.attributes || {};
    const attrName = (attrs.name || "").trim();
    const attrParts = attrName ? attrName.split(/\s+/).filter(Boolean) : [];
    const fallbackParts = reporterName
      ? reporterName.split(/\s+/).filter(Boolean)
      : [];
    const firstName =
      attrs.given_name || attrParts[0] || fallbackParts[0] || null;
    const lastName =
      attrs.family_name ||
      (attrParts.length > 1 ? attrParts.slice(1).join(" ") : null) ||
      (fallbackParts.length > 1 ? fallbackParts.slice(1).join(" ") : null) ||
      null;
    return { firstName, lastName };
  }, [user, reporterName]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setUserCoords({
          lng: coords.longitude,
          lat: coords.latitude,
        }),
      (err) => console.warn("Unable to retrieve location", err),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timeoutId = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timeoutId);
  }, [toastMessage]);

  useEffect(() => {
    if (!isEditing) return;

    let active = true;
    (async () => {
      try {
        const report = await api.reports.get(editingReportId);
        if (!active) return;
        const loaded = {
          title: report.title || "",
          description: report.description || "",
          category: report.category || "",
          locationText: report.locationLabel || "",
          location: report.location || null,
          severity: report.severity || "medium",
          incident_type: report.tags || [],
        };
        setFormData(loaded);
        setLoadedReport(report);
        setExistingAttachments(report.attachments || []);
        setSubmitAnonymously(Boolean(report.isAnonymous));
      } catch (err) {
        console.error("Failed to load report for editing", err);
        if (active) setError("Unable to load report for editing.");
      }
    })();

    return () => {
      active = false;
    };
  }, [isEditing, editingReportId]);

  const handleReportFieldChange = (field, value) => {
    setSuccessMessage(null);
    const processedValue =
      field === "description" ? sanitizeDescription(value) : value;
    setFormData((prev) => ({
      ...prev,
      [field]: processedValue,
    }));
  };

  const handleLocationChange = async (event) => {
    const value = event.target.value || "";
    setSuccessMessage(null);
    setFormData((prev) => ({
      ...prev,
      locationText: value,
      location: value.length ? prev.location : null,
    }));

    if (value.trim().length < 3) {
      locationSearch.clearSuggestions();
      return;
    }

    try {
      await locationSearch.search(value, userCoords ? [userCoords.lng, userCoords.lat] : null);
    } catch (err) {
      console.error("Mapbox lookup failed", err);
      locationSearch.clearSuggestions();
    }
  };

  const handleSelectSuggestion = async (place) => {
    if (!place?.mapbox_id) return;
    try {
      const result = await locationSearch.retrieve(place.mapbox_id);
      const coords = result?.coords;
      const address =
        result?.address ||
        place.full_address ||
        place.place_formatted ||
        place.name ||
        place.mapbox_id;

      if (Array.isArray(coords) && coords.length === 2) {
        setFormData((prev) => ({
          ...prev,
          locationText: address,
          location: {
            lat: coords[1],
            lng: coords[0],
          },
        }));
      }
    } catch (err) {
      console.error("Mapbox retrieve failed", err);
    } finally {
      locationSearch.clearSuggestions();
    }
  };

  const toggleIncidentType = (value) => {
    setSuccessMessage(null);
    setFormData((prev) => {
      const exists = prev.incident_type.includes(value);
      return {
        ...prev,
        incident_type: exists
          ? prev.incident_type.filter((item) => item !== value)
          : [...prev.incident_type, value],
      };
    });
  };

  const handleFileInput = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeExistingAttachment = (url) => {
    setExistingAttachments((prev) => prev.filter((item) => item !== url));
  };

  const removePendingFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const uploadAttachments = async () => {
    if (!selectedFiles.length) return [];
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error(
        "Cloudinary configuration missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET."
      );
    }
    setIsUploading(true);
    try {
      const uploads = await Promise.all(
        selectedFiles.map(async (file) => {
          const payload = new FormData();
          payload.append("file", file);
          payload.append("upload_preset", UPLOAD_PRESET);

          const res = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
            {
              method: "POST",
              body: payload,
            }
          );
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Cloudinary upload failed: ${errorText}`);
          }
          const data = await res.json();
          return data.secure_url;
        })
      );
      return uploads;
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setSelectedFiles([]);
    setExistingAttachments([]);
    setSubmitAnonymously(false);
  };

  const enforceDailyLimit = async () => {
    if (!reporterId) return false;
    try {
      const allReports = await api.reports.getAll();
      const todayKey = toDateKey(new Date());
      const reportsToday = allReports.filter(
        (report) =>
          report.userId === reporterId &&
          toDateKey(report.createdAt || report.updatedAt) === todayKey
      );
      if (reportsToday.length >= DAILY_REPORT_LIMIT) {
        setDailyLimitReached(true);
        setToastMessage("You’ve reached the daily limit of 3 reports.");
        return true;
      }
      setDailyLimitReached(false);
      return false;
    } catch (err) {
      console.error("Failed to enforce daily limit", err);
      setError(
        "We couldn't verify your daily limit. Please try again shortly."
      );
      return true;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (!isEditing) {
        const reachedLimit = await enforceDailyLimit();
        if (reachedLimit) {
          setIsSubmitting(false);
          return;
        }
      }

      const uploadedAttachments = await uploadAttachments();
      const attachments = [...existingAttachments, ...uploadedAttachments];

      const primaryCategory =
        formData.category || formData.incident_type[0] || "General";
      const tags = formData.incident_type.length
        ? formData.incident_type
        : [primaryCategory];
      const timestamp = new Date().toISOString();
      const apiMode = (import.meta.env.VITE_API_MODE || "django").toLowerCase();
      const useSnakeCasePayload = apiMode === "django";
      const toBackendPayload = (report) => ({
        id: report.id,
        title: report.title,
        category: report.category,
        description: report.description,
        severity: report.severity,
        status: report.status,
        tags: report.tags,
        location: report.location,
        reporter: report.reporter,
        reporter_first_name: report.reporterFirstName,
        reporter_last_name: report.reporterLastName,
        reporter_email: report.reporter_email,
        is_anonymous: report.isAnonymous,
        attachments: report.attachments,
        created_at: report.createdAt || report.created_at || timestamp,
        updated_at: report.updatedAt || report.updated_at || timestamp,
        zone_id: report.zoneId,
        user_id: report.userId || "",
        admin_feedback: report.adminFeedback,
        upvotes: report.upvotes || 0,
      });
      const anonymityMeta = submitAnonymously
        ? {
            reporter: "Anonymous Reporter",
            reporterFirstName: null,
            reporterLastName: null,
            reporter_email: null,
            isAnonymous: true,
          }
        : {
            reporter: reporterName,
            reporterFirstName: reporterIdentity.firstName,
            reporterLastName: reporterIdentity.lastName,
            reporter_email: reporterEmail,
            isAnonymous: false,
          };

      if (isEditing) {
        const baseReport =
          loadedReport || (await api.reports.get(editingReportId));
        const updatedReport = {
          ...baseReport,
          title: formData.title,
          description: formData.description,
          category: primaryCategory,
          severity: formData.severity,
          tags,
          attachments,
          location: formData.location,
          locationLabel: formData.locationText,
          updatedAt: timestamp,
          ...anonymityMeta,
          userId: reporterId || baseReport?.userId,
          reporter_email:
            anonymityMeta.isAnonymous && baseReport?.reporter_email
              ? null
              : anonymityMeta.reporter_email ||
                baseReport?.reporter_email ||
                null,
        };
        const updatePayload = useSnakeCasePayload
          ? toBackendPayload(updatedReport)
          : updatedReport;
        await api.reports.update(editingReportId, updatePayload);
        setSuccessMessage("Report updated successfully!");
        setSelectedFiles([]);
        setExistingAttachments(attachments);
        setLoadedReport(updatedReport);
        navigate(`/review-request/${editingReportId}`, {
          replace: true,
          state: { refreshed: true },
        });
      } else {
        const baseReport = createReport(reporterId || "anonymous", "z1", {
          title: formData.title,
          description: formData.description,
          severity: formData.severity,
          category: primaryCategory,
          status: "pending",
          tags,
          ...anonymityMeta,
          location: formData.location,
          locationLabel: formData.locationText,
          attachments,
          reporter_email:
            anonymityMeta.isAnonymous && loadedReport?.reporter_email
              ? null
              : anonymityMeta.reporter_email ||
                loadedReport?.reporter_email ||
                null,
        });
        const createPayload = useSnakeCasePayload
          ? toBackendPayload(baseReport)
          : baseReport;
        await api.reports.create(createPayload);
        setSuccessMessage("Report submitted successfully!");
        resetForm();
      }
    } catch (err) {
      console.error("Failed to submit report", err);
      setError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const disableForm =
    (!isEditing && dailyLimitReached) ||
    isSubmitting ||
    isUploading ||
    (isEditing && !loadedReport);

  const pendingFilePreviews = useMemo(
    () =>
      selectedFiles.map((file, index) => ({
        index,
        name: file.name,
        sizeKb: Math.round(file.size / 1024),
      })),
    [selectedFiles]
  );

  return (
    <>
      {toastMessage && (
        <div className="fixed right-4 top-4 z-50 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-amber-800 shadow-xl shadow-amber-500/20">
          {toastMessage}
        </div>
      )}
      <div className="relative mx-auto flex max-w-3xl flex-col gap-8 overflow-hidden rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_24px_52px_rgba(15,23,42,0.08)] sm:p-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-500/10 to-sky-500/5" />
        <div className="relative z-10 flex flex-col gap-4 text-center md:flex-row md:items-start md:justify-between md:text-left">
          <div className="space-y-3 md:max-w-2xl">
            <h2 className="text-3xl font-bold text-slate-950">
              {isEditing
                ? "Update Incident Report"
                : "Submit a New Incident Report"}
            </h2>
            <p className="text-base text-slate-700">
              {isEditing
                ? "Review the requested changes, update the details, and resubmit to SafeZone."
                : "Help keep the community safe by reporting an incident."}
            </p>
          </div>
        </div>

        {dailyLimitReached && !isEditing && (
          <div className="rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            You’ve reached the daily limit of 3 reports. Please try again
            tomorrow.
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10 grid gap-6">
          <ReportForm
            values={{
              title: formData.title,
              description: formData.description,
              category: formData.category,
              severity: formData.severity,
            }}
            onChange={handleReportFieldChange}
            disabled={disableForm}
          />

          <div className="relative grid gap-2">
            <label className="font-semibold text-slate-800" htmlFor="location">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="locationText"
              value={formData.locationText}
              onChange={handleLocationChange}
              placeholder="Enter or search location"
              autoComplete="off"
              disabled={disableForm}
              className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-base shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60"
            />
            {locationSearch.suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-20 max-h-56 list-none overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-0 shadow-2xl">
                {locationSearch.suggestions.map((place) => (
                  <LocationSearchResult
                    key={place.mapbox_id || place.id}
                    item={place}
                    onClick={() => handleSelectSuggestion(place)}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-2">
            <span className="font-semibold text-slate-800">Incident Type</span>
            <div className="flex flex-wrap gap-3">
              {incidentTypes.map(({ value, label }) => {
                const isSelected = formData.incident_type.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleIncidentType(value)}
                    className={[
                      "rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition duration-200 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60",
                      isSelected
                        ? "border-primary-500 bg-primary-600 text-white shadow-[0_0_0_3px_rgba(37,99,235,0.16)]"
                        : "bg-slate-100",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    disabled={disableForm}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-2">
            <label
              className="font-semibold text-slate-800"
              htmlFor="attachments"
            >
              Photo / Evidence (optional)
            </label>
            <input
              id="attachments"
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileInput}
              disabled={disableForm}
              className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-3 text-sm text-slate-700 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-primary-300 disabled:cursor-not-allowed disabled:opacity-60"
            />
            {(existingAttachments.length > 0 ||
              pendingFilePreviews.length > 0) && (
              <div className="flex flex-wrap gap-2 pt-2">
                {existingAttachments.map((url) => (
                  <div
                    key={url}
                    className="inline-flex items-center gap-2 rounded-full bg-cyan-900/10 px-3 py-1 text-xs font-medium text-slate-800"
                  >
                    <span>{url.split("/").pop()}</span>
                    <button
                      type="button"
                      onClick={() => removeExistingAttachment(url)}
                      disabled={disableForm}
                      className="rounded-full bg-transparent p-0 text-base leading-none text-slate-600 transition hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {pendingFilePreviews.map(({ index, name, sizeKb }) => (
                  <div
                    key={`${name}-${index}`}
                    className="inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-700"
                  >
                    <span>
                      {name} ({sizeKb} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => removePendingFile(index)}
                      disabled={disableForm}
                      className="rounded-full bg-transparent p-0 text-base leading-none text-primary-700 transition hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-left text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-400 disabled:cursor-not-allowed"
              checked={submitAnonymously}
              disabled={disableForm}
              onChange={(event) => setSubmitAnonymously(event.target.checked)}
            />
            <span>
              <span className="font-semibold text-slate-900">
                Submit anonymously
              </span>
              <br />
              Hide your name in the Live Feed and My Reports. SafeZone staff
              will still be able to reach you through your account if follow-up
              is required.
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={disableForm}>
              {isSubmitting || isUploading
                ? isEditing
                  ? "Saving…"
                  : "Submitting…"
                : isEditing
                  ? "Save changes"
                  : "Submit report"}
            </Button>
            {isEditing && (
              <Button
                type="button"
                variant="ghost"
                disabled={disableForm}
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            )}
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-300/60 bg-rose-200/30 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="rounded-2xl border border-emerald-300/60 bg-emerald-200/30 px-4 py-3 text-sm font-semibold text-emerald-700">
              {successMessage}
            </div>
          )}
        </form>
      </div>
    </>
  );
}

export default SubmitReportPage;
