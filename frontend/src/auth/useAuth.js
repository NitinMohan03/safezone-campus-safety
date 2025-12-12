import { useAuthContext } from "./AuthProvider.jsx";

export default function useAuth() {
  return useAuthContext();
}
