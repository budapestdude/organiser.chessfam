export interface VenueSubmission {
  id: number;
  user_id: number;
  venue_name: string;
  venue_type: 'park' | 'cafe' | 'club' | 'community_center' | 'other';
  address: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  phone?: string;
  email: string;
  website?: string;
  description?: string;
  amenities?: string[];
  opening_hours?: string;
  image_url?: string;
  contact_person_name?: string;
  contact_person_phone?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateVenueSubmissionRequest {
  venue_name: string;
  venue_type: 'park' | 'cafe' | 'club' | 'community_center' | 'other';
  address: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  phone?: string;
  email: string;
  website?: string;
  description?: string;
  amenities?: string[];
  opening_hours?: string;
  image_url?: string;
  contact_person_name?: string;
  contact_person_phone?: string;
}
