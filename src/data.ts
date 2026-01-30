// Fallback/static data for when API calls fail or during development
// Most data is now loaded from APIs, these are fallbacks only

// Masters data - now fetched from API only, no fallback placeholders
export const masters: any[] = [];

export const clubs = [
  {
    id: 1,
    name: 'Manhattan Chess Club',
    image: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=400',
    location: 'New York, NY',
    members: 245,
    rating: 4.8,
    distance: '2.3 mi',
    tags: ['Tournament Play', 'Casual Games'],
    featured: false,
    coordinates: { lat: 40.7580, lng: -73.9855 }
  },
  {
    id: 2,
    name: 'Brooklyn Chess Academy',
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400',
    location: 'Brooklyn, NY',
    members: 180,
    rating: 4.6,
    distance: '5.1 mi',
    tags: ['Beginner Friendly', 'Lessons'],
    featured: false,
    coordinates: { lat: 40.6782, lng: -73.9442 }
  },
  {
    id: 3,
    name: 'Queens Chess Circle',
    image: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=400',
    location: 'Queens, NY',
    members: 120,
    rating: 4.5,
    distance: '7.8 mi',
    tags: ['Weekend Tournaments', 'Social'],
    featured: false,
    coordinates: { lat: 40.7282, lng: -73.7949 }
  }
];

export const tournaments = [
  {
    id: 1,
    name: 'NYC Chess Championship',
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800',
    location: 'Manhattan, NY',
    date: new Date(Date.now() + 86400000 * 7).toISOString(),
    prize: '$5000'
  },
  {
    id: 2,
    name: 'Brooklyn Blitz Tournament',
    image: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=800',
    location: 'Brooklyn, NY',
    date: new Date(Date.now() + 86400000 * 14).toISOString(),
    prize: '$2500'
  }
];

export const players = [
  {
    id: 1,
    name: 'John Smith',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    rating: 1850,
    location: 'New York, NY',
    gamesPlayed: 234,
    winRate: 58,
    distance: '2.5 mi',
    preferences: ['Blitz', 'Rapid'],
    availability: 'Weekends',
    online: false,
    lastActive: new Date().toISOString(),
    preferredTimeControl: '10+0',
    bio: 'Love playing chess in parks!',
    coordinates: { lat: 40.7580, lng: -73.9855 }
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    rating: 1920,
    location: 'Brooklyn, NY',
    gamesPlayed: 312,
    winRate: 62,
    distance: '5.0 mi',
    preferences: ['Classical', 'Rapid'],
    availability: 'Evenings',
    online: true,
    lastActive: new Date().toISOString(),
    preferredTimeControl: '15+10',
    bio: 'Looking for serious games',
    coordinates: { lat: 40.6782, lng: -73.9442 }
  }
];

export const openChallenges = [
  {
    id: 1,
    type: 'challenge',
    challenger_id: 1,
    challenger_name: 'Alex Rivera',
    challenger_rating: 1850,
    challenger_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    time_control: '10+5',
    message: 'Looking for a game this weekend!',
    venue_name: 'Washington Square Park',
    venue_city: 'New York',
    expires_at: new Date(Date.now() + 86400000 * 2).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    type: 'challenge',
    challenger_id: 2,
    challenger_name: 'Maria Santos',
    challenger_rating: 1650,
    challenger_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    time_control: '15+10',
    message: 'Anyone up for a casual game?',
    venue_name: 'Central Park',
    venue_city: 'New York',
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString()
  }
];

export interface OpenChallenge {
  id: number;
  type?: string;
  challenger_id: number;
  challenger_name: string;
  challenger_rating: number;
  challenger_avatar?: string;
  time_control: string;
  message?: string;
  venue_name?: string;
  venue_city?: string;
  expires_at: string;
  created_at: string;
  game_date?: string;
  spots_available?: number;
  max_players?: number;
}

export const gameLocations = [
  {
    id: 1,
    name: 'Washington Square Park',
    address: 'Washington Square, Manhattan, NY',
    city: 'New York',
    location: 'Manhattan, NY',
    type: 'Park',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=800',
    description: 'Famous outdoor chess spot with tables and experienced players',
    amenities: ['Outdoor tables', 'Free to play', 'Active community'],
    hours: '6:00 AM - 12:00 AM',
    coordinates: { lat: 40.7308, lng: -73.9973 },
    distance: '1.2 mi',
    activeGames: 5,
    busyHours: ['2:00 PM - 6:00 PM', 'Weekends']
  },
  {
    id: 2,
    name: 'Central Park Chess & Checkers House',
    address: 'Central Park, Manhattan, NY',
    city: 'New York',
    location: 'Central Park, NY',
    type: 'Park',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800',
    description: 'Beautiful chess house in the heart of Central Park',
    amenities: ['Indoor/Outdoor', 'Equipment rental', 'Lessons available'],
    hours: '10:00 AM - 5:00 PM',
    coordinates: { lat: 40.7711, lng: -73.9712 },
    distance: '3.5 mi',
    activeGames: 3,
    busyHours: ['11:00 AM - 2:00 PM', 'Saturdays']
  },
  {
    id: 3,
    name: 'Brooklyn Chess Cafe',
    address: '456 Bedford Ave, Brooklyn, NY',
    city: 'Brooklyn',
    location: 'Brooklyn, NY',
    type: 'Cafe',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
    description: 'Cozy cafe with chess boards and great coffee',
    amenities: ['Coffee & snacks', 'Free WiFi', 'Quiet atmosphere'],
    hours: '8:00 AM - 10:00 PM',
    coordinates: { lat: 40.7081, lng: -73.9571 },
    distance: '6.2 mi',
    activeGames: 2,
    busyHours: ['6:00 PM - 9:00 PM', 'Weeknights']
  }
];

export const reviews = [
  {
    id: 1,
    masterId: 1,
    playerName: 'John Doe',
    playerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    rating: 5,
    comment: 'Excellent teacher! Very patient and knowledgeable.',
    date: '2024-01-15'
  },
  {
    id: 2,
    masterId: 1,
    playerName: 'Jane Smith',
    playerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    rating: 5,
    comment: 'Improved my opening repertoire significantly!',
    date: '2024-01-10'
  },
  {
    id: 3,
    masterId: 2,
    playerName: 'Mike Johnson',
    playerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    rating: 5,
    comment: 'Great endgame training, highly recommend!',
    date: '2024-01-12'
  }
];
