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

export const masters: Master[] = [
  {
    id: 1,
    name: 'GM Alexandra Kosteniuk',
    title: 'Grandmaster',
    rating: 2495,
    country: 'Switzerland',
    specialty: 'Aggressive Tactical Play',
    price: 150,
    available: true,
    image: '/pics/alexandra.jpeg',
    reviews: 128,
    avgRating: 4.9,
    bio: 'Former Women\'s World Chess Champion with over 20 years of professional experience. Specializes in tactical positions and attacking chess.',
    languages: ['English', 'Russian', 'French'],
    sessionTypes: ['Lesson', 'Game Analysis', 'Rapid Match'],
    achievements: ['Women\'s World Champion 2008', '4x Russian Women\'s Champion', 'Chess Oscar Winner'],
    responseTime: 'Usually responds within 2 hours',
    featured: true,
    timeControlPricing: {
      bullet: 75,
      blitz: 100,
      rapid: 150,
      classical: 200,
    },
    coordinates: { lat: 46.2044, lng: 6.1432 }, // Geneva, Switzerland
  },
  {
    id: 2,
    name: 'GM Hikaru Nakamura',
    title: 'Grandmaster',
    rating: 2736,
    country: 'USA',
    specialty: 'Blitz & Bullet Expert',
    price: 300,
    available: true,
    image: '/pics/hikaru.jpg',
    reviews: 342,
    avgRating: 5.0,
    bio: 'Five-time US Chess Champion and world-renowned speed chess specialist. Known for incredible calculation speed and creative play.',
    languages: ['English', 'Japanese'],
    sessionTypes: ['Lesson', 'Blitz Training', 'Opening Prep'],
    achievements: ['5x US Chess Champion', 'Speed Chess Champion', 'World #2 Blitz'],
    responseTime: 'Usually responds within 24 hours',
    featured: true,
    coordinates: { lat: 33.7490, lng: -84.3880 }, // Atlanta, GA
  },
  {
    id: 3,
    name: 'IM Jennifer Yu',
    title: 'International Master',
    rating: 2310,
    country: 'USA',
    specialty: 'Endgame Specialist',
    price: 80,
    available: false,
    image: '/pics/jennifer.jpeg',
    reviews: 89,
    avgRating: 4.8,
    bio: 'US Women\'s Chess Champion focusing on endgame technique and strategic planning. Great with intermediate players looking to improve.',
    languages: ['English', 'Mandarin'],
    sessionTypes: ['Lesson', 'Endgame Training', 'Game Analysis'],
    achievements: ['US Women\'s Champion 2019', 'World Youth Bronze Medalist'],
    responseTime: 'Usually responds within 4 hours',
    coordinates: { lat: 42.3601, lng: -71.0589 }, // Boston, MA
  },
  {
    id: 4,
    name: 'GM Anish Giri',
    title: 'Grandmaster',
    rating: 2764,
    country: 'Netherlands',
    specialty: 'Positional Mastery',
    price: 250,
    available: true,
    image: '/pics/anish.jpeg',
    reviews: 256,
    avgRating: 4.9,
    bio: 'Top 10 world player known for solid positional understanding and deep opening preparation. Expert at explaining complex concepts.',
    languages: ['English', 'Dutch', 'Russian'],
    sessionTypes: ['Lesson', 'Opening Prep', 'Game Analysis'],
    achievements: ['Candidates Tournament Finalist', '3x Dutch Champion', 'Tata Steel Winner'],
    responseTime: 'Usually responds within 6 hours',
    featured: true,
    coordinates: { lat: 52.3676, lng: 4.9041 }, // Amsterdam, Netherlands
  },
  {
    id: 5,
    name: 'WGM Anna Rudolf',
    title: 'Woman Grandmaster',
    rating: 2420,
    country: 'Hungary',
    specialty: 'Beginner Coaching',
    price: 120,
    available: true,
    image: '/pics/anna.jpg',
    reviews: 198,
    avgRating: 4.95,
    bio: 'Popular chess educator known for making complex concepts accessible. Perfect for beginners and intermediate players.',
    languages: ['English', 'Hungarian', 'German'],
    sessionTypes: ['Lesson', 'Beginner Training', 'Puzzle Solving'],
    achievements: ['Chess24 Presenter', 'Hungarian Champion', '100K+ YouTube Subscribers'],
    responseTime: 'Usually responds within 1 hour',
    coordinates: { lat: 47.4979, lng: 19.0402 }, // Budapest, Hungary
  },
  {
    id: 6,
    name: 'GM Wesley So',
    title: 'Grandmaster',
    rating: 2780,
    country: 'USA',
    specialty: 'Universal Style',
    price: 280,
    available: true,
    image: '/pics/wesley.png',
    reviews: 167,
    avgRating: 4.85,
    bio: 'Fischer Random World Champion and former World #2. Known for versatile style and excellent technique in all phases of the game.',
    languages: ['English', 'Filipino'],
    sessionTypes: ['Lesson', 'Game Analysis', 'Chess960'],
    achievements: ['Fischer Random World Champion', 'US Champion', 'World #2'],
    responseTime: 'Usually responds within 12 hours',
    coordinates: { lat: 45.5152, lng: -122.6784 }, // Portland, OR
  },
  {
    id: 7,
    name: 'GM Judit Polgar',
    title: 'Grandmaster',
    rating: 2675,
    country: 'Hungary',
    specialty: 'Attack & Tactics',
    price: 400,
    available: true,
    image: '/pics/judit.jpg',
    reviews: 89,
    avgRating: 5.0,
    bio: 'The strongest female chess player of all time. Known for fearless attacking style and defeating multiple world champions.',
    languages: ['English', 'Hungarian', 'Spanish'],
    sessionTypes: ['Lesson', 'Attack Training', 'Game Analysis'],
    achievements: ['Highest-rated female player ever', 'Defeated 11 World Champions', 'Olympic Gold Medalist'],
    responseTime: 'Usually responds within 48 hours',
    featured: true,
    coordinates: { lat: 47.4979, lng: 19.0402 }, // Budapest, Hungary
  },
  {
    id: 8,
    name: 'GM Fabiano Caruana',
    title: 'Grandmaster',
    rating: 2805,
    country: 'USA',
    specialty: 'Classical Preparation',
    price: 350,
    available: false,
    image: '/pics/fabiano.jpeg',
    reviews: 124,
    avgRating: 4.9,
    bio: 'World Championship Challenger and one of the strongest players in history. Expert in deep opening preparation.',
    languages: ['English', 'Italian', 'Spanish'],
    sessionTypes: ['Lesson', 'Opening Prep', 'Classical Training'],
    achievements: ['World Championship Challenger 2018', 'US Champion', 'World #2'],
    responseTime: 'Usually responds within 24 hours',
    coordinates: { lat: 38.6270, lng: -90.1994 }, // St. Louis, MO
  },
  {
    id: 9,
    name: 'IM Levy Rozman',
    title: 'International Master',
    rating: 2350,
    country: 'USA',
    specialty: 'Content & Education',
    price: 200,
    available: true,
    image: '/pics/levy.jfif',
    reviews: 567,
    avgRating: 4.95,
    bio: 'GothamChess - The most popular chess educator online with millions of followers. Makes learning chess fun and engaging.',
    languages: ['English'],
    sessionTypes: ['Lesson', 'Opening Prep', 'Content Review'],
    achievements: ['Most Subscribed Chess YouTuber', 'Chess.com Educator of the Year', '3M+ Subscribers'],
    responseTime: 'Usually responds within 3 hours',
    featured: true,
    coordinates: { lat: 40.7128, lng: -74.0060 }, // New York, NY
  },
  {
    id: 10,
    name: 'GM Hou Yifan',
    title: 'Grandmaster',
    rating: 2658,
    country: 'China',
    specialty: 'Strategic Play',
    price: 180,
    available: true,
    image: '/pics/hou.jfif',
    reviews: 76,
    avgRating: 4.85,
    bio: 'Four-time Women\'s World Chess Champion and youngest ever at 16. Known for deep strategic understanding.',
    languages: ['English', 'Mandarin'],
    sessionTypes: ['Lesson', 'Strategy Training', 'Game Analysis'],
    achievements: ['4x Women\'s World Champion', 'Youngest Women\'s World Champion', 'Oxford Rhodes Scholar'],
    responseTime: 'Usually responds within 8 hours',
    coordinates: { lat: 39.9042, lng: 116.4074 }, // Beijing, China
  },
  {
    id: 12,
    name: 'WGM Dina Belenkaya',
    title: 'Woman Grandmaster',
    rating: 2380,
    country: 'Russia',
    specialty: 'Streaming & Fun',
    price: 100,
    available: true,
    image: '/pics/dina.jpeg',
    reviews: 145,
    avgRating: 4.8,
    bio: 'Popular chess streamer known for entertaining and educational content. Great for casual improvement.',
    languages: ['English', 'Russian', 'Hebrew'],
    sessionTypes: ['Lesson', 'Fun Games', 'Opening Basics'],
    achievements: ['Top Chess Streamer', 'Russian Women\'s Team Member', '500K+ Followers'],
    responseTime: 'Usually responds within 1 hour',
    coordinates: { lat: 55.7558, lng: 37.6173 }, // Moscow, Russia
  },
];

export const reviews: Review[] = [
  {
    id: 1,
    masterId: 1,
    userName: 'ChessEnthusiast99',
    userImage: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=100&h=100&fit=crop',
    rating: 5,
    date: '2024-02-15',
    comment: 'Amazing session! Alexandra helped me understand tactical patterns I\'ve been missing for years. Her explanations are crystal clear.',
    sessionType: 'Lesson',
  },
  {
    id: 2,
    masterId: 1,
    userName: 'TacticalKnight',
    userImage: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop',
    rating: 5,
    date: '2024-02-10',
    comment: 'Worth every penny! She analyzed my games and pointed out patterns in my play I never noticed.',
    sessionType: 'Game Analysis',
  },
  {
    id: 3,
    masterId: 2,
    userName: 'BlitzMaster2000',
    userImage: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop',
    rating: 5,
    date: '2024-02-18',
    comment: 'Playing blitz against Hikaru was incredible. He gave tips between games that immediately improved my speed.',
    sessionType: 'Blitz Training',
  },
  {
    id: 4,
    masterId: 4,
    userName: 'PositionalPlayer',
    userImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    rating: 5,
    date: '2024-02-12',
    comment: 'Anish\'s opening preparation advice was next level. He showed me how to study openings efficiently.',
    sessionType: 'Opening Prep',
  },
  {
    id: 5,
    masterId: 5,
    userName: 'BeginnerBob',
    userImage: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop',
    rating: 5,
    date: '2024-02-20',
    comment: 'Anna is so patient and encouraging! As a complete beginner, I felt comfortable asking any question.',
    sessionType: 'Beginner Training',
  },
  {
    id: 6,
    masterId: 9,
    userName: 'GothamFan',
    userImage: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=100&h=100&fit=crop',
    rating: 5,
    date: '2024-02-22',
    comment: 'Levy is just as entertaining in person as on YouTube! He made learning the London System actually fun.',
    sessionType: 'Opening Prep',
  },
];

export const tournaments: Tournament[] = [
  {
    id: 1,
    name: 'Spring Championship 2024',
    type: 'Classical',
    date: 'Mar 15-17, 2024',
    location: 'New York, NY',
    prize: '$10,000',
    players: { current: 98, max: 128 },
    entryFee: 75,
    timeControl: '90+30',
    featured: true,
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&h=400&fit=crop',
    description: 'The premier spring classical chess event on the East Coast. USCF rated with prizes for all sections.',
    rounds: 7,
    format: 'Swiss System',
    organizer: 'US Chess Federation',
    ratingMin: 1000,
    ratingMax: 2400,
    coordinates: { lat: 40.7128, lng: -74.0060 },
  },
  {
    id: 2,
    name: 'Rapid Fire Weekly',
    type: 'Rapid',
    date: 'Every Saturday',
    location: 'Online',
    prize: '$500',
    players: { current: 45, max: 64 },
    entryFee: 15,
    timeControl: '10+5',
    featured: false,
    image: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=600&h=400&fit=crop',
    description: 'Weekly online rapid tournament. Great for regular competitive practice.',
    rounds: 5,
    format: 'Swiss System',
    organizer: 'ChessFam',
  },
  {
    id: 3,
    name: 'Blitz Masters Open',
    type: 'Blitz',
    date: 'Apr 5, 2024',
    location: 'Chicago, IL',
    prize: '$5,000',
    players: { current: 112, max: 256 },
    entryFee: 35,
    timeControl: '3+2',
    featured: false,
    image: 'https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=600&h=400&fit=crop',
    description: 'Fast-paced blitz action with double elimination bracket. All skill levels welcome.',
    rounds: 9,
    format: 'Double Elimination',
    organizer: 'Chicago Chess Club',
    coordinates: { lat: 41.8781, lng: -87.6298 },
  },
  {
    id: 4,
    name: 'Junior National Championship',
    type: 'Classical',
    date: 'May 10-12, 2024',
    location: 'Los Angeles, CA',
    prize: '$15,000',
    players: { current: 156, max: 200 },
    entryFee: 50,
    timeControl: '90+30',
    featured: true,
    image: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=600&h=400&fit=crop',
    description: 'National championship for players under 18. Scholarships available for top finishers.',
    rounds: 9,
    format: 'Swiss System',
    organizer: 'US Chess Federation',
    ratingMax: 2200,
    coordinates: { lat: 34.0522, lng: -118.2437 },
  },
  {
    id: 5,
    name: 'City Open Blitz',
    type: 'Blitz',
    date: 'Apr 20, 2024',
    location: 'Boston, MA',
    prize: '$3,000',
    players: { current: 64, max: 100 },
    entryFee: 25,
    timeControl: '5+0',
    featured: false,
    image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&h=400&fit=crop',
    description: 'Monthly city championship blitz event. Cash prizes for top 10.',
    rounds: 7,
    format: 'Swiss System',
    organizer: 'Boston Chess Academy',
    coordinates: { lat: 42.3601, lng: -71.0589 },
  },
  {
    id: 6,
    name: 'Weekend Swiss',
    type: 'Rapid',
    date: 'Every Weekend',
    location: 'Online',
    prize: '$1,000',
    players: { current: 32, max: 64 },
    entryFee: 20,
    timeControl: '15+10',
    featured: false,
    image: 'https://images.unsplash.com/photo-1580541832626-2a7131ee809f?w=600&h=400&fit=crop',
    description: 'Casual weekend rapid Swiss. Perfect for improving your game.',
    rounds: 5,
    format: 'Swiss System',
    organizer: 'ChessFam',
  },
  {
    id: 7,
    name: 'Grandmaster Invitational',
    type: 'Classical',
    date: 'Jun 1-5, 2024',
    location: 'Saint Louis, MO',
    prize: '$50,000',
    players: { current: 10, max: 10 },
    entryFee: 0,
    timeControl: '120+30',
    featured: true,
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&h=400&fit=crop',
    description: 'Elite invitation-only tournament featuring top 10 GMs. Live commentary and streaming.',
    rounds: 9,
    format: 'Round Robin',
    organizer: 'Saint Louis Chess Club',
    ratingMin: 2600,
    coordinates: { lat: 38.6270, lng: -90.1994 },
  },
  {
    id: 8,
    name: 'Bullet Madness',
    type: 'Bullet',
    date: 'Every Friday',
    location: 'Online',
    prize: '$200',
    players: { current: 89, max: 128 },
    entryFee: 5,
    timeControl: '1+0',
    featured: false,
    image: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=600&h=400&fit=crop',
    description: 'Weekly bullet arena. Pure chaos and fun!',
    rounds: 0,
    format: 'Arena',
    organizer: 'ChessFam',
  },
  {
    id: 9,
    name: 'Women\'s Championship',
    type: 'Classical',
    date: 'Jul 15-20, 2024',
    location: 'New York, NY',
    prize: '$25,000',
    players: { current: 42, max: 64 },
    entryFee: 100,
    timeControl: '90+30',
    featured: true,
    image: 'https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=600&h=400&fit=crop',
    description: 'Annual Women\'s Championship with qualifying spots to the national team.',
    rounds: 9,
    format: 'Swiss System',
    organizer: 'US Chess Federation',
    coordinates: { lat: 40.7128, lng: -74.0060 },
  },
  {
    id: 10,
    name: 'Scholastic Championship',
    type: 'Rapid',
    date: 'Apr 27-28, 2024',
    location: 'Dallas, TX',
    prize: '$5,000',
    players: { current: 234, max: 300 },
    entryFee: 30,
    timeControl: '15+10',
    featured: false,
    image: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=600&h=400&fit=crop',
    description: 'K-12 scholastic championship. Trophies for all sections!',
    rounds: 6,
    format: 'Swiss System',
    organizer: 'Texas Chess Association',
    ratingMax: 1800,
    coordinates: { lat: 32.7767, lng: -96.7970 },
  },
];

export const clubs: Club[] = [
  {
    id: 1,
    name: 'Manhattan Chess Club',
    location: 'New York, NY',
    address: '353 W 48th St, New York, NY 10036',
    distance: '0.8 mi',
    members: 450,
    rating: 4.9,
    reviews: 128,
    hours: 'Mon-Sun: 10AM-10PM',
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&h=400&fit=crop',
    tags: ['Beginner Friendly', 'Tournament Venue', 'Coaching'],
    featured: true,
    description: 'Historic chess club in the heart of Manhattan. Home to some of the best players in the city.',
    amenities: ['Free WiFi', 'Cafe', 'Pro Shop', 'Private Rooms', 'Streaming Setup'],
    upcomingEvents: ['Weekly Blitz Night (Thursdays)', 'Monthly Classical (1st Saturday)', 'GM Simul (Mar 25)'],
    monthlyFee: 75,
    coordinates: { lat: 40.7614, lng: -73.9867 },
  },
  {
    id: 2,
    name: 'Chess Club of Chicago',
    location: 'Chicago, IL',
    address: '1234 Michigan Ave, Chicago, IL 60601',
    distance: '2.3 mi',
    members: 320,
    rating: 4.7,
    reviews: 89,
    hours: 'Tue-Sat: 12PM-9PM',
    image: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=600&h=400&fit=crop',
    tags: ['Adults Only', 'Competitive', 'Library'],
    featured: false,
    description: 'Competitive environment for serious chess players. Extensive chess library on site.',
    amenities: ['Chess Library', 'Analysis Boards', 'Quiet Zone', 'Lockers'],
    upcomingEvents: ['Club Championship (Apr 1-15)', 'Lecture Series (Wednesdays)'],
    monthlyFee: 50,
    coordinates: { lat: 41.8869, lng: -87.6230 },
  },
  {
    id: 3,
    name: 'Golden Gate Chess Academy',
    location: 'San Francisco, CA',
    address: '567 Market St, San Francisco, CA 94105',
    distance: '1.5 mi',
    members: 280,
    rating: 4.8,
    reviews: 67,
    hours: 'Mon-Fri: 3PM-8PM',
    image: 'https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=600&h=400&fit=crop',
    tags: ['Youth Programs', 'Private Lessons', 'Summer Camp'],
    featured: false,
    description: 'Premier youth chess academy with programs for all skill levels. Summer camps available.',
    amenities: ['Youth Area', 'Parent Lounge', 'Snacks', 'Outdoor Space'],
    upcomingEvents: ['Spring Break Camp (Mar 18-22)', 'Junior Tournament (Apr 6)'],
    monthlyFee: 120,
    coordinates: { lat: 37.7909, lng: -122.3992 },
  },
  {
    id: 4,
    name: 'LA Chess Center',
    location: 'Los Angeles, CA',
    address: '890 Wilshire Blvd, Los Angeles, CA 90017',
    distance: '3.1 mi',
    members: 520,
    rating: 4.6,
    reviews: 156,
    hours: 'Daily: 9AM-11PM',
    image: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=600&h=400&fit=crop',
    tags: ['24/7 Access', 'Pro Shop', 'Cafe'],
    featured: true,
    description: 'Largest chess center on the West Coast with extended hours and premium facilities.',
    amenities: ['24/7 Member Access', 'Cafe', 'Pro Shop', 'Tournament Hall', 'Parking'],
    upcomingEvents: ['LA Open (May 4-5)', 'Celebrity Chess Night (Apr 20)'],
    monthlyFee: 100,
    coordinates: { lat: 34.0549, lng: -118.2550 },
  },
  {
    id: 5,
    name: 'Boston Chess Academy',
    location: 'Boston, MA',
    address: '456 Commonwealth Ave, Boston, MA 02215',
    distance: '1.2 mi',
    members: 210,
    rating: 4.75,
    reviews: 54,
    hours: 'Mon-Sat: 11AM-9PM',
    image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&h=400&fit=crop',
    tags: ['University Area', 'Study Groups', 'Coaching'],
    featured: false,
    description: 'Popular with college students and academics. Regular study groups and lectures.',
    amenities: ['Study Rooms', 'Free WiFi', 'Coffee Bar', 'Projector'],
    upcomingEvents: ['Harvard vs MIT Match (Mar 30)', 'Endgame Workshop (Apr 13)'],
    monthlyFee: 45,
    coordinates: { lat: 42.3505, lng: -71.1054 },
  },
  {
    id: 6,
    name: 'Seattle Chess House',
    location: 'Seattle, WA',
    address: '789 Pike St, Seattle, WA 98101',
    distance: '2.8 mi',
    members: 180,
    rating: 4.65,
    reviews: 42,
    hours: 'Wed-Sun: 2PM-10PM',
    image: 'https://images.unsplash.com/photo-1580541832626-2a7131ee809f?w=600&h=400&fit=crop',
    tags: ['Casual', 'Beer Garden', 'Live Music'],
    featured: false,
    description: 'Relaxed atmosphere with beer garden. Live music on weekends.',
    amenities: ['Beer Garden', 'Food Menu', 'Live Music', 'Outdoor Seating'],
    upcomingEvents: ['Chess & Jazz Night (Saturdays)', 'Pub Quiz + Blitz (Fridays)'],
    monthlyFee: 35,
    coordinates: { lat: 47.6131, lng: -122.3347 },
  },
  {
    id: 7,
    name: 'Saint Louis Chess Club',
    location: 'Saint Louis, MO',
    address: '4657 Maryland Ave, Saint Louis, MO 63108',
    distance: '5.2 mi',
    members: 800,
    rating: 4.95,
    reviews: 312,
    hours: 'Mon-Sun: 9AM-10PM',
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&h=400&fit=crop',
    tags: ['World Class', 'Museum', 'Streaming Studio'],
    featured: true,
    description: 'Home of American chess. World-class facility hosting major international events.',
    amenities: ['World Chess Hall of Fame', 'Streaming Studio', 'Restaurant', 'Gift Shop', 'Library'],
    upcomingEvents: ['US Championship (Apr 10-22)', 'GM Lecture Series (Weekly)'],
    monthlyFee: 150,
    coordinates: { lat: 38.6445, lng: -90.2614 },
  },
  {
    id: 8,
    name: 'Miami Chess Club',
    location: 'Miami, FL',
    address: '123 Ocean Drive, Miami, FL 33139',
    distance: '4.0 mi',
    members: 165,
    rating: 4.5,
    reviews: 38,
    hours: 'Tue-Sun: 11AM-8PM',
    image: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=600&h=400&fit=crop',
    tags: ['Beach Nearby', 'Outdoor Chess', 'Tourists Welcome'],
    featured: false,
    description: 'Beautiful location near the beach. Giant outdoor chess sets available.',
    amenities: ['Outdoor Giant Chess', 'AC Lounge', 'Beach Access', 'Tourist Packages'],
    upcomingEvents: ['Beach Blitz Festival (Apr 15)', 'Sunset Chess (Daily)'],
    monthlyFee: 40,
    coordinates: { lat: 25.7825, lng: -80.1340 },
  },
];

export const players: Player[] = [
  {
    id: 1,
    name: 'Alex Chen',
    rating: 1850,
    location: 'Brooklyn, NY',
    distance: '0.5 mi',
    preferences: ['Classical', 'Rapid'],
    availability: 'Available Now',
    online: true,
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    gamesPlayed: 142,
    winRate: 58,
    bio: 'Software engineer by day, chess enthusiast by night. Looking for regular practice partners.',
    joinedDate: '2023-06',
    streak: 5,
    coordinates: { lat: 40.6782, lng: -73.9442 },
  },
  {
    id: 2,
    name: 'Sarah Miller',
    rating: 2100,
    location: 'Manhattan, NY',
    distance: '1.2 mi',
    preferences: ['Blitz', 'Bullet'],
    availability: 'This Evening',
    online: true,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    gamesPlayed: 312,
    winRate: 64,
    bio: 'Former state champion looking for competitive blitz games. Prefer online play.',
    joinedDate: '2022-09',
    streak: 12,
    coordinates: { lat: 40.7580, lng: -73.9855 },
  },
  {
    id: 3,
    name: 'Marcus Johnson',
    rating: 1650,
    location: 'Queens, NY',
    distance: '2.8 mi',
    preferences: ['Classical'],
    availability: 'Weekends',
    online: false,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    gamesPlayed: 89,
    winRate: 52,
    bio: 'Weekend player getting back into chess after a long break. Prefer OTB games.',
    joinedDate: '2024-01',
    coordinates: { lat: 40.7282, lng: -73.7949 },
  },
  {
    id: 4,
    name: 'Emma Davis',
    rating: 1920,
    location: 'Hoboken, NJ',
    distance: '3.5 mi',
    preferences: ['Rapid', 'Blitz'],
    availability: 'Available Now',
    online: true,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    gamesPlayed: 256,
    winRate: 61,
    bio: 'Active tournament player. Love analyzing games after playing.',
    joinedDate: '2023-03',
    streak: 8,
    coordinates: { lat: 40.7439, lng: -74.0323 },
  },
  {
    id: 5,
    name: 'David Kim',
    rating: 2250,
    location: 'Jersey City, NJ',
    distance: '4.1 mi',
    preferences: ['Classical', 'Rapid', 'Blitz'],
    availability: 'Tomorrow',
    online: false,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    gamesPlayed: 478,
    winRate: 71,
    bio: 'FIDE rated player looking for serious training partners. Can offer coaching tips.',
    joinedDate: '2022-01',
    streak: 3,
    coordinates: { lat: 40.7178, lng: -74.0431 },
  },
  {
    id: 6,
    name: 'Lisa Wang',
    rating: 1780,
    location: 'Brooklyn, NY',
    distance: '1.8 mi',
    preferences: ['Blitz'],
    availability: 'Available Now',
    online: true,
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop',
    gamesPlayed: 198,
    winRate: 55,
    bio: 'Blitz addict! Always up for quick games online or in person.',
    joinedDate: '2023-08',
    streak: 15,
    coordinates: { lat: 40.6892, lng: -73.9632 },
  },
  {
    id: 7,
    name: 'James Wilson',
    rating: 2050,
    location: 'Manhattan, NY',
    distance: '0.9 mi',
    preferences: ['Classical', 'Rapid'],
    availability: 'Available Now',
    online: true,
    image: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=200&h=200&fit=crop',
    gamesPlayed: 342,
    winRate: 63,
    bio: 'Chess coach and club player. Happy to play teaching games with lower-rated players.',
    joinedDate: '2022-05',
    streak: 7,
    coordinates: { lat: 40.7484, lng: -73.9857 },
  },
  {
    id: 8,
    name: 'Nina Patel',
    rating: 1550,
    location: 'Bronx, NY',
    distance: '5.2 mi',
    preferences: ['Rapid'],
    availability: 'Evenings',
    online: false,
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    gamesPlayed: 67,
    winRate: 48,
    bio: 'Improving player looking for similar-rated opponents. I play the London System!',
    joinedDate: '2024-02',
    coordinates: { lat: 40.8448, lng: -73.8648 },
  },
  {
    id: 9,
    name: 'Robert Taylor',
    rating: 1950,
    location: 'Staten Island, NY',
    distance: '8.3 mi',
    preferences: ['Classical'],
    availability: 'Weekends',
    online: false,
    image: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop',
    gamesPlayed: 234,
    winRate: 59,
    bio: 'Retired teacher, lifetime chess player. Prefer long games with analysis afterward.',
    joinedDate: '2023-01',
    coordinates: { lat: 40.5795, lng: -74.1502 },
  },
  {
    id: 10,
    name: 'Michelle Lee',
    rating: 2180,
    location: 'Brooklyn, NY',
    distance: '1.4 mi',
    preferences: ['Blitz', 'Bullet'],
    availability: 'Available Now',
    online: true,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
    gamesPlayed: 567,
    winRate: 68,
    bio: 'Speed chess specialist. Top 100 in bullet on Chess.com. Let\'s play!',
    joinedDate: '2022-03',
    streak: 23,
    coordinates: { lat: 40.6501, lng: -73.9496 },
  },
];

export const gameLocations: GameLocation[] = [
  {
    id: 1,
    name: 'Washington Square Park',
    type: 'Park',
    location: 'Greenwich Village, NY',
    address: 'Washington Square, New York, NY 10012',
    distance: '0.8 mi',
    description: 'Iconic chess park with permanent tables. Famous gathering spot for chess players of all levels.',
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&h=400&fit=crop',
    rating: 4.8,
    activeGames: 12,
    busyHours: 'Daily 12PM-8PM',
    amenities: ['Outdoor Tables', 'Free to Play', 'Spectators Welcome', 'Historic Location'],
    coordinates: { lat: 40.7308, lng: -73.9973 },
    upcomingEvents: [
      {
        title: 'Weekend Blitz Tournament',
        date: 'Sat, Dec 7',
        time: '2:00 PM',
        description: 'Casual blitz tournament, all skill levels welcome. $10 entry, winner takes all.',
        type: 'tournament',
      },
      {
        title: 'Sunday Speed Chess',
        date: 'Sun, Dec 8',
        time: '1:00 PM',
        description: 'Informal speed chess gathering. Come play and meet other chess enthusiasts!',
        type: 'casual',
      },
    ],
  },
  {
    id: 2,
    name: 'Coffee & Chess Cafe',
    type: 'Cafe',
    location: 'Brooklyn, NY',
    address: '456 Bedford Ave, Brooklyn, NY 11211',
    distance: '1.2 mi',
    description: 'Cozy cafe with chess boards available. Great coffee and casual atmosphere.',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=400&fit=crop',
    rating: 4.6,
    activeGames: 5,
    busyHours: 'Wed-Sun 2PM-10PM',
    amenities: ['Coffee & Snacks', 'WiFi', 'Indoor Seating', 'Chess Sets Available'],
    coordinates: { lat: 40.7165, lng: -73.9572 },
    upcomingEvents: [
      {
        title: 'Thursday Night Chess & Coffee',
        date: 'Thu, Dec 5',
        time: '7:00 PM',
        description: 'Casual chess night with discounted drinks. Perfect for making chess friends!',
        type: 'social',
      },
      {
        title: 'Beginner Chess Lesson',
        date: 'Sat, Dec 7',
        time: '11:00 AM',
        description: 'Free beginner lesson covering basic tactics. Coffee included!',
        type: 'lesson',
      },
    ],
  },
  {
    id: 3,
    name: 'Central Public Library',
    type: 'Library',
    location: 'Midtown, NY',
    address: '476 5th Ave, New York, NY 10018',
    distance: '0.5 mi',
    description: 'Quiet chess area in main library. Free to all visitors, sets available at desk.',
    image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&h=400&fit=crop',
    rating: 4.5,
    activeGames: 8,
    busyHours: 'Mon-Fri 10AM-6PM',
    amenities: ['Free Access', 'Quiet Environment', 'Chess Books', 'Indoor'],
    coordinates: { lat: 40.7534, lng: -73.9832 },
    upcomingEvents: [
      {
        title: 'Chess Book Club',
        date: 'Wed, Dec 4',
        time: '6:00 PM',
        description: 'Monthly chess book discussion. This month: "My System" by Aron Nimzowitsch.',
        type: 'social',
      },
      {
        title: 'Silent Chess Tournament',
        date: 'Sat, Dec 14',
        time: '2:00 PM',
        description: 'Quiet tournament in library setting. No talking, just chess. Free entry.',
        type: 'tournament',
      },
    ],
  },
  {
    id: 4,
    name: 'Union Square Chess Plaza',
    type: 'Plaza',
    location: 'Union Square, NY',
    address: 'Union Square, New York, NY 10003',
    distance: '1.0 mi',
    description: 'Outdoor plaza with concrete tables. Popular spot for speed chess and hustlers.',
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&h=400&fit=crop',
    rating: 4.7,
    activeGames: 15,
    busyHours: 'Daily 11AM-9PM',
    amenities: ['Outdoor', 'Multiple Tables', 'Always Active', 'Beginner Friendly'],
    coordinates: { lat: 40.7359, lng: -73.9911 },
  },
  {
    id: 5,
    name: 'Knight & Bishop Bar',
    type: 'Bar',
    location: 'Lower East Side, NY',
    address: '789 Orchard St, New York, NY 10002',
    distance: '1.5 mi',
    description: 'Chess-themed bar with weekly tournaments. Craft beer and chess boards at every table.',
    image: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&h=400&fit=crop',
    rating: 4.4,
    activeGames: 6,
    busyHours: 'Thu-Sat 6PM-12AM',
    amenities: ['Bar & Food', 'Weekly Events', 'Chess Boards', '21+ Only'],
    coordinates: { lat: 40.7184, lng: -73.9882 },
    upcomingEvents: [
      {
        title: 'Friday Night Blitz Battle',
        date: 'Fri, Dec 6',
        time: '8:00 PM',
        description: 'Weekly blitz tournament with drink specials. $20 entry, cash prizes for top 3.',
        type: 'tournament',
      },
      {
        title: 'Chess & Beer Social',
        date: 'Wed, Dec 11',
        time: '7:00 PM',
        description: 'Casual chess night with craft beer tasting. No tournament, just fun!',
        type: 'social',
      },
      {
        title: 'Monthly Championship',
        date: 'Sat, Dec 21',
        time: '6:00 PM',
        description: 'Monthly championship tournament. $50 entry, $500 first prize.',
        type: 'tournament',
      },
    ],
  },
  {
    id: 6,
    name: 'Riverside Park Chess Tables',
    type: 'Park',
    location: 'Upper West Side, NY',
    address: 'Riverside Dr & W 96th St, New York, NY 10025',
    distance: '2.3 mi',
    description: 'Scenic park location with permanent chess tables overlooking the Hudson River.',
    image: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=600&h=400&fit=crop',
    rating: 4.6,
    activeGames: 7,
    busyHours: 'Weekends 10AM-6PM',
    amenities: ['Scenic Views', 'Outdoor', 'Free', 'Dog Friendly'],
    coordinates: { lat: 40.7949, lng: -73.9716 },
  },
];

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

export const arbiters: Arbiter[] = [
  {
    id: 1,
    name: 'IA Carol Shaw',
    title: 'International Arbiter',
    rating: 'FIDE Arbiter',
    country: 'United States',
    experience: '15+ years',
    price: 200,
    available: true,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    reviews: 87,
    avgRating: 4.9,
    bio: 'FIDE International Arbiter with extensive experience in major tournaments. Specializes in classical time controls and Swiss system events.',
    languages: ['English', 'Spanish'],
    certifications: ['FIDE International Arbiter', 'USCF Senior TD'],
    specialties: ['Classical Tournaments', 'Swiss System', 'Round Robin'],
    eventsOfficiated: 250,
    responseTime: 'Usually responds within 4 hours',
    featured: true,
  },
  {
    id: 2,
    name: 'FA David Martinez',
    title: 'FIDE Arbiter',
    rating: 'FIDE Arbiter',
    country: 'Spain',
    experience: '10+ years',
    price: 150,
    available: true,
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    reviews: 64,
    avgRating: 4.8,
    bio: 'Experienced FIDE Arbiter specializing in rapid and blitz tournaments. Known for excellent dispute resolution and fair play enforcement.',
    languages: ['English', 'Spanish', 'Catalan'],
    certifications: ['FIDE Arbiter', 'National Arbiter'],
    specialties: ['Rapid & Blitz', 'Youth Events', 'Online Tournaments'],
    eventsOfficiated: 180,
    responseTime: 'Usually responds within 6 hours',
    featured: true,
  },
  {
    id: 3,
    name: 'IA Priya Sharma',
    title: 'International Arbiter',
    rating: 'FIDE Arbiter',
    country: 'India',
    experience: '12+ years',
    price: 175,
    available: true,
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop',
    reviews: 92,
    avgRating: 4.9,
    bio: 'International Arbiter with expertise in organizing large-scale events. Certified anti-cheating specialist and experienced in hybrid tournaments.',
    languages: ['English', 'Hindi', 'Tamil'],
    certifications: ['FIDE International Arbiter', 'Anti-Cheating Specialist'],
    specialties: ['Large Events', 'Anti-Cheating', 'Hybrid Format'],
    eventsOfficiated: 320,
    responseTime: 'Usually responds within 3 hours',
    featured: true,
  },
  {
    id: 4,
    name: 'NA Robert Chen',
    title: 'National Arbiter',
    rating: 'National Arbiter',
    country: 'Canada',
    experience: '8+ years',
    price: 120,
    available: true,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    reviews: 45,
    avgRating: 4.7,
    bio: 'National Arbiter with focus on club-level and regional tournaments. Great at working with beginners and ensuring smooth event operations.',
    languages: ['English', 'Mandarin'],
    certifications: ['CFC National Arbiter', 'FIDE Arbiter (Candidate)'],
    specialties: ['Club Events', 'Junior Tournaments', 'Scholastic Chess'],
    eventsOfficiated: 120,
    responseTime: 'Usually responds within 8 hours',
  },
  {
    id: 5,
    name: 'IA Elena Popov',
    title: 'International Arbiter',
    rating: 'FIDE Arbiter',
    country: 'Russia',
    experience: '18+ years',
    price: 225,
    available: true,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    reviews: 110,
    avgRating: 5.0,
    bio: 'Senior International Arbiter with World Championship experience. Expert in handling high-level classical events and arbiter training.',
    languages: ['English', 'Russian', 'German'],
    certifications: ['FIDE International Arbiter', 'FIDE Lecturer', 'ECU Arbiter'],
    specialties: ['Elite Events', 'Arbiter Training', 'Classical Chess'],
    eventsOfficiated: 400,
    responseTime: 'Usually responds within 5 hours',
    featured: true,
  },
  {
    id: 6,
    name: 'FA James Wilson',
    title: 'FIDE Arbiter',
    rating: 'FIDE Arbiter',
    country: 'United Kingdom',
    experience: '9+ years',
    price: 140,
    available: true,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    reviews: 56,
    avgRating: 4.8,
    bio: 'FIDE Arbiter experienced in both over-the-board and online events. Specializes in team competitions and league management.',
    languages: ['English', 'French'],
    certifications: ['FIDE Arbiter', 'ECF Senior Arbiter'],
    specialties: ['Team Events', 'Leagues', 'Online Chess'],
    eventsOfficiated: 160,
    responseTime: 'Usually responds within 6 hours',
  },
];

// Categories for homepage
export const categories = [
  {
    id: 'masters',
    title: 'Play a Master',
    subtitle: 'Learn from the best',
    icon: 'Star',
    color: 'gold',
    count: masters.length,
  },
  {
    id: 'tournaments',
    title: 'Tournaments',
    subtitle: 'Compete and win',
    icon: 'Trophy',
    color: 'primary',
    count: tournaments.length,
  },
  {
    id: 'clubs',
    title: 'Find a Club',
    subtitle: 'Join your community',
    icon: 'MapPin',
    color: 'green',
    count: clubs.length,
  },
  {
    id: 'players',
    title: 'Find a Game',
    subtitle: 'Challenge opponents',
    icon: 'Users',
    color: 'orange',
    count: players.filter(p => p.online).length,
  },
];

// Featured content
export const featured = {
  master: masters.find(m => m.featured) || masters[0],
  tournament: tournaments.find(t => t.featured) || tournaments[0],
  club: clubs.find(c => c.featured) || clubs[0],
};
