import PropTypes from "prop-types";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  signIn,
  signOut,
  signUp,
} from "aws-amplify/auth";
import { useMockAuth } from "../aws-config";

const AuthContext = createContext(null);

const ADMIN_GROUP_NAME = (import.meta.env.VITE_COGNITO_ADMIN_GROUP || "Admins").toLowerCase();

const MOCK_USERS = {
  admin: {
    username: "admin@example.com",
    attributes: {
      email: "admin@example.com",
      name: "Admin User",
      given_name: "Admin",
      family_name: "User",
    },
    groups: ["Admins"],
  },
  user: {
    username: "user@example.com",
    attributes: {
      email: "user@example.com",
      name: "Regular User",
      given_name: "Regular",
      family_name: "User",
    },
    groups: ["Users"],
  },
};

function mapUserPayload(user) {
  if (!user) return null;

  const groups =
    user.signInUserSession?.idToken?.payload?.["cognito:groups"] ||
    user.groups ||
    [];

  const attributes = user.attributes || {};
  const givenName =
    attributes.given_name ||
    attributes.given ||
    attributes.name?.split(" ")?.[0] ||
    "";
  const familyName =
    attributes.family_name ||
    attributes.family ||
    (attributes.name ? attributes.name.split(" ").slice(1).join(" ") : "") ||
    "";
  const displayName =
    attributes.name ||
    [givenName, familyName].filter(Boolean).join(" ") ||
    user.username ||
    "";

  const isAdmin = Array.isArray(groups)
    ? groups.some((group) => String(group).toLowerCase() === ADMIN_GROUP_NAME)
    : false;

  return {
    username: user.username || user.attributes?.email,
    attributes: {
      ...attributes,
      name: displayName,
      given_name: givenName,
      family_name: familyName,
    },
    groups,
    isAdmin,
    original: user,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const useMock = useMockAuth;

  const loadCurrentUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (useMock) {
        setUser(null);
        return null;
      }
      const current = await getCurrentUser();
      const attributes = await fetchUserAttributes().catch(() => ({}));
      const session = await fetchAuthSession().catch(() => null);
      const groups =
        session?.tokens?.idToken?.payload?.["cognito:groups"] || [];

      const mapped = mapUserPayload({
        username: current?.username,
        attributes,
        groups,
        original: { current, attributes, session },
      });

      setUser(mapped);
      return mapped;
    } catch (err) {
      setUser(null);
      setError(err.message || "Unable to fetch session.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [useMock]);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const login = useCallback(
    async ({ username, password }) => {
      setError(null);
      if (useMock) {
        const mockRecord =
          MOCK_USERS[username] ||
          (password === "admin"
            ? MOCK_USERS.admin
            : password === "user"
            ? MOCK_USERS.user
            : null);
        if (!mockRecord) {
          const mockError = new Error("Invalid mock credentials");
          setError(mockError.message);
          throw mockError;
        }
        const mapped = mapUserPayload(mockRecord);
        setUser(mapped);
        return mapped;
      }
      await signIn({ username, password });
      const mapped = await loadCurrentUser();
      return mapped;
    },
    [useMock, loadCurrentUser]
  );

  const signup = useCallback(
    async ({ username, password, attributes = {} }) => {
      setError(null);
      if (useMock) {
        const mockUser = {
          username,
          attributes: { email: username, ...attributes },
          groups: [],
        };
        setUser(mapUserPayload(mockUser));
        return mockUser;
      }
      const response = await signUp({
        username,
        password,
        options: { userAttributes: attributes },
      });
      return response;
    },
    [useMock]
  );

  const logout = useCallback(async () => {
    setError(null);
    try {
      if (!useMock) {
        await signOut();
      }
    } finally {
      setUser(null);
    }
  }, [useMock]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: Boolean(user?.isAdmin),
      loading,
      error,
      login,
      signup,
      logout,
      refreshUser: loadCurrentUser,
      useMock,
    }),
    [user, loading, error, login, signup, logout, loadCurrentUser, useMock]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
