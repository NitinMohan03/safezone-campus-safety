// src/services/api.js

// --------------------------------------------------
// 🌐 API 基礎設定
// --------------------------------------------------
// Prefer new env name; fall back for compatibility. In mock mode we deliberately
// use a blank base so fetch hits relative paths (intercepted by Playwright).
const isMockMode = (import.meta.env.MODE || "").toLowerCase() === "mock";
const mode = (import.meta.env.VITE_API_MODE || "django").toLowerCase();
const rawBase = isMockMode
  ? ""
  : import.meta.env.VITE_API_BASE_URL ||
      (mode === "json"
        ? import.meta.env.VITE_API_JSON ||
          import.meta.env.VITE_API_DJANGO ||
          import.meta.env.VITE_BACKEND_URL ||
          import.meta.env.VITE_API_URL ||
          "http://localhost:5001"
        : import.meta.env.VITE_API_DJANGO ||
          import.meta.env.VITE_BACKEND_URL ||
          import.meta.env.VITE_API_URL ||
          import.meta.env.VITE_API_JSON ||
          "http://127.0.0.1:8000/api");
const API_BASE = rawBase.replace(/\/+$/, "");

const joinUrl = (endpoint) => {
  if (!API_BASE) return endpoint;
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  // Ensure trailing slash for Django endpoints
  const withSlash = path.endsWith("/") ? path : `${path}/`;
  return `${API_BASE}${withSlash}`;
};

// --------------------------------------------------
// 🧰 通用請求處理器 (集中錯誤、標頭、解析邏輯)
// --------------------------------------------------
async function request(endpoint, options = {}) {
  const url = joinUrl(endpoint);
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const msg = `HTTP ${res.status}: ${res.statusText}`;
    console.error(`[API ERROR] ${msg}`);
    throw new Error(msg);
  }

  // DELETE 回傳 204 無內容，避免 JSON parse error
  if (res.status === 204) return null;
  return res.json();
}

// --------------------------------------------------
// 🧩 API 模組定義 (五個主要模組 + AdminActions)
// --------------------------------------------------
export const api = {
  // ---------------- USERS ----------------
  users: {
    getAll: () => request("/users"),
    get: (id) => request(`/users/${id}`),
    create: (data) =>
      request("/users", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      request(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id) => request(`/users/${id}`, { method: "DELETE" }),
  },

  // ---------------- ZONES ----------------
  zones: {
    getAll: () => request("/zones"),
    get: (id) => request(`/zones/${id}`),
    create: (data) =>
      request("/zones", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      request(`/zones/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id) => request(`/zones/${id}`, { method: "DELETE" }),
  },

  // ---------------- REPORTS ----------------
  reports: {
    getAll: () => request("/reports"),
    get: (id) => request(`/reports/${id}`),
    create: (data) =>
      request("/reports", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) =>
      request(`/reports/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    patch: (id, data) =>
      request(`/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id) => request(`/reports/${id}`, { method: "DELETE" }),
  },

  // ---------------- VOTES ----------------
  votes: {
    getAll: () => request("/votes"),
    get: (id) => request(`/votes/${id}`),
    add: (data) =>
      request("/votes", { method: "POST", body: JSON.stringify(data) }),
    delete: (id) => request(`/votes/${id}`, { method: "DELETE" }),
  },

  // ---------------- ALERT SUBSCRIPTIONS ----------------
  alerts: {
    getAll: () => request("/alertSubscriptions"),
    get: (id) => request(`/alertSubscriptions/${id}`),
    create: (data) =>
      request("/alertSubscriptions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id) => request(`/alertSubscriptions/${id}`, { method: "DELETE" }),
  },

  // ---------------- FOLLOW-UP REQUESTS ----------------
  followUps: {
    getAll: () => request("/followUpRequests"),
    getByReport: (reportId) =>
      request(`/followUpRequests?reportId=${reportId}`).then((data) =>
        Array.isArray(data) ? data[0] || null : data
      ),
    create: (data) =>
      request("/followUpRequests", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/followUpRequests/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  // ---------------- MAILCHIMP MOCK EVENTS ----------------
  mailchimpEvents: {
    getAll: () => request("/mailchimpEvents"),
    create: (data) =>
      request("/mailchimpEvents", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
};

// --------------------------------------------------
// 🧪 Example usage (in any component):
// --------------------------------------------------
/*
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function ReportsList() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    api.reports.getAll().then(setReports).catch(console.error);
  }, []);

  return (
    <div>
      <h2>Reports</h2>
      {reports.map(r => (
        <div key={r.id}>
          <h4>{r.category}</h4>
          <p>{r.description}</p>
        </div>
      ))}
    </div>
  );
}
*/
