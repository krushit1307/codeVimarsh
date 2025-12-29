export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

type JsonObject = Record<string, unknown>;

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:5000/api";
const TOKEN_KEY = "adminToken";

const getAdminToken = () => localStorage.getItem(TOKEN_KEY);

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const token = getAdminToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers || {}),
  } as Record<string, string>;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const body = (await res.json().catch(() => null)) as JsonObject | null;

  if (!res.ok) {
    const message = (body?.message as string) || "Request failed";
    throw new AdminApiError(message, res.status);
  }

  return body as unknown as T;
};

export type AdminEvent = {
  _id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  time: string;
  mode: "Online" | "Offline" | "Hybrid";
  location: string;
  image: string;
  registeredCount: number;
};

export type AdminTeam = {
  _id: string;
  slug: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
};

export type AdminTeamMember = {
  _id: string;
  team: string;
  firstName: string;
  lastName: string;
  role: string;
  linkedin?: string | null;
  image?: string | null;
  order: number;
  isActive: boolean;
};

export type AdminRegistration = {
  firstName: string;
  lastName: string;
  email: string;
  registeredAt: string;
};

export type AdminUser = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  role?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  lastLogin?: string | null;
  createdAt?: string;
};

export type AdminUserProfile = {
  _id: string;
  user: string;
  fullName: string;
  profileImage?: string | null;
  prnNumber: string;
  class: string;
  division: "GIA" | "SFI";
  bio?: string;
  isProfileComplete: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminUserProfileResponse = {
  user: AdminUser;
  profile: AdminUserProfile | null;
};

export type CloudinarySignatureResponse = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
};

export const adminApi = {
  getCloudinarySignature: async () => {
    const res = await request<{ success: boolean; data: CloudinarySignatureResponse }>("/admin/cloudinary/signature");
    return res.data;
  },
  listEvents: async () => {
    const res = await request<{ success: boolean; data: AdminEvent[] }>("/admin/events");
    return res.data;
  },
  createEvent: async (payload: Omit<AdminEvent, "_id" | "registeredCount">) => {
    const res = await request<{ success: boolean; data: AdminEvent }>("/admin/events", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.data;
  },
  updateEvent: async (eventId: string, payload: Partial<Omit<AdminEvent, "_id" | "registeredCount">>) => {
    const res = await request<{ success: boolean; data: AdminEvent }>(`/admin/events/${eventId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return res.data;
  },
  deleteEvent: async (eventId: string) => {
    const res = await request<{ success: boolean; message: string }>(`/admin/events/${eventId}`, {
      method: "DELETE",
    });
    return res;
  },
  listTeams: async () => {
    const res = await request<{ success: boolean; data: AdminTeam[] }>("/admin/teams");
    return res.data;
  },
  createTeam: async (payload: Omit<AdminTeam, "_id">) => {
    const res = await request<{ success: boolean; data: AdminTeam }>("/admin/teams", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.data;
  },
  updateTeam: async (teamId: string, payload: Partial<Omit<AdminTeam, "_id">>) => {
    const res = await request<{ success: boolean; data: AdminTeam }>(`/admin/teams/${teamId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return res.data;
  },
  deleteTeam: async (teamId: string) => {
    const res = await request<{ success: boolean; message: string }>(`/admin/teams/${teamId}`, {
      method: "DELETE",
    });
    return res;
  },
  listMembers: async (teamId: string) => {
    const res = await request<{ success: boolean; data: AdminTeamMember[] }>(`/admin/teams/${teamId}/members`);
    return res.data;
  },
  createMember: async (teamId: string, payload: Omit<AdminTeamMember, "_id" | "team">) => {
    const res = await request<{ success: boolean; data: AdminTeamMember }>(`/admin/teams/${teamId}/members`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.data;
  },
  updateMember: async (memberId: string, payload: Partial<Omit<AdminTeamMember, "_id" | "team">>) => {
    const res = await request<{ success: boolean; data: AdminTeamMember }>(`/admin/members/${memberId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return res.data;
  },
  deleteMember: async (memberId: string) => {
    const res = await request<{ success: boolean; message: string }>(`/admin/members/${memberId}`, {
      method: "DELETE",
    });
    return res;
  },
  listRegistrationsByEvent: async (eventId: string) => {
    const res = await request<{ success: boolean; data: AdminRegistration[] }>(`/admin/events/${eventId}/registrations`);
    return res.data;
  },

  getUserProfileByEmail: async (email: string) => {
    const params = new URLSearchParams({ email });
    const res = await request<{ success: boolean; data: AdminUserProfileResponse }>(`/admin/users/profile?${params.toString()}`);
    return res.data;
  },
};
