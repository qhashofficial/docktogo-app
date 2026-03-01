import { useAuth } from "../context/AuthContext";
import * as usersApi from "../api/users";

export function useApi() {
  const { apiClient } = useAuth();
  return {
    apiClient,
    users: {
      getMe: () => usersApi.getMe(apiClient),
      updateMe: (body: Record<string, unknown>) => usersApi.updateMe(apiClient, body),
    },
  };
}
