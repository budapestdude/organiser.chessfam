import apiClient from './client';

export interface ClubEvent {
  id: number;
  club_id: number;
  created_by: number;
  title: string;
  description?: string;
  event_type: 'meetup' | 'tournament' | 'social' | 'training' | 'other';
  start_time: string;
  end_time: string;
  location?: string;
  max_participants?: number;
  is_members_only: boolean;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  rsvp_status?: 'going' | 'maybe' | 'not_going';
  attendee_count?: number;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  event_type: 'meetup' | 'tournament' | 'social' | 'training' | 'other';
  start_time: string;
  end_time: string;
  location?: string;
  max_participants?: number;
  is_members_only?: boolean;
}

export interface EventAttendee {
  id: number;
  user_id: number;
  name: string;
  avatar?: string;
  rating?: number;
  status: 'going' | 'maybe' | 'not_going';
  rsvp_at: string;
  notes?: string;
}

export const clubEventsApi = {
  // Create event
  createEvent: async (clubId: number, data: CreateEventInput) => {
    const response = await apiClient.post(`/clubs/${clubId}/events`, data);
    return response.data;
  },

  // Get club events
  getClubEvents: async (clubId: number, params?: {
    start_date?: string;
    end_date?: string;
    event_type?: string;
  }) => {
    const response = await apiClient.get(`/clubs/${clubId}/events`, { params });
    return response.data;
  },

  // Get single event
  getEvent: async (eventId: number) => {
    const response = await apiClient.get(`/events/${eventId}`);
    return response.data;
  },

  // Update event
  updateEvent: async (eventId: number, data: Partial<CreateEventInput>) => {
    const response = await apiClient.put(`/events/${eventId}`, data);
    return response.data;
  },

  // Delete event
  deleteEvent: async (eventId: number) => {
    const response = await apiClient.delete(`/events/${eventId}`);
    return response.data;
  },

  // RSVP to event
  rsvpToEvent: async (eventId: number, status: 'going' | 'maybe' | 'not_going', notes?: string) => {
    const response = await apiClient.post(`/events/${eventId}/rsvp`, { status, notes });
    return response.data;
  },

  // Get event attendees
  getAttendees: async (eventId: number) => {
    const response = await apiClient.get(`/events/${eventId}/attendees`);
    return response.data;
  },
};
