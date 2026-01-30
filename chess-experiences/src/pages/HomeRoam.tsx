import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { MessageCircle, X, Send, Pin, PinOff, GripVertical, Plus, Trash2, Users, Zap, Crown, Calendar, Trophy } from 'lucide-react';
import { useStore } from '../store';

// Event tag types
type EventTag = 'blitz' | 'rapid' | 'classical' | 'gm-present' | 'im-present' | 'tournament-live' | 'lesson' | 'simul' | 'open-play';

interface EventTagData {
  id: EventTag;
  label: string;
  color: string;
  icon: 'zap' | 'crown' | 'trophy' | 'calendar' | 'users';
}

const eventTags: Record<EventTag, EventTagData> = {
  'blitz': { id: 'blitz', label: 'Blitz', color: 'bg-yellow-500', icon: 'zap' },
  'rapid': { id: 'rapid', label: 'Rapid', color: 'bg-orange-500', icon: 'zap' },
  'classical': { id: 'classical', label: 'Classical', color: 'bg-blue-500', icon: 'calendar' },
  'gm-present': { id: 'gm-present', label: 'GM Here', color: 'bg-purple-500', icon: 'crown' },
  'im-present': { id: 'im-present', label: 'IM Here', color: 'bg-indigo-500', icon: 'crown' },
  'tournament-live': { id: 'tournament-live', label: 'Live Tournament', color: 'bg-red-500', icon: 'trophy' },
  'lesson': { id: 'lesson', label: 'Lesson', color: 'bg-green-500', icon: 'users' },
  'simul': { id: 'simul', label: 'Simul', color: 'bg-pink-500', icon: 'users' },
  'open-play': { id: 'open-play', label: 'Open Play', color: 'bg-cyan-500', icon: 'users' },
};

// Individual users with unique appearances
const users = [
  { id: 1, name: 'Magnus C.', initials: 'MC', color: 'bg-blue-500' },
  { id: 2, name: 'Hikaru N.', initials: 'HN', color: 'bg-red-500' },
  { id: 3, name: 'Fabiano C.', initials: 'FC', color: 'bg-green-500' },
  { id: 4, name: 'Ding L.', initials: 'DL', color: 'bg-purple-500' },
  { id: 5, name: 'Ian N.', initials: 'IN', color: 'bg-orange-500' },
  { id: 6, name: 'Anish G.', initials: 'AG', color: 'bg-cyan-500' },
  { id: 7, name: 'Wesley S.', initials: 'WS', color: 'bg-pink-500' },
  { id: 8, name: 'Levon A.', initials: 'LA', color: 'bg-yellow-500' },
  { id: 9, name: 'Maxime V.', initials: 'MV', color: 'bg-indigo-500' },
  { id: 10, name: 'Alireza F.', initials: 'AF', color: 'bg-teal-500' },
  { id: 11, name: 'Praggnanandhaa', initials: 'PR', color: 'bg-rose-500' },
  { id: 12, name: 'Vincent K.', initials: 'VK', color: 'bg-emerald-500' },
  { id: 13, name: 'Nodirbek A.', initials: 'NA', color: 'bg-violet-500' },
  { id: 14, name: 'Daniil D.', initials: 'DD', color: 'bg-amber-500' },
  { id: 15, name: 'Anna M.', initials: 'AM', color: 'bg-sky-500' },
  { id: 16, name: 'Ju W.', initials: 'JW', color: 'bg-lime-500' },
  { id: 17, name: 'Hou Y.', initials: 'HY', color: 'bg-fuchsia-500' },
  { id: 18, name: 'Alexandra K.', initials: 'AK', color: 'bg-blue-400' },
  { id: 19, name: 'Kateryna L.', initials: 'KL', color: 'bg-green-400' },
  { id: 20, name: 'Lei T.', initials: 'LT', color: 'bg-purple-400' },
  { id: 21, name: 'Nana D.', initials: 'ND', color: 'bg-orange-400' },
  { id: 22, name: 'Mariya M.', initials: 'MM', color: 'bg-red-400' },
  { id: 23, name: 'Zhansaya A.', initials: 'ZA', color: 'bg-cyan-400' },
  { id: 24, name: 'Bibisara A.', initials: 'BA', color: 'bg-pink-400' },
  // London users
  { id: 25, name: 'Luke M.', initials: 'LM', color: 'bg-blue-600' },
  { id: 26, name: 'Gawain J.', initials: 'GJ', color: 'bg-red-600' },
  { id: 27, name: 'Michael A.', initials: 'MA', color: 'bg-green-600' },
  { id: 28, name: 'David H.', initials: 'DH', color: 'bg-purple-600' },
  { id: 29, name: 'Nigel S.', initials: 'NS', color: 'bg-orange-600' },
  { id: 30, name: 'Matthew S.', initials: 'MS', color: 'bg-cyan-600' },
  { id: 31, name: 'Jon S.', initials: 'JS', color: 'bg-pink-600' },
  { id: 32, name: 'Simon W.', initials: 'SW', color: 'bg-yellow-600' },
  // Barcelona users
  { id: 33, name: 'Francisco V.', initials: 'FV', color: 'bg-amber-600' },
  { id: 34, name: 'Alexis C.', initials: 'AC', color: 'bg-teal-600' },
  { id: 35, name: 'David A.', initials: 'DA', color: 'bg-rose-600' },
  { id: 36, name: 'Miguel I.', initials: 'MI', color: 'bg-emerald-600' },
  { id: 37, name: 'Jordi M.', initials: 'JM', color: 'bg-violet-600' },
  { id: 38, name: 'Marc N.', initials: 'MN', color: 'bg-sky-600' },
  { id: 39, name: 'Ivan S.', initials: 'IS', color: 'bg-lime-600' },
  { id: 40, name: 'Carlos G.', initials: 'CG', color: 'bg-fuchsia-600' },
  // Oslo users
  { id: 41, name: 'Jon H.', initials: 'JH', color: 'bg-blue-700' },
  { id: 42, name: 'Simen A.', initials: 'SA', color: 'bg-red-700' },
  { id: 43, name: 'Aryan T.', initials: 'AT', color: 'bg-green-700' },
  { id: 44, name: 'Johan S.', initials: 'JS', color: 'bg-purple-700' },
  { id: 45, name: 'Frode O.', initials: 'FO', color: 'bg-orange-700' },
  { id: 46, name: 'Ellen C.', initials: 'EC', color: 'bg-cyan-700' },
  { id: 47, name: 'Sheila B.', initials: 'SB', color: 'bg-pink-700' },
  { id: 48, name: 'Lars O.', initials: 'LO', color: 'bg-yellow-700' },
];

// City definitions
type CityId = 'my-bubble' | 'new-york' | 'london' | 'barcelona' | 'oslo';

interface CityData {
  id: CityId;
  name: string;
  flag: string;
  activeUsers: number;
}

const cities: CityData[] = [
  { id: 'my-bubble', name: 'My Bubble', flag: '⭐', activeUsers: 0 },
  { id: 'new-york', name: 'New York', flag: '🇺🇸', activeUsers: 24 },
  { id: 'london', name: 'London', flag: '🇬🇧', activeUsers: 18 },
  { id: 'barcelona', name: 'Barcelona', flag: '🇪🇸', activeUsers: 15 },
  { id: 'oslo', name: 'Oslo', flag: '🇳🇴', activeUsers: 12 },
];

// All available rooms across all cities (for pinning)
const getAllRooms = (): (RoomData & { cityId: CityId; cityName: string })[] => {
  const allRooms: (RoomData & { cityId: CityId; cityName: string })[] = [];
  (Object.keys(cityRooms) as CityId[]).forEach(cityId => {
    if (cityId === 'my-bubble') return;
    const city = cities.find(c => c.id === cityId);
    cityRooms[cityId].forEach(room => {
      allRooms.push({ ...room, cityId, cityName: city?.name || '' });
    });
  });
  return allRooms;
};

// Default "nearby" communities for My Bubble (simulating geolocation)
const getDefaultMyBubbleRooms = (): string[] => {
  // Default to some NY rooms as if user is in NY area
  return ['venue1', 'venue3', 'club1', 'tournament1', 'venue6'];
};

// Sample chat messages for rooms
const roomChats: Record<string, { userId: number; text: string; time: string }[]> = {
  'venue1': [
    { userId: 1, text: 'Anyone want to play some blitz?', time: '2m ago' },
  ],
  'venue2': [
    { userId: 2, text: 'Great coffee here!', time: '5m ago' },
    { userId: 3, text: 'The chess sets are nice too', time: '3m ago' },
  ],
  'venue3': [
    { userId: 4, text: 'Hustlers out in full force today', time: '1m ago' },
    { userId: 5, text: 'I just beat the guy in the red hat', time: '30s ago' },
    { userId: 6, text: 'Nice! He got me earlier', time: 'just now' },
  ],
  'tournament1': [
    { userId: 7, text: 'Round 3 pairings are up', time: '5m ago' },
    { userId: 8, text: 'Good luck everyone!', time: '4m ago' },
    { userId: 9, text: 'Who has white on board 1?', time: '2m ago' },
  ],
  'venue4': [
    { userId: 10, text: 'Brooklyn vibes', time: '10m ago' },
    { userId: 11, text: 'Love this spot', time: '8m ago' },
  ],
  'venue5': [
    { userId: 12, text: 'Just bought a new tournament set!', time: '15m ago' },
  ],
  'club1': [
    { userId: 13, text: 'Thursday night rapid starts at 7', time: '1h ago' },
  ],
  'club2': [
    { userId: 14, text: 'Rex is giving a simul later', time: '30m ago' },
  ],
  'venue6': [
    { userId: 15, text: 'Beautiful day for outdoor chess', time: '20m ago' },
    { userId: 16, text: 'Agreed! Park is packed', time: '18m ago' },
  ],
  'club3': [
    { userId: 17, text: 'Tuesday lecture on the Najdorf', time: '2h ago' },
  ],
  'venue7': [
    { userId: 18, text: 'Tables are all taken, waiting for one', time: '5m ago' },
  ],
  'tournament2': [
    { userId: 19, text: 'Anyone up for some bullet after?', time: '1m ago' },
  ],
  'club4': [
    { userId: 20, text: 'New member orientation at 6pm', time: '45m ago' },
    { userId: 21, text: 'Welcome to the club!', time: '40m ago' },
  ],
  'venue8': [
    { userId: 22, text: 'Good wifi for online games here', time: '25m ago' },
  ],
  'club5': [
    { userId: 23, text: 'Scholastic tournament this weekend', time: '1h ago' },
  ],
  'tournament3': [
    { userId: 24, text: 'Classical is so much better than blitz', time: '3h ago' },
    { userId: 1, text: 'Debatable...', time: '2h ago' },
    { userId: 2, text: 'Both have their merits', time: '1h ago' },
  ],
  'venue9': [
    { userId: 3, text: 'East Village crew representing', time: '12m ago' },
    { userId: 4, text: 'Best park in the city', time: '10m ago' },
    { userId: 5, text: "Don't tell the Washington Sq people", time: '8m ago' },
    { userId: 6, text: 'Lol too late', time: '5m ago' },
  ],
  'club6': [
    { userId: 7, text: 'Charlotte chess scene is growing!', time: '3h ago' },
  ],
  'venue10': [
    { userId: 8, text: 'Harvard students are tough', time: '1h ago' },
    { userId: 9, text: 'MIT kids too', time: '50m ago' },
  ],
  'tournament4': [
    { userId: 10, text: 'Swiss pairings can be brutal', time: '2h ago' },
    { userId: 11, text: 'Just drew against a 2100', time: '1h ago' },
    { userId: 12, text: 'Nice hold!', time: '55m ago' },
  ],
  'club7': [
    { userId: 13, text: 'Texas chess is underrated', time: '4h ago' },
  ],
  // London chats
  'london-venue1': [
    { userId: 25, text: 'Lovely afternoon at the park', time: '5m ago' },
    { userId: 26, text: 'Fancy a game?', time: '3m ago' },
  ],
  'london-venue2': [
    { userId: 27, text: 'The pub chess night is brilliant', time: '10m ago' },
  ],
  'london-club1': [
    { userId: 28, text: 'Wednesday blitz starts at 7', time: '1h ago' },
    { userId: 29, text: 'See you there!', time: '45m ago' },
  ],
  'london-club2': [
    { userId: 30, text: 'New grandmaster lecture series', time: '2h ago' },
  ],
  'london-tournament1': [
    { userId: 31, text: 'Round 2 in 10 minutes', time: '12m ago' },
    { userId: 32, text: 'Good luck all', time: '8m ago' },
  ],
  // Barcelona chats
  'barcelona-venue1': [
    { userId: 33, text: 'El tablero está libre!', time: '3m ago' },
    { userId: 34, text: 'Vamos a jugar', time: '2m ago' },
  ],
  'barcelona-venue2': [
    { userId: 35, text: 'Great tapas here too', time: '15m ago' },
  ],
  'barcelona-club1': [
    { userId: 36, text: 'Torneo rápido el sábado', time: '1h ago' },
    { userId: 37, text: 'Me apunto!', time: '50m ago' },
  ],
  'barcelona-tournament1': [
    { userId: 38, text: 'Final round starting soon', time: '5m ago' },
    { userId: 39, text: 'Nervous but ready', time: '3m ago' },
    { userId: 40, text: 'Buena suerte!', time: '1m ago' },
  ],
  // Oslo chats
  'oslo-venue1': [
    { userId: 41, text: 'Hyggelig å spille her', time: '8m ago' },
    { userId: 42, text: 'Best coffee in Oslo', time: '5m ago' },
  ],
  'oslo-club1': [
    { userId: 43, text: 'Training session tonight', time: '2h ago' },
    { userId: 44, text: 'Working on endgames', time: '1h ago' },
  ],
  'oslo-club2': [
    { userId: 45, text: 'Youth tournament this weekend', time: '3h ago' },
  ],
  'oslo-tournament1': [
    { userId: 46, text: 'Norwegian Championship qualifier', time: '30m ago' },
    { userId: 47, text: 'Strong field this year', time: '20m ago' },
    { userId: 48, text: 'Magnus might show up!', time: '10m ago' },
  ],
};

// City-specific rooms
const cityRooms: Record<Exclude<CityId, 'my-bubble'>, RoomData[]> = {
  'new-york': [
    { id: 'venue1', name: 'Central Park Chess', route: '/locations', users: [1], memberCount: 156, gridArea: 'a', tags: ['open-play'], linkedEntityType: 'location', linkedEntityId: '1' },
    { id: 'venue2', name: 'Think Coffee NYC', route: '/locations', users: [2, 3], memberCount: 89, gridArea: 'b', tags: ['open-play'] },
    { id: 'venue3', name: 'Washington Sq.', route: '/locations', users: [4, 5, 6], memberCount: 342, gridArea: 'c', tags: ['blitz', 'gm-present'] },
    { id: 'tournament1', name: 'Rapid Open', route: '/tournaments', users: [7, 8, 9], memberCount: 64, message: { user: 'TD', text: 'Round 3 starting in 5 min...' }, gridArea: 'd', tags: ['tournament-live', 'rapid'], linkedEntityType: 'tournament', linkedEntityId: '1' },
    { id: 'venue4', name: 'Brooklyn Chess', route: '/locations', users: [10, 11], memberCount: 124, gridArea: 'e', tags: ['open-play'] },
    { id: 'venue5', name: 'Chess Forum', route: '/locations', users: [12], memberCount: 78, gridArea: 'f' },
    { id: 'club1', name: 'Marshall Chess', route: '/clubs', users: [13], memberCount: 512, gridArea: 'g', tags: ['lesson', 'im-present'], linkedEntityType: 'club', linkedEntityId: '1' },
    { id: 'club2', name: 'St. Louis CC', route: '/clubs', users: [14], memberCount: 890, gridArea: 'h', tags: ['simul', 'gm-present'] },
    { id: 'venue6', name: 'Union Square', route: '/locations', users: [15, 16], memberCount: 267, gridArea: 'i', tags: ['blitz'] },
    { id: 'club3', name: 'Mechanics Inst.', route: '/clubs', users: [17], memberCount: 445, gridArea: 'j', tags: ['classical'] },
    { id: 'venue7', name: 'Bryant Park', route: '/locations', users: [18], memberCount: 198, gridArea: 'k', tags: ['open-play'] },
    { id: 'tournament2', name: 'Blitz Championship', route: '/tournaments', users: [19], memberCount: 32, message: { user: 'Hikaru', text: 'Anyone up for some bullet?' }, gridArea: 'l', tags: ['tournament-live', 'blitz', 'gm-present'] },
    { id: 'club4', name: 'Chicago CC', route: '/clubs', users: [20, 21], memberCount: 367, gridArea: 'm' },
    { id: 'venue8', name: 'Starbucks Midtown', route: '/locations', users: [22], memberCount: 45, gridArea: 'n' },
    { id: 'club5', name: 'Bay Area Chess', route: '/clubs', users: [23], memberCount: 623, gridArea: 'o', tags: ['lesson'] },
    { id: 'tournament3', name: 'Classical Invit.', route: '/tournaments', users: [24, 1, 2], memberCount: 16, gridArea: 'p', tags: ['tournament-live', 'classical', 'gm-present'] },
    { id: 'venue9', name: 'Tompkins Sq Park', route: '/locations', users: [3, 4, 5, 6], memberCount: 189, gridArea: 'q', tags: ['blitz', 'open-play'] },
    { id: 'club6', name: 'Charlotte CC', route: '/clubs', users: [7], memberCount: 234, gridArea: 'r' },
    { id: 'venue10', name: 'Harvard Square', route: '/locations', users: [8, 9], memberCount: 156, gridArea: 's', tags: ['open-play'] },
    { id: 'tournament4', name: 'Weekend Swiss', route: '/tournaments', users: [10, 11, 12], memberCount: 48, gridArea: 't', tags: ['tournament-live', 'rapid'] },
    { id: 'club7', name: 'Dallas Chess Club', route: '/clubs', users: [13], memberCount: 289, gridArea: 'u' },
  ],
  'london': [
    { id: 'london-venue1', name: 'Hyde Park Chess', route: '/locations', users: [25, 26], memberCount: 234, gridArea: 'a', tags: ['open-play'] },
    { id: 'london-venue2', name: 'The Chess Pub', route: '/locations', users: [27], memberCount: 67, gridArea: 'b', tags: ['blitz'] },
    { id: 'london-club1', name: 'London Chess Club', route: '/clubs', users: [28, 29], memberCount: 678, message: { user: 'Admin', text: 'Wednesday blitz at 7pm' }, gridArea: 'c', tags: ['lesson', 'gm-present'] },
    { id: 'london-tournament1', name: 'London Open', route: '/tournaments', users: [31, 32], memberCount: 128, message: { user: 'TD', text: 'Round 2 pairings posted' }, gridArea: 'd', tags: ['tournament-live', 'classical'] },
    { id: 'london-venue3', name: 'Regent\'s Park', route: '/locations', users: [25], memberCount: 145, gridArea: 'e', tags: ['open-play'] },
    { id: 'london-club2', name: 'Battersea CC', route: '/clubs', users: [30], memberCount: 312, gridArea: 'f' },
    { id: 'london-venue4', name: 'British Museum Cafe', route: '/locations', users: [26, 27], memberCount: 89, gridArea: 'g' },
    { id: 'london-club3', name: 'Streatham & Brixton', route: '/clubs', users: [28], memberCount: 256, gridArea: 'h', tags: ['lesson'] },
    { id: 'london-venue5', name: 'Southbank Centre', route: '/locations', users: [29, 30], memberCount: 178, gridArea: 'i', tags: ['open-play'] },
    { id: 'london-tournament2', name: 'Rapid Play', route: '/tournaments', users: [31], memberCount: 64, gridArea: 'j', tags: ['tournament-live', 'rapid'] },
    { id: 'london-club4', name: 'Hampstead CC', route: '/clubs', users: [32, 25], memberCount: 198, gridArea: 'k', tags: ['im-present'] },
    { id: 'london-venue6', name: 'Greenwich Park', route: '/locations', users: [26], memberCount: 112, gridArea: 'l' },
  ],
  'barcelona': [
    { id: 'barcelona-venue1', name: 'Parc de la Ciutadella', route: '/locations', users: [33, 34], memberCount: 189, gridArea: 'a', tags: ['open-play'] },
    { id: 'barcelona-venue2', name: 'El Born Cafe', route: '/locations', users: [35], memberCount: 56, gridArea: 'b' },
    { id: 'barcelona-club1', name: 'Club Escacs Barcelona', route: '/clubs', users: [36, 37], memberCount: 534, message: { user: 'Director', text: 'Torneo sábado 10:00' }, gridArea: 'c', tags: ['lesson', 'gm-present'] },
    { id: 'barcelona-tournament1', name: 'Catalunya Open', route: '/tournaments', users: [38, 39, 40], memberCount: 96, message: { user: 'Árbitro', text: 'Final round in 15 min' }, gridArea: 'd', tags: ['tournament-live', 'classical', 'gm-present'] },
    { id: 'barcelona-venue3', name: 'La Rambla Tables', route: '/locations', users: [33], memberCount: 234, gridArea: 'e', tags: ['blitz'] },
    { id: 'barcelona-club2', name: 'Penya Escacs', route: '/clubs', users: [34, 35], memberCount: 289, gridArea: 'f' },
    { id: 'barcelona-venue4', name: 'Gothic Quarter', route: '/locations', users: [36], memberCount: 145, gridArea: 'g', tags: ['open-play'] },
    { id: 'barcelona-club3', name: 'Sant Andreu CC', route: '/clubs', users: [37, 38], memberCount: 378, gridArea: 'h', tags: ['simul'] },
    { id: 'barcelona-venue5', name: 'Barceloneta Beach', route: '/locations', users: [39, 40], memberCount: 167, gridArea: 'i', tags: ['blitz', 'open-play'] },
    { id: 'barcelona-tournament2', name: 'Blitz del Mar', route: '/tournaments', users: [33, 34], memberCount: 48, gridArea: 'j', tags: ['tournament-live', 'blitz'] },
  ],
  'oslo': [
    { id: 'oslo-venue1', name: 'Frognerparken', route: '/locations', users: [41, 42], memberCount: 123, gridArea: 'a', tags: ['open-play'] },
    { id: 'oslo-club1', name: 'Oslo Schakselskap', route: '/clubs', users: [43, 44], memberCount: 456, message: { user: 'Leder', text: 'Training i kveld kl 18' }, gridArea: 'b', tags: ['lesson', 'gm-present'] },
    { id: 'oslo-tournament1', name: 'Norwegian Ch.', route: '/tournaments', users: [46, 47, 48], memberCount: 64, message: { user: 'TD', text: 'Qualifier round 3' }, gridArea: 'c', tags: ['tournament-live', 'classical', 'gm-present'] },
    { id: 'oslo-venue2', name: 'Tim Wendelboe Cafe', route: '/locations', users: [41], memberCount: 45, gridArea: 'd' },
    { id: 'oslo-club2', name: 'Nordstrand SK', route: '/clubs', users: [45], memberCount: 234, gridArea: 'e' },
    { id: 'oslo-venue3', name: 'Vigelandsparken', route: '/locations', users: [42, 43], memberCount: 89, gridArea: 'f', tags: ['open-play'] },
    { id: 'oslo-club3', name: 'Asker Schak', route: '/clubs', users: [44, 45], memberCount: 178, gridArea: 'g', tags: ['rapid'] },
    { id: 'oslo-venue4', name: 'Aker Brygge', route: '/locations', users: [46], memberCount: 67, gridArea: 'h' },
    { id: 'oslo-tournament2', name: 'Vinter Blitz', route: '/tournaments', users: [47, 48], memberCount: 32, gridArea: 'i', tags: ['tournament-live', 'blitz'] },
  ],
};

interface RoomData {
  id: string;
  name: string;
  route: string;
  users: number[]; // Currently checked in users
  memberCount: number; // Total members
  message?: { user: string; text: string };
  gridArea: string;
  tags?: EventTag[];
  linkedEntityId?: string; // ID of linked location/club/tournament
  linkedEntityType?: 'location' | 'club' | 'tournament';
}

// My Bubble storage key
const MY_BUBBLE_STORAGE_KEY = 'chess-my-bubble-rooms';
const PINNED_CHATS_STORAGE_KEY = 'chess-pinned-chats';
const MAX_PINNED_CHATS = 5;

interface MyBubbleRoom {
  roomId: string;
  pinned: boolean;
}

const HomeRoam = () => {
  const navigate = useNavigate();
  const { user, openAuthModal } = useStore();
  const [openChat, setOpenChat] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [selectedCity, setSelectedCity] = useState<CityId>('my-bubble');
  const [myBubbleRooms, setMyBubbleRooms] = useState<MyBubbleRoom[]>([]);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);

  // Load pinned chats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(PINNED_CHATS_STORAGE_KEY);
    if (saved) {
      try {
        setPinnedChats(JSON.parse(saved));
      } catch {
        setPinnedChats([]);
      }
    }
  }, []);

  // Save pinned chats to localStorage
  useEffect(() => {
    localStorage.setItem(PINNED_CHATS_STORAGE_KEY, JSON.stringify(pinnedChats));
  }, [pinnedChats]);

  // Pinned chat actions
  const pinChat = (roomId: string) => {
    if (pinnedChats.length < MAX_PINNED_CHATS && !pinnedChats.includes(roomId)) {
      setPinnedChats([...pinnedChats, roomId]);
    }
  };

  const unpinChat = (roomId: string) => {
    setPinnedChats(pinnedChats.filter(id => id !== roomId));
  };

  const isChatPinned = (roomId: string) => pinnedChats.includes(roomId);

  // Load My Bubble from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(MY_BUBBLE_STORAGE_KEY);
    if (saved) {
      try {
        setMyBubbleRooms(JSON.parse(saved));
      } catch {
        // If parsing fails, use defaults
        setMyBubbleRooms(getDefaultMyBubbleRooms().map(id => ({ roomId: id, pinned: false })));
      }
    } else {
      // First time - populate with nearby communities
      setMyBubbleRooms(getDefaultMyBubbleRooms().map(id => ({ roomId: id, pinned: false })));
    }
  }, []);

  // Save My Bubble to localStorage when it changes
  useEffect(() => {
    if (myBubbleRooms.length > 0) {
      localStorage.setItem(MY_BUBBLE_STORAGE_KEY, JSON.stringify(myBubbleRooms));
    }
  }, [myBubbleRooms]);

  // Get all rooms for lookups
  const allRoomsMap = new Map<string, RoomData & { cityId: CityId; cityName: string }>();
  getAllRooms().forEach(room => allRoomsMap.set(room.id, room));

  // Get rooms for My Bubble
  const getMyBubbleRoomData = (): RoomData[] => {
    return myBubbleRooms
      .map(mbr => allRoomsMap.get(mbr.roomId))
      .filter((r): r is RoomData & { cityId: CityId; cityName: string } => r !== undefined);
  };

  // Get rooms for selected city
  const rooms = selectedCity === 'my-bubble'
    ? getMyBubbleRoomData()
    : cityRooms[selectedCity];
  const currentCity = cities.find(c => c.id === selectedCity)!;

  // Calculate active users for My Bubble
  const myBubbleActiveUsers = getMyBubbleRoomData().reduce((sum, room) => sum + room.users.length, 0);

  // My Bubble actions
  const addRoomToMyBubble = (roomId: string) => {
    if (!myBubbleRooms.find(r => r.roomId === roomId)) {
      setMyBubbleRooms([...myBubbleRooms, { roomId, pinned: false }]);
    }
    setShowAddRoomModal(false);
  };

  const removeRoomFromMyBubble = (roomId: string) => {
    setMyBubbleRooms(myBubbleRooms.filter(r => r.roomId !== roomId));
  };

  const togglePinRoom = (roomId: string) => {
    setMyBubbleRooms(myBubbleRooms.map(r =>
      r.roomId === roomId ? { ...r, pinned: !r.pinned } : r
    ));
  };

  const reorderMyBubbleRooms = (newOrder: MyBubbleRoom[]) => {
    setMyBubbleRooms(newOrder);
  };

  const isRoomInMyBubble = (roomId: string) => myBubbleRooms.some(r => r.roomId === roomId);
  const isRoomPinned = (roomId: string) => myBubbleRooms.find(r => r.roomId === roomId)?.pinned || false;

  const getUserById = (id: number) => users.find(u => u.id === id);

  const Avatar = ({ userId, size = 40 }: { userId: number; size?: number }) => {
    const u = getUserById(userId);
    if (!u) return null;
    return (
      <div
        className={`rounded-full ${u.color} flex items-center justify-center text-white font-medium`}
        style={{ width: size, height: size, fontSize: size * 0.35 }}
        title={u.name}
      >
        {u.initials}
      </div>
    );
  };

  const handleRoomClick = (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    setOpenChat(openChat === roomId ? null : roomId);
  };

  const handleSendMessage = (roomId: string) => {
    if (!chatInput.trim()) return;
    // In a real app, this would send to the backend
    console.log(`Sending to ${roomId}: ${chatInput}`);
    setChatInput('');
  };

  const RoomCard = ({ room, showMessage = true, isDraggable = false }: { room: RoomData; showMessage?: boolean; isDraggable?: boolean }) => {
    const isOpen = openChat === room.id;
    const isPinned = isRoomPinned(room.id);
    const isInMyBubble = isRoomInMyBubble(room.id);
    const roomInfo = allRoomsMap.get(room.id);

    const cardContent = (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={!isDraggable ? { scale: 1.02 } : undefined}
        onClick={(e) => !isEditMode && handleRoomClick(e, room.id)}
        className={`bg-[#1a1a1a] rounded-xl p-3 cursor-pointer border transition-all relative
                  ${isOpen ? 'border-blue-500/50 ring-1 ring-blue-500/30' : 'border-white/5 hover:border-white/20'}
                  ${isPinned && selectedCity === 'my-bubble' ? 'ring-1 ring-yellow-500/30' : ''}
                  ${room.id.includes('tournament') ? 'min-w-[180px]' : 'min-w-[100px]'} flex-1`}
      >
        {/* Edit mode controls for My Bubble */}
        {selectedCity === 'my-bubble' && isEditMode && (
          <div className="absolute -top-2 -right-2 flex gap-1 z-10">
            <button
              onClick={(e) => { e.stopPropagation(); togglePinRoom(room.id); }}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                isPinned ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white/50 hover:bg-white/20'
              }`}
              title={isPinned ? 'Unpin' : 'Pin'}
            >
              {isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); removeRoomFromMyBubble(room.id); }}
              className="w-6 h-6 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500"
              title="Remove"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Drag handle for reordering */}
        {isDraggable && isEditMode && (
          <div className="absolute top-1/2 -left-6 -translate-y-1/2 cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4 text-white/30" />
          </div>
        )}

        {/* Tags */}
        {room.tags && room.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {room.tags.slice(0, 2).map(tagId => {
              const tag = eventTags[tagId];
              return (
                <span
                  key={tagId}
                  className={`${tag.color} text-white text-[8px] px-1.5 py-0.5 rounded-full`}
                >
                  {tag.label}
                </span>
              );
            })}
            {room.tags.length > 2 && (
              <span className="text-[8px] text-white/40">+{room.tags.length - 2}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {isPinned && selectedCity === 'my-bubble' && !isEditMode && (
              <Pin className="w-3 h-3 text-yellow-500 flex-shrink-0" />
            )}
            <p className="text-xs text-white/50 truncate">{room.name}</p>
          </div>
          <div className="flex items-center gap-1">
            {roomInfo && selectedCity === 'my-bubble' && (
              <span className="text-[10px] text-white/30">{roomInfo.cityName}</span>
            )}
            <MessageCircle className="w-3 h-3 text-white/30" />
          </div>
        </div>

        {/* Member count and checked-in count */}
        <div className="flex items-center gap-2 mb-2 text-[10px] text-white/40">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {room.memberCount}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {room.users.length}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {room.users.slice(0, 4).map(uid => (
            <Avatar key={uid} userId={uid} size={32} />
          ))}
          {room.users.length > 4 && (
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/50">
              +{room.users.length - 4}
            </div>
          )}
        </div>
        {showMessage && room.message && (
          <div className="mt-2 bg-[#252525] rounded-lg p-2 flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex-shrink-0" />
            <p className="text-xs text-white/70 line-clamp-1">{room.message.text}</p>
          </div>
        )}

        {/* Quick add to My Bubble button (when viewing other cities) */}
        {selectedCity !== 'my-bubble' && !isInMyBubble && (
          <button
            onClick={(e) => { e.stopPropagation(); addRoomToMyBubble(room.id); }}
            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/10 text-white/50 flex items-center justify-center hover:bg-blue-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
            title="Add to My Bubble"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </motion.div>
    );

    return (
      <div className="relative group">
        {cardContent}
      </div>
    );
  };

  // Get the active chat room data
  const getActiveChatRoom = () => {
    if (!openChat) return null;
    return allRoomsMap.get(openChat) || null;
  };

  const activeChatRoom = getActiveChatRoom();
  const activeChatMessages = openChat ? (roomChats[openChat] || []) : [];

  // Render tag icon
  const TagIcon = ({ icon }: { icon: 'zap' | 'crown' | 'trophy' | 'calendar' | 'users' }) => {
    switch (icon) {
      case 'zap': return <Zap className="w-3 h-3" />;
      case 'crown': return <Crown className="w-3 h-3" />;
      case 'trophy': return <Trophy className="w-3 h-3" />;
      case 'calendar': return <Calendar className="w-3 h-3" />;
      case 'users': return <Users className="w-3 h-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Chat Panel */}
        <div className="lg:w-[380px] flex flex-col border-r border-white/5 bg-[#0a0a0a]">
          {/* Pinned Chats */}
          {pinnedChats.length > 0 && (
            <div className="p-3 border-b border-white/5">
              <p className="text-xs text-white/40 mb-2">Pinned Chats ({pinnedChats.length}/{MAX_PINNED_CHATS})</p>
              <div className="flex flex-wrap gap-2">
                {pinnedChats.map(roomId => {
                  const room = allRoomsMap.get(roomId);
                  if (!room) return null;
                  return (
                    <button
                      key={roomId}
                      onClick={() => setOpenChat(roomId)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        openChat === roomId
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <span>{room.name}</span>
                      <span className="text-[10px] opacity-60">{room.users.length}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Chat or Welcome */}
          <div className="flex-1 flex flex-col">
            <AnimatePresence mode="wait">
              {activeChatRoom ? (
                <motion.div
                  key={openChat}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col h-full"
                >
                  {/* Chat Header */}
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{activeChatRoom.name}</h3>
                        {activeChatRoom.cityName && (
                          <span className="text-xs text-white/40">{activeChatRoom.cityName}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => isChatPinned(openChat!) ? unpinChat(openChat!) : pinChat(openChat!)}
                          disabled={!isChatPinned(openChat!) && pinnedChats.length >= MAX_PINNED_CHATS}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isChatPinned(openChat!)
                              ? 'bg-yellow-500 text-black'
                              : pinnedChats.length >= MAX_PINNED_CHATS
                              ? 'bg-white/5 text-white/20 cursor-not-allowed'
                              : 'bg-white/10 text-white/50 hover:bg-white/20'
                          }`}
                          title={isChatPinned(openChat!) ? 'Unpin chat' : pinnedChats.length >= MAX_PINNED_CHATS ? 'Max pinned chats reached' : 'Pin chat'}
                        >
                          {isChatPinned(openChat!) ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setOpenChat(null)}
                          className="p-1.5 rounded-lg bg-white/10 text-white/50 hover:bg-white/20"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Room stats */}
                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {activeChatRoom.memberCount} members
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        {activeChatRoom.users.length} online
                      </span>
                    </div>

                    {/* Tags */}
                    {activeChatRoom.tags && activeChatRoom.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {activeChatRoom.tags.map(tagId => {
                          const tag = eventTags[tagId];
                          return (
                            <span
                              key={tagId}
                              className={`${tag.color} text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1`}
                            >
                              <TagIcon icon={tag.icon} />
                              {tag.label}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Visit button */}
                    <button
                      onClick={() => navigate(activeChatRoom.route)}
                      className="mt-3 text-xs text-blue-400 hover:text-blue-300"
                    >
                      Visit {activeChatRoom.linkedEntityType || 'page'} →
                    </button>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {activeChatMessages.length === 0 ? (
                      <p className="text-xs text-white/30 text-center py-8">No messages yet. Be the first to say hi!</p>
                    ) : (
                      activeChatMessages.map((msg, i) => {
                        const msgUser = getUserById(msg.userId);
                        return (
                          <div key={i} className="flex gap-2">
                            <div className={`w-8 h-8 rounded-full ${msgUser?.color || 'bg-gray-500'} flex items-center justify-center text-white text-xs flex-shrink-0`}>
                              {msgUser?.initials || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-medium text-white">{msgUser?.name || 'Unknown'}</span>
                                <span className="text-[10px] text-white/30">{msg.time}</span>
                              </div>
                              <p className="text-sm text-white/70">{msg.text}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-white/10">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(openChat!)}
                        placeholder="Type a message..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                      />
                      <button
                        onClick={() => handleSendMessage(openChat!)}
                        className="p-2.5 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Send className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col justify-center p-8 lg:p-10"
                >
                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                    Chess Community
                  </h1>

                  <p className="text-sm text-white/60 mb-6 leading-relaxed">
                    Live visualization of chess activity. Click on any community to chat with players there.
                  </p>

                  <div className="flex flex-wrap gap-3 mb-8">
                    {user ? (
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="px-5 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors text-sm"
                      >
                        My Dashboard
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => openAuthModal('signup')}
                          className="px-5 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors text-sm"
                        >
                          Free Trial
                        </button>
                        <button
                          onClick={() => openAuthModal('login')}
                          className="px-5 py-2.5 border border-white/20 text-white font-medium rounded-lg hover:bg-white/10 transition-colors text-sm"
                        >
                          Book Demo
                        </button>
                      </>
                    )}
                  </div>

                  {/* Quick tip */}
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="text-xs text-white/50 mb-2">Quick tip</p>
                    <p className="text-sm text-white/70">Click any community on the right to open its chat here. You can pin up to {MAX_PINNED_CHATS} chats for quick access.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side - Spatial Grid (ro.am style) */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto bg-[#0d0d0d]">
          {/* Main floor layout */}
          <div className="flex gap-2">
            {/* Main area - left section */}
            <div className="flex-1 space-y-2">
              {/* City header */}
              <motion.div
                key={selectedCity}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mb-2"
              >
                <span className="text-2xl">{currentCity.flag}</span>
                <h2 className="text-lg font-semibold text-white">{currentCity.name}</h2>
                <span className="text-xs text-white/40 ml-2">
                  {selectedCity === 'my-bubble' ? myBubbleActiveUsers : currentCity.activeUsers} players online
                </span>

                {/* My Bubble controls */}
                {selectedCity === 'my-bubble' && (
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => setShowAddRoomModal(true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                    <button
                      onClick={() => setIsEditMode(!isEditMode)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        isEditMode
                          ? 'bg-yellow-500 text-black'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {isEditMode ? 'Done' : 'Edit'}
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Dynamic room grid - renders in rows of 4-6 rooms */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedCity}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  {/* My Bubble with reorderable rooms */}
                  {selectedCity === 'my-bubble' ? (
                    isEditMode ? (
                      <Reorder.Group
                        axis="y"
                        values={myBubbleRooms}
                        onReorder={reorderMyBubbleRooms}
                        className="space-y-2 pl-6"
                      >
                        {myBubbleRooms.map((mbr) => {
                          const room = allRoomsMap.get(mbr.roomId);
                          if (!room) return null;
                          return (
                            <Reorder.Item key={mbr.roomId} value={mbr}>
                              <RoomCard room={room} showMessage isDraggable />
                            </Reorder.Item>
                          );
                        })}
                      </Reorder.Group>
                    ) : (
                      // Normal grid view for My Bubble
                      (() => {
                        const rowSizes = [4, 4, 4];
                        let roomIndex = 0;
                        return rowSizes.map((size, rowIdx) => {
                          const rowRooms = rooms.slice(roomIndex, roomIndex + size);
                          roomIndex += size;
                          if (rowRooms.length === 0) return null;
                          return (
                            <div key={rowIdx} className="flex gap-2">
                              {rowRooms.map((room) => (
                                <RoomCard
                                  key={room.id}
                                  room={room}
                                  showMessage={rowIdx === 0}
                                />
                              ))}
                            </div>
                          );
                        });
                      })()
                    )
                  ) : (
                    // Other cities - split rooms into rows
                    (() => {
                      const rowSizes = selectedCity === 'new-york' ? [6, 4, 4, 4, 3] : [4, 4, 4];
                      let roomIndex = 0;
                      return rowSizes.map((size, rowIdx) => {
                        const rowRooms = rooms.slice(roomIndex, roomIndex + size);
                        roomIndex += size;
                        if (rowRooms.length === 0) return null;
                        return (
                          <div key={rowIdx} className="flex gap-2">
                            {rowRooms.map((room) => (
                              <RoomCard
                                key={room.id}
                                room={room}
                                showMessage={rowIdx === 0 || rowIdx === 2}
                              />
                            ))}
                          </div>
                        );
                      });
                    })()
                  )}

                  {/* Empty state for My Bubble */}
                  {selectedCity === 'my-bubble' && rooms.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <Plus className="w-8 h-8 text-white/30" />
                      </div>
                      <p className="text-white/50 mb-4">Your bubble is empty</p>
                      <button
                        onClick={() => setShowAddRoomModal(true)}
                        className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Add communities
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right sidebar - City bubbles */}
            <div className="w-[140px] space-y-2">
              <p className="text-xs text-white/30 px-1 mb-1">Bubbles</p>
              {cities.map((city, index) => {
                const isMyBubble = city.id === 'my-bubble';
                const cityRoomsList: RoomData[] = isMyBubble
                  ? getMyBubbleRoomData()
                  : cityRooms[city.id as Exclude<CityId, 'my-bubble'>];
                const activeCount = isMyBubble
                  ? myBubbleActiveUsers
                  : city.activeUsers;

                return (
                  <motion.div
                    key={city.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => { setSelectedCity(city.id); setIsEditMode(false); }}
                    className={`bg-[#1a1a1a] rounded-xl p-3 cursor-pointer border transition-all
                      ${selectedCity === city.id
                        ? 'border-blue-500/50 ring-1 ring-blue-500/30 bg-blue-500/10'
                        : 'border-white/5 hover:border-white/20'}
                      ${isMyBubble ? 'border-yellow-500/20' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{city.flag}</span>
                      <p className="text-xs text-white/70 font-medium">{city.name}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-1">
                        {cityRoomsList.slice(0, 4).flatMap((r: RoomData) => r.users).slice(0, 4).map((userId: number, i: number) => {
                          const u = users.find(u => u.id === userId);
                          return u ? (
                            <div
                              key={i}
                              className={`w-5 h-5 rounded-full ${u.color} border border-[#1a1a1a] flex items-center justify-center text-[8px] text-white`}
                            >
                              {u.initials}
                            </div>
                          ) : null;
                        })}
                        {isMyBubble && cityRoomsList.length === 0 && (
                          <div className="w-5 h-5 rounded-full bg-white/10 border border-[#1a1a1a] flex items-center justify-center">
                            <Plus className="w-3 h-3 text-white/30" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-white/40">{activeCount} online</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Bottom toolbar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 flex items-center justify-center gap-4"
          >
            <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-full px-4 py-2">
              <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                <span className="text-lg">😊</span>
              </button>
              <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                <span className="text-lg">👋</span>
              </button>
              <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                <span className="text-lg">♟️</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add Room Modal */}
      <AnimatePresence>
        {showAddRoomModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddRoomModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1a1a] rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Add to My Bubble</h3>
                <button
                  onClick={() => setShowAddRoomModal(false)}
                  className="text-white/40 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {(['new-york', 'london', 'barcelona', 'oslo'] as const).map(cityId => {
                  const city = cities.find(c => c.id === cityId)!;
                  const availableRooms = cityRooms[cityId].filter(
                    room => !isRoomInMyBubble(room.id)
                  );

                  if (availableRooms.length === 0) return null;

                  return (
                    <div key={cityId} className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">{city.flag}</span>
                        <h4 className="text-sm font-medium text-white">{city.name}</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {availableRooms.map(room => (
                          <button
                            key={room.id}
                            onClick={() => addRoomToMyBubble(room.id)}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 text-left transition-colors"
                          >
                            <p className="text-xs font-medium text-white truncate">{room.name}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <div className="flex -space-x-1">
                                {room.users.slice(0, 3).map(uid => {
                                  const u = users.find(u => u.id === uid);
                                  return u ? (
                                    <div
                                      key={uid}
                                      className={`w-4 h-4 rounded-full ${u.color} border border-[#1a1a1a] flex items-center justify-center text-[6px] text-white`}
                                    >
                                      {u.initials}
                                    </div>
                                  ) : null;
                                })}
                              </div>
                              <span className="text-[10px] text-white/40">{room.users.length} online</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* All rooms already added */}
                {(['new-york', 'london', 'barcelona', 'oslo'] as const).every(
                  cityId => cityRooms[cityId].every(room => isRoomInMyBubble(room.id))
                ) && (
                  <div className="text-center py-8">
                    <p className="text-white/50">All communities have been added to your bubble!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomeRoam;
