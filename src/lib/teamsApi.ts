import { apiGet } from "@/lib/apiClient";

export type PublicTeam = {
  _id: string;
  slug: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
  membersCount: number;
};

export type PublicTeamMember = {
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

export const teamsApi = {
  listTeams: async () => {
    const res = await apiGet<{ success: boolean; data: PublicTeam[] }>("/teams");
    return res.data;
  },
  getTeamBySlug: async (slug: string) => {
    const res = await apiGet<{ success: boolean; data: PublicTeam }>(`/teams/${encodeURIComponent(slug)}`);
    return res.data;
  },
  listMembersByTeamSlug: async (slug: string) => {
    const res = await apiGet<{ success: boolean; data: PublicTeamMember[] }>(`/teams/${encodeURIComponent(slug)}/members`);
    return res.data;
  },
};
