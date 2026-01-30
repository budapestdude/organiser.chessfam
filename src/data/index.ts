export interface Master {
  id: number;
  name: string;
  title: string;
  rating: number;
  country: string;
  specialty: string;
  price: number;
  available: boolean;
  image: string;
  reviews: number;
  avgRating: number;
  bio: string;
  languages: string[];
  sessionTypes: string[];
  achievements?: string[];
  responseTime?: string;
  featured?: boolean;
  timeControlPricing?: {
    bullet: number;
    blitz: number;
    rapid: number;
    classical: number;
  };
  coordinates?: { lat: number; lng: number };
}

export interface Review {
  id: number;
  masterId: number;
  userName: string;
  userImage: string;
  rating: number;
  date: string;
  comment: string;
  sessionType: string;
}

export interface Tournament {
  id: number;
  name: string;
  type: 'Classical' | 'Rapid' | 'Blitz' | 'Bullet';
  date: string;
  location: string;
  prize: string;
  players: { current: number; max: number };
  entryFee: number;
  timeControl: string;
  featured: boolean;
  image: string;
  description: string;
  rounds: number;
  format?: string;
  organizer?: string;
  ratingMin?: number;
  ratingMax?: number;
  coordinates?: { lat: number; lng: number };
}

export interface Club {
  id: number;
  name: string;
  location: string;
  address: string;
  distance: string;
  members: number;
  rating: number;
  reviews: number;
  hours: string;
  image: string;
  tags: string[];
  featured: boolean;
  description: string;
  amenities: string[];
  upcomingEvents?: string[];
  monthlyFee?: number;
  coordinates: { lat: number; lng: number };
}

export interface Player {
  id: number;
  name: string;
  rating: number;
  location: string;
  distance: string;
  preferences: string[];
  availability: string;
  online: boolean;
  image: string;
  gamesPlayed: number;
  winRate: number;
  bio: string;
  joinedDate?: string;
  streak?: number;
  coordinates: { lat: number; lng: number };
}

export interface GameLocation {
  id: number;
  name: string;
  type: 'Park' | 'Cafe' | 'Library' | 'Plaza' | 'Bar';
  location: string;
  address: string;
  distance: string;
  description: string;
  image: string;
  rating: number;
  activeGames: number;
  busyHours: string;
  amenities: string[];
  coordinates: { lat: number; lng: number };
  upcomingEvents?: Array<{
    title: string;
    date: string;
    time: string;
    description: string;
    type: 'tournament' | 'casual' | 'lesson' | 'social';
  }>;
}

// Masters data - now fetched from API
export const masters: Master[] = [];

// Reviews data - now fetched from API
export const reviews: Review[] = [];

// Tournaments data - now fetched from API
export const tournaments: Tournament[] = [];

// Clubs data - now fetched from API
export const clubs: Club[] = [];

// Players data - now fetched from API
export const players: Player[] = [];

// Game locations data - now fetched from API (venues)
export const gameLocations: GameLocation[] = [];

export interface Arbiter {
  id: number;
  name: string;
  title: string;
  rating: string;
  country: string;
  experience: string;
  price: number;
  available: boolean;
  image: string;
  reviews: number;
  avgRating: number;
  bio: string;
  languages: string[];
  certifications: string[];
  specialties: string[];
  eventsOfficiated?: number;
  responseTime?: string;
  featured?: boolean;
}

// Arbiters data - now fetched from API
export const arbiters: Arbiter[] = [];

// Categories for homepage - counts will be fetched from API
export const categories = [
  {
    id: 'masters',
    title: 'Play a Master',
    subtitle: 'Learn from the best',
    icon: 'Star',
    color: 'gold',
    count: 0,
  },
  {
    id: 'tournaments',
    title: 'Tournaments',
    subtitle: 'Compete and win',
    icon: 'Trophy',
    color: 'primary',
    count: 0,
  },
  {
    id: 'clubs',
    title: 'Find a Club',
    subtitle: 'Join your community',
    icon: 'MapPin',
    color: 'green',
    count: 0,
  },
  {
    id: 'players',
    title: 'Find a Game',
    subtitle: 'Challenge opponents',
    icon: 'Users',
    color: 'orange',
    count: 0,
  },
];

// Featured content - now fetched from API
export const featured = {
  master: undefined as Master | undefined,
  tournament: undefined as Tournament | undefined,
  club: undefined as Club | undefined,
};

// Open Challenges (for challenges board)
export interface OpenChallenge {
  id: number;
  challenger_id: number;
  challenger_name: string;
  challenger_rating: number;
  challenger_avatar?: string;
  challenged_name: string;
  challenged_rating: number;
  challenged_avatar?: string;
  time_control: string;
  message?: string;
  venue_name?: string;
  venue_city?: string;
  expires_at: string;
  created_at: string;
}

// Open Challenges data - now fetched from API
export const openChallenges: OpenChallenge[] = [];
