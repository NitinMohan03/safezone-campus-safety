import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";

const normalizeReport = (report) => {
  if (!report) return report;
  return {
    ...report,
    reporterFirstName: report.reporter_first_name ?? report.reporterFirstName,
    reporterLastName: report.reporter_last_name ?? report.reporterLastName,
    reporterEmail: report.reporter_email ?? report.reporterEmail,
    isAnonymous: report.is_anonymous ?? report.isAnonymous,
    createdAt: report.created_at ?? report.createdAt,
    updatedAt: report.updated_at ?? report.updatedAt,
    zoneId: report.zone_id ?? report.zoneId,
    adminFeedback: report.admin_feedback ?? report.adminFeedback,
    userId: report.user_id ?? report.user ?? report.userId,
  };
};

export function useReports(initial = []) {
  const [reports, setReports] = useState(initial);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.reports.getAll();
      setReports(Array.isArray(data) ? data.map(normalizeReport) : []);
    } catch (err) {
      console.error("Failed to fetch reports", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, isLoading, error, refresh: fetchReports };
}
