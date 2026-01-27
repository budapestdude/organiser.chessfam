export interface User {
  id: number;
  name: string;
  email: string;
  is_admin?: boolean;
  rating?: number;
  avatar?: string;
  created_at: string;
}

export interface Tournament {
  id: number;
  organizer_id: number;
  name: string;
  description: string;
  tournament_type: string;
  time_control: string;
  format: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  max_participants: number;
  current_participants: number;
  entry_fee: number;
  currency: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  image?: string;
  venue_name?: string;
  city?: string;
}

export interface Club {
  id: number;
  owner_id: number;
  name: string;
  description: string;
  city: string;
  country: string;
  member_count: number;
  image?: string;
  is_active: boolean;
  founded_year?: number;
  membership_fee?: number;
  address?: string;
  website?: string;
  contact_email?: string;
}

export interface DashboardData {
  tournaments: {
    total: number;
    upcoming: number;
    ongoing: number;
    completed: number;
    total_revenue: number;
    total_participants: number;
  };
  clubs: {
    total: number;
    total_members: number;
    total_revenue: number;
    active_events: number;
  };
  recent_activity: Array<{
    type: 'tournament_registration' | 'club_join' | 'payment' | 'refund';
    title: string;
    timestamp: string;
    amount?: number;
  }>;
  upcoming_events: Array<{
    id: number;
    type: 'tournament' | 'club_event';
    name: string;
    date: string;
    participants: number;
  }>;
}

export interface TournamentAnalytics {
  total_registrations: number;
  revenue: {
    total: number;
    paid: number;
    pending: number;
    refunded: number;
  };
  registrations_by_day: Array<{ date: string; count: number }>;
  rating_distribution: Array<{ range: string; count: number }>;
  geographic_distribution: Array<{ country: string; count: number }>;
  discount_usage: {
    early_bird: number;
    junior: number;
    senior: number;
    women: number;
    titled: number;
  };
  refund_requests: {
    total: number;
    approved: number;
    pending: number;
    amount_refunded: number;
  };
}

export interface FinancialData {
  summary: {
    total_revenue: number;
    total_refunds: number;
    net_revenue: number;
  };
  by_month: Array<{
    month: string;
    revenue: number;
    refunds: number;
    net: number;
  }>;
  by_event: Array<{
    event_id: number;
    event_name: string;
    type: 'tournament' | 'club';
    revenue: number;
    refunds: number;
    participants: number;
  }>;
  transactions: Array<{
    id: number;
    date: string;
    type: 'payment' | 'refund';
    amount: number;
    event_name: string;
    participant_name: string;
    status: string;
  }>;
}

export interface Participant {
  id: number;
  user_id: number;
  tournament_id: number;
  name: string;
  email: string;
  rating?: number;
  status: 'pending' | 'approved' | 'rejected';
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  payment_amount: number;
  discount_applied?: string;
  registered_at: string;
  approved_at?: string;
  country?: string;
}

export interface ClubMember {
  id: number;
  user_id: number;
  club_id: number;
  name: string;
  email: string;
  rating?: number;
  role: 'admin' | 'member' | 'coach';
  joined_at: string;
  membership_status: 'active' | 'inactive';
  payment_status?: 'pending' | 'paid' | 'expired';
}

export interface Notification {
  id: number;
  type: 'tournament_registration' | 'club_join' | 'payment' | 'refund_request' | 'review' | 'message';
  title: string;
  message: string;
  event_id?: number;
  event_type?: 'tournament' | 'club';
  event_name?: string;
  read_at?: string | null;
  created_at: string;
  link?: string;
}
