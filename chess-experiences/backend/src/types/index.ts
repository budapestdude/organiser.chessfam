export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  rating: number;
  avatar: string | null;
  created_at: Date;
  updated_at: Date;
  is_admin?: boolean;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  rating: number;
  avatar: string | null;
  created_at: Date;
  is_admin?: boolean;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
}

export interface Booking {
  id: number;
  user_id: number;
  type: 'master' | 'tournament' | 'club' | 'game';
  item_id: number;
  item_name: string;
  date: string;
  time: string | null;
  price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

export interface Favorite {
  id: number;
  user_id: number;
  type: 'master' | 'tournament' | 'club' | 'player' | 'location';
  item_id: number;
  item_name: string;
  item_image: string;
  added_at: Date;
}

export interface Conversation {
  id: number;
  user_id: number;
  participant_id: number;
  participant_name: string;
  participant_image: string | null;
  participant_type: 'master' | 'player';
  last_message: string | null;
  last_message_time: Date | null;
  unread_count: number;
  created_at: Date;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  read: boolean;
  created_at: Date;
}

export interface Transaction {
  id: number;
  user_id: number;
  booking_id: number | null;
  stripe_payment_intent_id: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  metadata: any;
  created_at: Date;
  updated_at: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
