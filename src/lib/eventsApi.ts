import { apiGet, apiPost } from "@/lib/apiClient";

export interface EventDto {
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
  hasRegistered: boolean;
}

export const fetchEvents = async (): Promise<EventDto[]> => {
  const res = await apiGet<{ success: boolean; data: EventDto[] }>("/events");
  return res.data;
};

export const registerForEvent = async (eventId: string) => {
  const res = await apiPost<{ success: boolean; data: { event: EventDto } }>(`/events/${eventId}/register`, {});
  return res.data.event;
};
