export const getApiUrl = () => import.meta.env.VITE_API_URL as string;

export interface AuthProfile {
  id: string;
  email: string;
  displayName: string | null;
  roleType: number;
  destinationId: string | null;
  isActive: boolean;
}

export interface LoginResponse {
  status: string;
  data: {
    access_token: string;
    profile: AuthProfile;
    permissions: string[];
  };
}

export interface RefreshResponse {
  status: string;
  data: {
    access_token: string;
    profile: AuthProfile;
    permissions: string[];
  };
}
