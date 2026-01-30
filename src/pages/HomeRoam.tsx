import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Pin, PinOff, Plus, Trash2, Users, Crown, Trophy, Play, Radio, Video, Tv, Search, GripVertical, MoreVertical, Gamepad2, ExternalLink, Swords } from 'lucide-react';
import { useStore } from '../store';
import CommunitySearch from '../components/CommunitySearch';
import VoiceChannel from '../components/VoiceChannel';
import { getLocationFromIP, findNearestSupportedCity } from '../hooks/useGeolocation';
import { communitiesApi } from '../api/communities';
import type { Community, CityStats } from '../api/communities';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  useDroppable,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DropAnimation } from '@dnd-kit/core';
import {
  useDraggable,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

// Users array - now empty, will be populated from API data
const users: { id: number; name: string; initials: string; color: string; image: string }[] = [];

// City definitions
type CityId = 'my-bubble' | 'new-york' | 'london' | 'barcelona' | 'oslo' | 'rest-of-world';

interface CityData {
  id: CityId;
  name: string;
  flag: string;
  flagCode: string; // ISO country code for Twemoji
  activeUsers: number;
}

// Convert country code to Twemoji URL
const getFlagUrl = (countryCode: string): string => {
  if (countryCode === 'star') {
    return 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2b50.png'; // Star emoji
  }
  if (countryCode === 'globe') {
    return 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f30d.png'; // Globe emoji 🌍
  }
  // Convert country code to regional indicator symbols codepoints
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => (127397 + char.charCodeAt(0)).toString(16))
    .join('-');
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${codePoints}.png`;
};

// Flag component that uses Twemoji images for cross-platform support
const FlagIcon: React.FC<{ code: string; size?: 'sm' | 'md' | 'lg' }> = ({ code, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  return (
    <img
      src={getFlagUrl(code)}
      alt={code}
      className={`${sizeClass} inline-block`}
      loading="lazy"
    />
  );
};

const cities: CityData[] = [
  { id: 'my-bubble', name: 'My ChessFam', flag: '⭐', flagCode: 'star', activeUsers: 0 },
  { id: 'new-york', name: 'NYC ChessFam', flag: '🇺🇸', flagCode: 'us', activeUsers: 24 },
  { id: 'london', name: 'London ChessFam', flag: '🇬🇧', flagCode: 'gb', activeUsers: 18 },
  { id: 'barcelona', name: 'Barcelona ChessFam', flag: '🇪🇸', flagCode: 'es', activeUsers: 15 },
  { id: 'oslo', name: 'Oslo ChessFam', flag: '🇳🇴', flagCode: 'no', activeUsers: 12 },
  { id: 'rest-of-world', name: 'Global ChessFam', flag: '🌍', flagCode: 'globe', activeUsers: 47 },
];

// Map city name to CityId for placing API communities in the right bubble
const mapCityToCityId = (cityName?: string): Exclude<CityId, 'my-bubble'> => {
  if (!cityName) return 'rest-of-world';
  const lower = cityName.toLowerCase();
  // Check for city matches
  if (lower.includes('new york') || lower.includes('nyc') || lower === 'ny') return 'new-york';
  if (lower.includes('london')) return 'london';
  if (lower.includes('barcelona')) return 'barcelona';
  if (lower.includes('oslo')) return 'oslo';
  // US cities go to new-york bubble
  if (['chicago', 'los angeles', 'san francisco', 'boston', 'dallas', 'houston', 'miami', 'seattle', 'atlanta', 'philadelphia', 'phoenix', 'denver', 'detroit', 'minneapolis', 'st. louis', 'charlotte', 'bay area'].some(c => lower.includes(c))) return 'new-york';
  // UK cities go to london bubble
  if (['manchester', 'birmingham', 'glasgow', 'liverpool', 'edinburgh', 'leeds', 'bristol', 'cambridge', 'oxford'].some(c => lower.includes(c))) return 'london';
  // Spanish cities go to barcelona bubble
  if (['madrid', 'valencia', 'seville', 'bilbao', 'malaga'].some(c => lower.includes(c))) return 'barcelona';
  // Norwegian/Scandinavian cities go to oslo bubble
  if (['bergen', 'trondheim', 'stavanger', 'stockholm', 'copenhagen', 'helsinki'].some(c => lower.includes(c))) return 'oslo';
  // Everything else goes to rest-of-world
  return 'rest-of-world';
};

// Convert API Community to RoomData format
const communityToRoomData = (community: Community, gridArea: string): RoomData => {
  return {
    id: `api-${community.id}`,
    name: community.name,
    route: community.type === 'club' ? '/clubs' :
           community.type === 'tournament' ? '/tournaments' : '/locations',
    users: [], // API communities don't have sample users
    memberCount: community.member_count || 0,
    tags: community.tags || [],
    gridArea,
    linkedEntityType: community.type === 'club' ? 'club' :
                      community.type === 'tournament' ? 'tournament' : 'location',
    linkedEntityId: community.id.toString(),
  };
};

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

// Default "nearby" communities for My Bubble based on detected city
const getDefaultMyBubbleRooms = (cityId: Exclude<CityId, 'my-bubble'> = 'new-york'): string[] => {
  // Return rooms from the detected city
  const rooms = cityRooms[cityId];
  if (rooms && rooms.length > 0) {
    return rooms.slice(0, 5).map(r => r.id);
  }
  // Fallback to NY rooms
  return ['venue1', 'venue3', 'club1', 'tournament1', 'venue6'];
};

// Chat message type - userId for sample messages, realUser for actual logged-in users
interface ChatMessage {
  userId: number; // For sample users from the users array
  text: string;
  time: string;
  realUser?: { // For actual logged-in users
    name: string;
    avatar?: string;
  };
}

// Chat messages - now empty, will be populated from API
const roomChats: Record<string, ChatMessage[]> = {};

// City-specific rooms - now empty, populated from API communities
const cityRooms: Record<Exclude<CityId, 'my-bubble'>, RoomData[]> = {
  'new-york': [],
  'london': [],
  'barcelona': [],
  'oslo': [],
  'rest-of-world': [],
};

interface RoomData {
  id: string;
  name: string;
  route: string;
  users: number[]; // Currently checked in users
  memberCount: number; // Total members
  message?: { user: string; text: string };
  gridArea: string;
  tags?: string[];
  linkedEntityId?: string; // ID of linked location/club/tournament
  linkedEntityType?: 'location' | 'club' | 'tournament';
}

// Theater data for each city - central featured content
interface TheaterData {
  type: 'stream' | 'game' | 'event' | 'announcement';
  title: string;
  subtitle?: string;
  viewerCount?: number;
  thumbnail?: string;
  isLive?: boolean;
  players?: { white: string; black: string; whiteRating?: number; blackRating?: number };
  streamUrl?: string;
}

const cityTheaters: Record<Exclude<CityId, 'my-bubble'>, TheaterData> = {
  'new-york': {
    type: 'stream',
    title: 'Washington Square Hustlers',
    subtitle: 'Live from the park',
    viewerCount: 234,
    isLive: true,
    thumbnail: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400',
  },
  'london': {
    type: 'game',
    title: 'Featured Game',
    players: { white: 'Luke M.', black: 'Gawain J.', whiteRating: 2650, blackRating: 2720 },
    viewerCount: 89,
    isLive: true,
  },
  'barcelona': {
    type: 'event',
    title: 'Catalunya Open - Round 5',
    subtitle: 'Live coverage from the tournament hall',
    viewerCount: 156,
    isLive: true,
    thumbnail: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=400',
  },
  'oslo': {
    type: 'stream',
    title: 'Norwegian Championship',
    subtitle: 'GM Commentary by Jon Hammer',
    viewerCount: 312,
    isLive: true,
    thumbnail: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=400',
  },
  'rest-of-world': {
    type: 'event',
    title: 'Tata Steel Masters - Round 9',
    subtitle: 'Carlsen vs Gukesh - Live from Wijk aan Zee',
    viewerCount: 4523,
    isLive: true,
    thumbnail: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400',
  },
};

// City-specific chess advertisements
interface CityAd {
  image: string;
  title: string;
  subtitle: string;
  link?: string;
}

const cityAds: Record<Exclude<CityId, 'my-bubble'>, CityAd> = {
  'new-york': {
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400&h=300&fit=crop',
    title: 'Chess NYC Tournament',
    subtitle: 'Join the Spring Open - $5,000 Prize Pool',
  },
  'london': {
    image: 'https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?w=400&h=300&fit=crop',
    title: 'London Chess Classic',
    subtitle: 'Premium coaching sessions available',
  },
  'barcelona': {
    image: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=400&h=300&fit=crop',
    title: 'Chess Barcelona Academy',
    subtitle: 'Train with GM instructors',
  },
  'oslo': {
    image: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=400&h=300&fit=crop',
    title: 'Magnus Chess Academy',
    subtitle: 'Online & in-person lessons',
  },
  'rest-of-world': {
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop',
    title: 'Chess.com Global Championship',
    subtitle: 'Watch the worlds best compete live',
  },
};

// My Bubble storage key
const MY_BUBBLE_STORAGE_KEY = 'chess-my-bubble-rooms';
const PINNED_CHATS_STORAGE_KEY = 'chess-pinned-chats';
const MAX_PINNED_CHATS = 5;

type RoomSize = 1 | 2 | 4; // Number of blocks: 1 = single, 2 = horizontal span, 4 = 2x2

// Grid configuration
const GRID_COLS = 4;
const GRID_ROWS = 4;

interface MyBubbleRoom {
  roomId: string;
  pinned: boolean;
  size: RoomSize;
  gridPosition: number; // 0-based index in the grid (0 to GRID_COLS * GRID_ROWS - 1)
}

// Get cells occupied by a room based on its size and position
const getOccupiedCells = (position: number, size: RoomSize): number[] => {
  const cells = [position];
  if (size >= 2) {
    // Horizontal span - add cell to the right (if not at edge)
    if ((position % GRID_COLS) < GRID_COLS - 1) {
      cells.push(position + 1);
    }
  }
  if (size === 4) {
    // 2x2 - add cells below
    if (position + GRID_COLS < GRID_COLS * GRID_ROWS) {
      cells.push(position + GRID_COLS);
    }
    if ((position % GRID_COLS) < GRID_COLS - 1 && position + GRID_COLS + 1 < GRID_COLS * GRID_ROWS) {
      cells.push(position + GRID_COLS + 1);
    }
  }
  return cells;
};

// Draggable item wrapper for grid
interface DraggableItemProps {
  id: string;
  children: React.ReactNode;
}

const DraggableItem = ({ id, children }: DraggableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
    cursor: 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative touch-none ${isDragging ? 'scale-105 shadow-2xl' : ''}`}
    >
      {/* Drag indicator */}
      <div className="absolute -top-2 -left-2 w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center z-30 shadow-lg">
        <GripVertical className="w-4 h-4 text-white" />
      </div>
      {children}
    </div>
  );
};

// Droppable cell for grid
interface DroppableCellProps {
  id: string;
  children?: React.ReactNode;
}

const DroppableCell = ({ id, children }: DroppableCellProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const hasContent = React.Children.count(children) > 0;

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[120px] rounded-xl transition-all
        ${!hasContent
          ? `border-2 border-dashed ${isOver ? 'border-purple-500 bg-purple-500/20' : 'border-white/10 hover:border-white/20'}`
          : ''
        }
        ${isOver && !hasContent ? 'scale-105' : ''}
      `}
    >
      {hasContent ? (
        children
      ) : (
        <div className={`w-full h-full min-h-[120px] flex items-center justify-center ${isOver ? 'text-purple-400' : 'text-white/20'}`}>
          <Plus className="w-6 h-6" />
        </div>
      )}
    </div>
  );
};

const HomeRoam = () => {
  const navigate = useNavigate();
  const { user, openAuthModal } = useStore();
  const [openChat, setOpenChat] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  // Default to 'new-york' if not logged in, 'my-bubble' if logged in
  const [selectedCity, setSelectedCity] = useState<CityId>(user ? 'my-bubble' : 'new-york');
  const [myBubbleRooms, setMyBubbleRooms] = useState<MyBubbleRoom[]>([]);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  // User profile popup state
  const [selectedUserPopup, setSelectedUserPopup] = useState<{ userId: number; x: number; y: number } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);
  const [recentChats, setRecentChats] = useState<string[]>([]); // Last 3 chats opened
  const [showSearch, setShowSearch] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Room messages state - initialized with sample data
  const [roomMessages, setRoomMessages] = useState<Record<string, ChatMessage[]>>(roomChats);
  // Detected city from IP geolocation
  const [detectedCity, setDetectedCity] = useState<CityId | null>(null);
  // API communities state
  const [apiCommunities, setApiCommunities] = useState<Community[]>([]);
  // User's owned communities (for My ChessFam bubble)
  const [ownedCommunities, setOwnedCommunities] = useState<Community[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_apiCityStats, setApiCityStats] = useState<CityStats[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_apiLoading, setApiLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_apiError, setApiError] = useState<string | null>(null);

  // DnD sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Drop animation config
  const dropAnimationConfig: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end for grid placement
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeRoomId = active.id as string;
    const overId = over.id as string;

    // Check if dropping on a grid cell (cell-0, cell-1, etc.)
    if (overId.startsWith('cell-')) {
      const targetPosition = parseInt(overId.replace('cell-', ''), 10);

      setMyBubbleRooms((items) => {
        // Check if target position is already occupied
        const existingRoomAtTarget = items.find(item => item.gridPosition === targetPosition);

        if (existingRoomAtTarget && existingRoomAtTarget.roomId !== activeRoomId) {
          // Swap positions
          const activeRoom = items.find(item => item.roomId === activeRoomId);
          if (!activeRoom) return items;

          return items.map(item => {
            if (item.roomId === activeRoomId) {
              return { ...item, gridPosition: targetPosition };
            }
            if (item.roomId === existingRoomAtTarget.roomId) {
              return { ...item, gridPosition: activeRoom.gridPosition };
            }
            return item;
          });
        } else {
          // Move to empty cell
          return items.map(item =>
            item.roomId === activeRoomId
              ? { ...item, gridPosition: targetPosition }
              : item
          );
        }
      });
    }
  };

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
    // Load recent chats
    const savedRecent = localStorage.getItem('chess-recent-chats');
    if (savedRecent) {
      try {
        setRecentChats(JSON.parse(savedRecent));
      } catch {
        setRecentChats([]);
      }
    }
  }, []);

  // Save pinned chats to localStorage
  useEffect(() => {
    localStorage.setItem(PINNED_CHATS_STORAGE_KEY, JSON.stringify(pinnedChats));
  }, [pinnedChats]);

  // Save recent chats to localStorage
  useEffect(() => {
    localStorage.setItem('chess-recent-chats', JSON.stringify(recentChats));
  }, [recentChats]);

  // Track recent chats when opening a chat
  const addToRecentChats = (roomId: string) => {
    setRecentChats(prev => {
      const filtered = prev.filter(id => id !== roomId);
      return [roomId, ...filtered].slice(0, 3); // Keep last 3
    });
  };

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

  // Combined list: pinned chats + recent chats (excluding duplicates)
  const displayedChats = [...pinnedChats, ...recentChats.filter(id => !pinnedChats.includes(id))].slice(0, MAX_PINNED_CHATS);

  // Load My Bubble from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(MY_BUBBLE_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrate old data without gridPosition property
        const migrated = parsed.map((r: any, index: number) => ({
          roomId: r.roomId,
          pinned: r.pinned || false,
          size: typeof r.size === 'number' ? r.size : 1, // Migrate old string sizes to 1
          gridPosition: r.gridPosition !== undefined ? r.gridPosition : index
        }));
        setMyBubbleRooms(migrated);
      } catch {
        // If parsing fails, use defaults
        setMyBubbleRooms(getDefaultMyBubbleRooms().map((id, index) => ({
          roomId: id,
          pinned: false,
          size: 1 as RoomSize,
          gridPosition: index
        })));
      }
    } else {
      // First time - populate with nearby communities
      setMyBubbleRooms(getDefaultMyBubbleRooms().map((id, index) => ({
        roomId: id,
        pinned: false,
        size: 1 as RoomSize,
        gridPosition: index
      })));
    }
  }, []);

  // Save My Bubble to localStorage when it changes
  useEffect(() => {
    if (myBubbleRooms.length > 0) {
      localStorage.setItem(MY_BUBBLE_STORAGE_KEY, JSON.stringify(myBubbleRooms));
    }
  }, [myBubbleRooms]);

  // Redirect away from My Bubble when user logs out
  useEffect(() => {
    if (!user && selectedCity === 'my-bubble') {
      setSelectedCity(detectedCity && detectedCity !== 'my-bubble' ? detectedCity : 'new-york');
    }
  }, [user, selectedCity, detectedCity]);

  // Silent IP-based geolocation detection
  useEffect(() => {
    // Only detect location once, for logged-in users, if we haven't already
    if (!user || detectedCity) return;

    // Check if we have a cached detected city
    const cachedCity = localStorage.getItem('detected-city');
    if (cachedCity && ['new-york', 'london', 'barcelona', 'oslo', 'rest-of-world'].includes(cachedCity)) {
      setDetectedCity(cachedCity as CityId);
      return;
    }

    // Silently fetch location from IP
    getLocationFromIP()
      .then(data => {
        if (data) {
          const nearest = findNearestSupportedCity(data.latitude, data.longitude);
          if (nearest && nearest.cityId !== 'my-bubble') {
            const cityId = nearest.cityId as CityId;
            setDetectedCity(cityId);
            localStorage.setItem('detected-city', cityId);

            // If My Bubble is empty, populate with rooms from detected city
            if (myBubbleRooms.length === 0) {
              const defaultRooms = getDefaultMyBubbleRooms(cityId as Exclude<CityId, 'my-bubble'>);
              setMyBubbleRooms(defaultRooms.map((id, index) => ({
                roomId: id,
                pinned: false,
                size: 1 as RoomSize,
                gridPosition: index
              })));
            }
          }
        }
      })
      .catch(() => {
        // Silently fall back to default
        setDetectedCity('new-york');
      });
  }, [user, detectedCity, myBubbleRooms.length]);

  // Track if initial load has completed
  const initialLoadDone = React.useRef(false);

  // Fetch communities from API (silent updates after initial load)
  const fetchCommunities = useCallback(async (isInitialLoad = false) => {
    try {
      // Only show loading state on initial load
      if (isInitialLoad) {
        setApiLoading(true);
      }
      setApiError(null);

      // Fetch communities and city stats in parallel, and user's owned communities if logged in
      const fetchPromises: Promise<any>[] = [
        communitiesApi.getAll({ is_active: true, limit: 100 }),
        communitiesApi.getCityStats()
      ];

      // Add owned communities fetch if user is logged in
      if (user) {
        fetchPromises.push(communitiesApi.getUserOwnedCommunities());
      }

      const results = await Promise.all(fetchPromises);
      const [communitiesResult, statsResult, ownedResult] = results;

      // Use functional updates to prevent unnecessary re-renders
      // Only update if data has actually changed
      const newCommunities = communitiesResult.communities || [];
      const newStats = statsResult || [];
      const newOwned = ownedResult || [];

      setApiCommunities(prev => {
        // Compare by stringifying - if same, return previous reference to avoid re-render
        const prevStr = JSON.stringify(prev.map(c => ({ id: c.id, member_count: c.member_count, online_count: c.online_count })));
        const newStr = JSON.stringify(newCommunities.map((c: Community) => ({ id: c.id, member_count: c.member_count, online_count: c.online_count })));
        return prevStr === newStr ? prev : newCommunities;
      });

      setApiCityStats(prev => {
        const prevStr = JSON.stringify(prev);
        const newStr = JSON.stringify(newStats);
        return prevStr === newStr ? prev : newStats;
      });

      // Update owned communities if user is logged in
      if (user && newOwned) {
        setOwnedCommunities(prev => {
          const prevStr = JSON.stringify(prev.map(c => c.id));
          const newStr = JSON.stringify(newOwned.map((c: Community) => c.id));
          return prevStr === newStr ? prev : newOwned;
        });
      } else if (!user) {
        // Clear owned communities if user logs out
        setOwnedCommunities([]);
      }
    } catch (err) {
      console.error('Failed to fetch communities:', err);
      // Only show error on initial load, silently fail on polls
      if (isInitialLoad) {
        setApiError('Could not load live communities');
      }
    } finally {
      if (isInitialLoad) {
        setApiLoading(false);
      }
    }
  }, [user]);

  // Fetch communities on mount and set up polling
  useEffect(() => {
    if (!initialLoadDone.current) {
      fetchCommunities(true);
      initialLoadDone.current = true;
    }

    // Poll every 2 minutes for community updates (since Supabase real-time is not configured)
    const interval = setInterval(() => fetchCommunities(false), 120000);
    return () => clearInterval(interval);
  }, [fetchCommunities]);

  // Automatically add user's owned communities to My ChessFam bubble
  useEffect(() => {
    console.log('[My ChessFam] Owned communities:', ownedCommunities);
    if (ownedCommunities.length > 0) {
      const ownedRoomIds = ownedCommunities.map(c => `my-api-${c.id}`);
      console.log('[My ChessFam] Owned room IDs to add:', ownedRoomIds);

      // Add any owned communities that aren't already in myBubbleRooms
      setMyBubbleRooms(prev => {
        console.log('[My ChessFam] Current myBubbleRooms:', prev);
        const existingIds = new Set(prev.map(r => r.roomId));
        const newRooms: MyBubbleRoom[] = [];

        ownedRoomIds.forEach((roomId) => {
          if (!existingIds.has(roomId)) {
            // Find first available position
            const occupiedPositions = new Set([...prev.map(r => r.gridPosition), ...newRooms.map(r => r.gridPosition)]);
            let gridPosition = 0;
            while (occupiedPositions.has(gridPosition) && gridPosition < GRID_COLS * GRID_ROWS) {
              gridPosition++;
            }

            newRooms.push({
              roomId,
              pinned: true, // Auto-pin owned communities
              size: 1,
              gridPosition
            });
          }
        });

        console.log('[My ChessFam] New rooms to add:', newRooms);
        const updated = newRooms.length > 0 ? [...prev, ...newRooms] : prev;
        console.log('[My ChessFam] Updated myBubbleRooms:', updated);
        return updated;
      });
    }
  }, [ownedCommunities]);

  // Get all rooms for lookups (static + API communities)
  const allRoomsMap = new Map<string, RoomData & { cityId: CityId; cityName: string }>();
  // Add static rooms
  getAllRooms().forEach(room => allRoomsMap.set(room.id, room));
  // Add API community rooms
  const gridLetters = 'abcdefghijklmnopqrstuvwxyz';
  apiCommunities.forEach((community, index) => {
    const cityId = mapCityToCityId(community.city);
    const city = cities.find(c => c.id === cityId);
    const staticRoomCount = cityRooms[cityId]?.length || 0;
    const gridIndex = staticRoomCount + index;
    const gridArea = gridIndex < gridLetters.length ? gridLetters[gridIndex] : `grid-${gridIndex}`;
    const roomData = communityToRoomData(community, gridArea);
    allRoomsMap.set(roomData.id, { ...roomData, cityId, cityName: city?.name || '' });
  });

  // Add user's owned communities to My ChessFam bubble
  // Use a different ID prefix to allow them to appear in both city bubble and My ChessFam
  ownedCommunities.forEach((community, index) => {
    const cityId: CityId = 'my-bubble';
    // My bubble doesn't have static rooms in cityRooms
    const staticRoomCount = 0;
    const gridIndex = staticRoomCount + index;
    const gridArea = gridIndex < gridLetters.length ? gridLetters[gridIndex] : `grid-${gridIndex}`;
    const roomData = communityToRoomData(community, gridArea);
    // Use 'my-' prefix for ID so it can exist in both My ChessFam and city bubbles
    const myRoomData = { ...roomData, id: `my-${roomData.id}` };
    console.log('[My ChessFam] Adding to allRoomsMap:', myRoomData.id, 'from community:', community.id);
    // Use the community's actual city instead of "My ChessFam" for the cityName label
    allRoomsMap.set(myRoomData.id, { ...myRoomData, cityId, cityName: community.city || '' });
  });

  // Get active room for drag overlay
  const activeRoom = activeId ? allRoomsMap.get(activeId) : null;
  const activeMbr = activeId ? myBubbleRooms.find(r => r.roomId === activeId) : null;

  // Get rooms for My Bubble
  const getMyBubbleRoomData = (): RoomData[] => {
    const rooms = myBubbleRooms
      .map(mbr => allRoomsMap.get(mbr.roomId))
      .filter((r): r is RoomData & { cityId: CityId; cityName: string } => r !== undefined);
    console.log('[My ChessFam] Room data:', rooms.map(r => ({ id: r.id, name: r.name, cityName: r.cityName })));
    return rooms;
  };

  // Get API communities for a specific city bubble
  const getApiRoomsForCity = (cityId: Exclude<CityId, 'my-bubble'>): RoomData[] => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const staticRoomCount = cityRooms[cityId]?.length || 0;

    return apiCommunities
      .filter(community => {
        // Use parent_bubble if available, otherwise fall back to city mapping
        const communityBubble = community.parent_bubble || mapCityToCityId(community.city);
        return communityBubble === cityId;
      })
      .map((community, index) => {
        const gridIndex = staticRoomCount + index;
        const gridArea = gridIndex < letters.length ? letters[gridIndex] : `grid-${gridIndex}`;
        return communityToRoomData(community, gridArea);
      });
  };

  // Get rooms for selected city (static + API communities merged)
  const getRoomsForCity = (cityId: Exclude<CityId, 'my-bubble'>): RoomData[] => {
    const staticRooms = cityRooms[cityId] || [];
    const apiRooms = getApiRoomsForCity(cityId);

    // Find the city general chat community
    const cityName = cities.find(c => c.id === cityId)?.name;
    const cityGeneralChat = cityName ? apiCommunities.find(
      community => community.type === 'city' && community.city?.toLowerCase() === cityName.toLowerCase()
    ) : null;

    // Add city general chat as the first room (grid position 'a') if it exists
    const generalChatRoom = cityGeneralChat ? [communityToRoomData(cityGeneralChat, 'a')] : [];

    // Adjust grid positions for other rooms if general chat exists
    const adjustedRooms = cityGeneralChat
      ? [...staticRooms.map((r, i) => ({ ...r, gridArea: String.fromCharCode(98 + i) })), ...apiRooms]
      : [...staticRooms, ...apiRooms];

    return [...generalChatRoom, ...adjustedRooms];
  };

  const rooms = selectedCity === 'my-bubble'
    ? getMyBubbleRoomData()
    : getRoomsForCity(selectedCity);
  const currentCity = cities.find(c => c.id === selectedCity)!;

  // Calculate active users for My Bubble
  const myBubbleActiveUsers = getMyBubbleRoomData().reduce((sum, room) => sum + room.users.length, 0);

  // Calculate active users for each city
  const getCityActiveUsers = (cityId: Exclude<CityId, 'my-bubble'>): number => {
    const cityRoomData = getRoomsForCity(cityId);
    return cityRoomData.reduce((sum, room) => sum + room.users.length, 0);
  };

  // Find first available grid position (accounting for spanning rooms)
  const findFirstEmptyGridPosition = (): number => {
    const totalCells = GRID_COLS * GRID_ROWS;
    // Build set of all occupied cells (including those covered by spanning rooms)
    const occupiedPositions = new Set<number>();
    myBubbleRooms.forEach(mbr => {
      const cells = getOccupiedCells(mbr.gridPosition, mbr.size);
      cells.forEach(cell => occupiedPositions.add(cell));
    });
    for (let i = 0; i < totalCells; i++) {
      if (!occupiedPositions.has(i)) {
        return i;
      }
    }
    return totalCells; // Beyond grid if full
  };

  // My Bubble actions
  const addRoomToMyBubble = (roomId: string) => {
    if (!myBubbleRooms.find(r => r.roomId === roomId)) {
      const gridPosition = findFirstEmptyGridPosition();
      setMyBubbleRooms([...myBubbleRooms, { roomId, pinned: false, size: 1, gridPosition }]);
    }
    setShowAddRoomModal(false);
  };

  const setRoomSize = (roomId: string, newSize: RoomSize) => {
    setMyBubbleRooms(myBubbleRooms.map(r =>
      r.roomId === roomId ? { ...r, size: newSize } : r
    ));
  };

  const removeRoomFromMyBubble = (roomId: string) => {
    setMyBubbleRooms(myBubbleRooms.filter(r => r.roomId !== roomId));
  };

  const togglePinRoom = (roomId: string) => {
    setMyBubbleRooms(myBubbleRooms.map(r =>
      r.roomId === roomId ? { ...r, pinned: !r.pinned } : r
    ));
  };

  const isRoomInMyBubble = (roomId: string) => myBubbleRooms.some(r => r.roomId === roomId);
  const isRoomPinned = (roomId: string) => myBubbleRooms.find(r => r.roomId === roomId)?.pinned || false;

  const getUserById = (id: number) => users.find(u => u.id === id);

  const handleAvatarClick = (e: React.MouseEvent, userId: number) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setSelectedUserPopup({
      userId,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8
    });
  };

  const Avatar = ({ userId, size = 40, clickable = true }: { userId: number; size?: number; clickable?: boolean }) => {
    const u = getUserById(userId);
    if (!u) return null;
    return (
      <img
        src={u.image}
        alt={u.name}
        className={`rounded-full object-cover ${clickable ? 'cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all' : ''}`}
        style={{ width: size, height: size }}
        title={u.name}
        onClick={clickable ? (e) => handleAvatarClick(e, userId) : undefined}
        onError={(e) => {
          // Fallback to initials if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.parentElement?.classList.add(u.color);
          target.parentElement?.setAttribute('data-fallback', u.initials);
        }}
      />
    );
  };

  const handleRoomClick = (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    const isOpening = openChat !== roomId;
    setOpenChat(isOpening ? roomId : null);
    if (isOpening) {
      addToRecentChats(roomId);
    }
  };

  const handleSendMessage = async (roomId: string) => {
    if (!chatInput.trim()) return;

    const messageText = chatInput;

    // Create new message for optimistic update
    const newMessage: ChatMessage = {
      userId: 0, // 0 indicates this is a real user message
      text: messageText,
      time: 'just now',
      realUser: user ? {
        name: user.name || 'You',
        avatar: user.avatar
      } : {
        name: 'Guest',
        avatar: undefined
      }
    };

    // Optimistically add message to state
    setRoomMessages(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), newMessage]
    }));

    setChatInput('');

    // Try to send to API if user is logged in
    if (user) {
      // Find the API community that matches this room
      const apiCommunity = apiCommunities.find(c =>
        c.slug === roomId || c.id.toString() === roomId
      );

      if (apiCommunity) {
        try {
          await communitiesApi.sendMessage(apiCommunity.id, messageText);
        } catch (err) {
          console.error('Failed to send message to API:', err);
          // Message is already shown locally, so we just log the error
        }
      }
    }
  };

  const RoomCard = ({ room, showMessage = true, isDraggable = false, size = 1 }: { room: RoomData; showMessage?: boolean; isDraggable?: boolean; size?: RoomSize }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const isOpen = openChat === room.id;
    const isPinned = isRoomPinned(room.id);
    const isInMyBubble = isRoomInMyBubble(room.id);
    const roomInfo = allRoomsMap.get(room.id);

    // Size labels for display
    const sizeLabels: Record<RoomSize, string> = { 1: '1×1', 2: '2×1', 4: '2×2' };

    // Build link URL for the community
    const getCommunityUrl = (): string | null => {
      if (room.linkedEntityId && room.linkedEntityType) {
        switch (room.linkedEntityType) {
          case 'location':
            return `/locations/${room.linkedEntityId}`;
          case 'club':
            return `/clubs/${room.linkedEntityId}`;
          case 'tournament':
            return `/tournaments/${room.linkedEntityId}`;
        }
      }
      // For API communities (id starts with 'api-')
      if (room.id.startsWith('api-')) {
        const communityId = room.id.replace('api-', '');
        // Route based on the room's route property
        if (room.route === '/clubs') return `/clubs/${communityId}`;
        if (room.route === '/tournaments') return `/tournaments/${communityId}`;
        return `/locations/${communityId}`;
      }
      return null;
    };

    const communityUrl = getCommunityUrl();

    const handleLinkClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (communityUrl) {
        navigate(communityUrl);
      }
    };

    const cardContent = (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={!isDraggable ? { scale: 1.02 } : undefined}
        onClick={(e) => !isEditMode && handleRoomClick(e, room.id)}
        className={`bg-[#1a1a1a] rounded-xl p-3 cursor-pointer border transition-all relative h-full
                  ${isOpen ? 'border-blue-500/50 ring-1 ring-blue-500/30' : 'border-white/5 hover:border-white/20'}
                  ${isPinned && selectedCity === 'my-bubble' ? 'ring-1 ring-yellow-500/30' : ''}`}
      >
        {/* Burger menu for My Bubble in edit mode */}
        {selectedCity === 'my-bubble' && isEditMode && (
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-white/70" />
            </button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  className="absolute top-8 right-0 w-40 bg-[#252525] border border-white/10 rounded-lg shadow-xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Size selector */}
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="text-[10px] text-white/40 uppercase tracking-wide mb-2">Size</p>
                    <div className="flex gap-1">
                      {([1, 2, 4] as RoomSize[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => { setRoomSize(room.id, s); }}
                          className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                            size === s
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          {sizeLabels[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => { togglePinRoom(room.id); setMenuOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-2"
                  >
                    {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    {isPinned ? 'Unpin' : 'Pin to chat'}
                  </button>
                  <button
                    onClick={() => { removeRoomFromMyBubble(room.id); setMenuOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {isPinned && selectedCity === 'my-bubble' && !isEditMode && (
              <Pin className="w-3 h-3 text-yellow-500 flex-shrink-0" />
            )}
            <p className="text-xs text-white/50 truncate flex-1">{room.name}</p>
            {communityUrl && (
              <button
                onClick={handleLinkClick}
                className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 hover:bg-blue-500/30 flex items-center justify-center transition-colors group/link"
                title="View details"
              >
                <ExternalLink className="w-3 h-3 text-white/30 group-hover/link:text-blue-400" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
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

  // Theater Box Component - central featured content for each bubble
  const TheaterBox = ({ theater }: { theater: TheaterData }) => {
    const getTypeIcon = () => {
      switch (theater.type) {
        case 'stream': return <Video className="w-4 h-4" />;
        case 'game': return <Play className="w-4 h-4" />;
        case 'event': return <Tv className="w-4 h-4" />;
        default: return <Radio className="w-4 h-4" />;
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-[#1a1a1a] to-[#252525] rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/30 transition-all cursor-pointer"
      >
        {/* Theater content area */}
        <div className="relative aspect-video bg-black/50">
          {theater.thumbnail ? (
            <img
              src={theater.thumbnail}
              alt={theater.title}
              className="w-full h-full object-cover opacity-80"
            />
          ) : theater.type === 'game' && theater.players ? (
            // Chess board placeholder for featured games
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-900/30 to-amber-800/20">
              <div className="grid grid-cols-8 grid-rows-8 w-32 h-32 border border-white/20 rounded">
                {[...Array(64)].map((_, i) => {
                  const row = Math.floor(i / 8);
                  const col = i % 8;
                  const isLight = (row + col) % 2 === 0;
                  return (
                    <div
                      key={i}
                      className={isLight ? 'bg-amber-100/20' : 'bg-amber-900/40'}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-indigo-900/30">
              <Play className="w-16 h-16 text-white/20" />
            </div>
          )}

          {/* Live indicator */}
          {theater.isLive && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              LIVE
            </div>
          )}

          {/* Viewer count */}
          {theater.viewerCount && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
              <Users className="w-3 h-3" />
              {theater.viewerCount}
            </div>
          )}

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
        </div>

        {/* Theater info */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1 text-purple-400 text-xs font-medium">
              {getTypeIcon()}
              {theater.type.charAt(0).toUpperCase() + theater.type.slice(1)}
            </span>
          </div>

          <h3 className="text-white font-semibold mb-1">{theater.title}</h3>

          {theater.subtitle && (
            <p className="text-white/50 text-sm">{theater.subtitle}</p>
          )}

          {/* Players info for game type */}
          {theater.type === 'game' && theater.players && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white border border-white/20" />
                <span className="text-white">{theater.players.white}</span>
                {theater.players.whiteRating && (
                  <span className="text-white/40 text-xs">({theater.players.whiteRating})</span>
                )}
              </div>
              <span className="text-white/30">vs</span>
              <div className="flex items-center gap-2">
                <span className="text-white">{theater.players.black}</span>
                {theater.players.blackRating && (
                  <span className="text-white/40 text-xs">({theater.players.blackRating})</span>
                )}
                <div className="w-3 h-3 rounded-full bg-gray-800 border border-white/20" />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Get the active chat room data
  const getActiveChatRoom = (): (RoomData & { cityId?: CityId; cityName?: string }) | null => {
    if (!openChat) return null;

    // First check allRoomsMap (for rooms from cities)
    const roomFromMap = allRoomsMap.get(openChat);
    if (roomFromMap) return roomFromMap;

    // Fallback: search in all cityRooms directly
    for (const cityId of Object.keys(cityRooms) as Exclude<CityId, 'my-bubble'>[]) {
      const room = cityRooms[cityId].find(r => r.id === openChat);
      if (room) {
        const city = cities.find(c => c.id === cityId);
        return { ...room, cityId, cityName: city?.name || '' };
      }
    }

    return null;
  };

  const activeChatRoom = getActiveChatRoom();
  const activeChatMessages = openChat ? (roomMessages[openChat] || []) : [];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Booking Actions */}
        <div className="lg:w-[220px] flex flex-col border-r border-white/5 bg-[#0a0a0a] p-4 space-y-3">
          {/* ChessFam Cities */}
          <div>
            <p className="text-xs text-white/40 mb-3">ChessFam Cities</p>
            <div className="flex flex-col gap-2">
              {cities.map(city => {
                const isSelected = selectedCity === city.id;
                const isMyBubble = city.id === 'my-bubble';

                // Don't show My ChessFam if not logged in
                if (isMyBubble && !user) return null;

                return (
                  <button
                    key={city.id}
                    onClick={() => setSelectedCity(city.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                      isSelected
                        ? 'bg-blue-500/20 border border-blue-500/50 text-blue-200'
                        : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <FlagIcon code={city.flagCode} size="sm" />
                    <span className="truncate">{city.name.replace(' ChessFam', '')}</span>
                    <span className={`ml-auto text-[10px] ${isSelected ? 'text-blue-300' : 'text-white/40'}`}>
                      {isMyBubble ? myBubbleActiveUsers : getCityActiveUsers(city.id as Exclude<CityId, 'my-bubble'>)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <h2 className="text-lg font-semibold text-white mb-2">Quick Actions</h2>

            <button
              onClick={() => navigate('/games')}
              className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Gamepad2 className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-white/90 font-medium text-sm">Schedule a Game</p>
                <p className="text-white/40 text-xs">Find opponents nearby</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/tournaments')}
              className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-white/90 font-medium text-sm">Book a Tournament</p>
                <p className="text-white/40 text-xs">Join upcoming events</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/masters')}
              className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-gold-500/20 flex items-center justify-center">
                <Crown className="w-4 h-4 text-gold-400" />
              </div>
              <div className="text-left">
                <p className="text-white/90 font-medium text-sm">Book a GM</p>
                <p className="text-white/40 text-xs">Learn from the best</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/challenges')}
              className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Swords className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-left">
                <p className="text-white/90 font-medium text-sm">Open Challenges</p>
                <p className="text-white/40 text-xs">Find opponents now</p>
              </div>
            </button>
          </div>

          {/* User actions */}
          <div className="mt-auto pt-4 border-t border-white/10">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="text-left flex-1">
                  <p className="text-white text-sm font-medium truncate">{user.name}</p>
                  <p className="text-white/50 text-xs">My Dashboard</p>
                </div>
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => openAuthModal('signup')}
                  className="w-full px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors text-sm"
                >
                  Sign Up Free
                </button>
                <button
                  onClick={() => openAuthModal('login')}
                  className="w-full px-4 py-2 border border-white/20 text-white font-medium rounded-lg hover:bg-white/10 transition-colors text-sm"
                >
                  Log In
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center - Main Grid */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto bg-[#0d0d0d]">
          {/* City header */}
          <motion.div
            key={selectedCity}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-4 flex-wrap"
          >
            <FlagIcon code={currentCity.flagCode} size="lg" />
            <h2 className="text-lg font-semibold text-white">{currentCity.name}</h2>
            <span className="text-xs text-white/40 ml-2">
              {selectedCity === 'my-bubble' ? myBubbleActiveUsers : getCityActiveUsers(selectedCity as Exclude<CityId, 'my-bubble'>)} players online
            </span>

            {/* Search button */}
            <button
              onClick={() => setShowSearch(true)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white/70 text-xs rounded-lg hover:bg-white/20 transition-colors"
            >
              <Search className="w-3 h-3" />
              <span className="hidden sm:inline">Search</span>
            </button>

            {/* My Bubble controls */}
            {selectedCity === 'my-bubble' && (
              <div className="flex items-center gap-2">
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

          {/* Grid content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCity}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* My Bubble with spatial grid */}
              {selectedCity === 'my-bubble' ? (
                isEditMode ? (
                  // Edit mode with drag and drop
                  (() => {
                    const occupiedBySpanning = new Set<number>();
                    myBubbleRooms.forEach(mbr => {
                      if (mbr.size > 1) {
                        const cells = getOccupiedCells(mbr.gridPosition, mbr.size);
                        cells.slice(1).forEach(cell => occupiedBySpanning.add(cell));
                      }
                    });

                    return (
                      <DndContext
                        sensors={sensors}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2 pl-2">
                          {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, cellIndex) => {
                            if (occupiedBySpanning.has(cellIndex)) return null;

                            const mbrAtPosition = myBubbleRooms.find(r => r.gridPosition === cellIndex);
                            const room = mbrAtPosition ? allRoomsMap.get(mbrAtPosition.roomId) : null;

                            const spanClass = mbrAtPosition?.size === 4
                              ? 'col-span-2 row-span-2'
                              : mbrAtPosition?.size === 2
                                ? 'col-span-2'
                                : '';

                            return (
                              <div key={`cell-${cellIndex}`} className={spanClass}>
                                <DroppableCell id={`cell-${cellIndex}`}>
                                  {room && mbrAtPosition ? (
                                    <DraggableItem id={mbrAtPosition.roomId}>
                                      <RoomCard room={room} showMessage isDraggable size={mbrAtPosition.size} />
                                    </DraggableItem>
                                  ) : null}
                                </DroppableCell>
                              </div>
                            );
                          })}
                        </div>
                        <DragOverlay dropAnimation={dropAnimationConfig}>
                          {activeRoom && activeMbr ? (
                            <div className="opacity-90 scale-105 shadow-2xl">
                              <RoomCard room={activeRoom} showMessage isDraggable size={activeMbr.size} />
                            </div>
                          ) : null}
                        </DragOverlay>
                      </DndContext>
                    );
                  })()
                ) : (
                  // View mode
                  (() => {
                    const occupiedBySpanning = new Set<number>();
                    myBubbleRooms.forEach(mbr => {
                      if (mbr.size > 1) {
                        const cells = getOccupiedCells(mbr.gridPosition, mbr.size);
                        cells.slice(1).forEach(cell => occupiedBySpanning.add(cell));
                      }
                    });

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, cellIndex) => {
                          if (occupiedBySpanning.has(cellIndex)) return null;

                          const mbrAtPosition = myBubbleRooms.find(r => r.gridPosition === cellIndex);
                          const room = mbrAtPosition ? allRoomsMap.get(mbrAtPosition.roomId) : null;

                          if (!room || !mbrAtPosition) {
                            return (
                              <button
                                key={`empty-${cellIndex}`}
                                onClick={() => setShowAddRoomModal(true)}
                                className="min-h-[120px] rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center gap-2 hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer group"
                              >
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                  <Plus className="w-4 h-4 text-white/30 group-hover:text-white/50" />
                                </div>
                                <span className="text-[10px] text-white/20 group-hover:text-white/40">Add community</span>
                              </button>
                            );
                          }

                          const spanClass = mbrAtPosition.size === 4
                            ? 'col-span-2 row-span-2'
                            : mbrAtPosition.size === 2
                              ? 'col-span-2'
                              : '';

                          return (
                            <div key={room.id} className={spanClass}>
                              <RoomCard room={room} showMessage={mbrAtPosition.size >= 1} size={mbrAtPosition.size} />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )
              ) : (
                // Other cities - CSS grid with theater + overflow for extra communities
                (() => {
                  const theater = cityTheaters[selectedCity as Exclude<CityId, 'my-bubble'>];
                  const ad = cityAds[selectedCity as Exclude<CityId, 'my-bubble'>];
                  const theaterStartCell = 5;
                  const theaterCells = new Set([5, 6, 9, 10]);
                  const adCell = 3;

                  // Calculate available cells in main grid (16 total - 4 theater - 1 ad = 11)
                  const reservedCells = theaterCells.size + (ad ? 1 : 0);
                  const mainGridCapacity = GRID_COLS * GRID_ROWS - reservedCells;

                  // Split rooms into main grid and overflow
                  const mainGridRooms = rooms.slice(0, mainGridCapacity);
                  const overflowRooms = rooms.slice(mainGridCapacity);

                  let roomIndex = 0;

                  return (
                    <>
                      {/* Main 4x4 grid with theater and ad */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, cellIndex) => {
                          if (cellIndex === theaterStartCell) {
                            return (
                              <div key="theater" className="col-span-2 row-span-2">
                                <TheaterBox theater={theater} />
                              </div>
                            );
                          }

                          if (theaterCells.has(cellIndex) && cellIndex !== theaterStartCell) return null;

                          if (cellIndex === adCell && ad) {
                            return (
                              <div
                                key="ad"
                                className="min-h-[120px] rounded-xl overflow-hidden relative group cursor-pointer border border-white/10 hover:border-gold-500/50 transition-all"
                              >
                                <img src={ad.image} alt={ad.title} className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                <div className="absolute top-2 right-2">
                                  <span className="text-[8px] text-white/50 bg-black/50 px-1.5 py-0.5 rounded">AD</span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                  <h4 className="text-white text-sm font-semibold truncate">{ad.title}</h4>
                                  <p className="text-white/70 text-xs truncate">{ad.subtitle}</p>
                                </div>
                              </div>
                            );
                          }

                          const room = mainGridRooms[roomIndex];
                          if (room) {
                            roomIndex++;
                            return <RoomCard key={room.id} room={room} showMessage />;
                          }

                          return (
                            <div key={`empty-${cellIndex}`} className="min-h-[120px] rounded-xl border border-white/5 bg-white/[0.02]" />
                          );
                        })}
                      </div>

                      {/* Overflow communities - additional rows */}
                      {overflowRooms.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-xs text-white/40 mb-3">More communities in this ChessFam</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {overflowRooms.map((room) => (
                              <RoomCard key={room.id} room={room} showMessage />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()
              )}

              {/* Empty state for My Bubble */}
              {selectedCity === 'my-bubble' && rooms.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Plus className="w-8 h-8 text-white/30" />
                  </div>
                  <p className="text-white/50 mb-4">Your ChessFam is empty</p>
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

        {/* Right Side - Chat + ChessFam Cities */}
        <div className="lg:w-[320px] xl:w-[360px] flex flex-col border-l border-white/5 bg-[#0a0a0a] lg:h-screen lg:sticky lg:top-0">
          {/* Pinned & Recent Chats */}
          {displayedChats.length > 0 && (
            <div className="p-3 border-b border-white/5">
              <p className="text-xs text-white/40 mb-2">Chats ({displayedChats.length}/{MAX_PINNED_CHATS})</p>
              <div className="flex flex-wrap gap-2">
                {displayedChats.map(roomId => {
                  const room = allRoomsMap.get(roomId);
                  if (!room) return null;
                  const isPinnedChat = pinnedChats.includes(roomId);
                  return (
                    <button
                      key={roomId}
                      onClick={() => { setOpenChat(roomId); addToRecentChats(roomId); }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        openChat === roomId
                          ? 'bg-blue-500 text-white'
                          : isPinnedChat
                            ? 'bg-yellow-500/20 text-yellow-200 hover:bg-yellow-500/30 border border-yellow-500/30'
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {isPinnedChat && <Pin className="w-3 h-3" />}
                      <span>{room.name}</span>
                      <span className="text-[10px] opacity-60">{room.users.length}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Chat or Welcome */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeChatRoom ? (
                <motion.div
                  key={openChat}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col h-full min-h-0"
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

                    {/* Visit button */}
                    <button
                      onClick={() => navigate(activeChatRoom.route)}
                      className="mt-3 text-xs text-blue-400 hover:text-blue-300"
                    >
                      Visit {activeChatRoom.linkedEntityType || 'page'} →
                    </button>
                  </div>

                  {/* Voice Channel */}
                  {user && openChat && (
                    <div className="px-4 py-2 border-b border-white/10">
                      <VoiceChannel
                        roomId={openChat}
                        roomName={activeChatRoom.name}
                        userId={String(user.id)}
                        userName={user.name || 'User'}
                        userAvatar={user.avatar}
                        isCompact={true}
                      />
                    </div>
                  )}

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {activeChatMessages.length === 0 ? (
                      <p className="text-xs text-white/30 text-center py-8">No messages yet. Be the first to say hi!</p>
                    ) : (
                      activeChatMessages.map((msg, i) => {
                        // Check if this is a real user message or sample message
                        const isRealUser = msg.realUser !== undefined;
                        const msgUser = isRealUser ? null : getUserById(msg.userId);
                        const displayName = isRealUser ? msg.realUser!.name : (msgUser?.name || 'Unknown');
                        const displayAvatar = isRealUser ? msg.realUser!.avatar : msgUser?.image;
                        const displayInitials = isRealUser
                          ? msg.realUser!.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                          : (msgUser?.initials || '?');
                        const avatarColor = isRealUser ? 'bg-blue-500' : (msgUser?.color || 'bg-gray-500');

                        return (
                          <div key={i} className="flex gap-2">
                            {displayAvatar ? (
                              <img
                                src={displayAvatar}
                                alt={displayName}
                                className={`w-8 h-8 rounded-full object-cover flex-shrink-0 ${!isRealUser ? 'cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all' : ''}`}
                                onClick={!isRealUser && msgUser ? (e) => handleAvatarClick(e, msg.userId) : undefined}
                              />
                            ) : (
                              <div
                                className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs flex-shrink-0 ${!isRealUser ? 'cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all' : ''}`}
                                onClick={!isRealUser && msgUser ? (e) => handleAvatarClick(e, msg.userId) : undefined}
                              >
                                {displayInitials}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span
                                  className={`text-sm font-medium text-white ${!isRealUser ? 'cursor-pointer hover:text-purple-400 transition-colors' : ''}`}
                                  onClick={!isRealUser && msgUser ? (e) => handleAvatarClick(e, msg.userId) : undefined}
                                >
                                  {displayName}
                                </span>
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

                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* User Profile Popup */}
      <AnimatePresence>
        {selectedUserPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            onClick={() => setSelectedUserPopup(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="absolute bg-[#1a1a1a] rounded-xl border border-white/10 shadow-xl overflow-hidden min-w-[200px]"
              style={{
                left: Math.min(selectedUserPopup.x - 100, window.innerWidth - 220),
                top: Math.min(selectedUserPopup.y, window.innerHeight - 200),
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const popupUser = getUserById(selectedUserPopup.userId);
                if (!popupUser) return null;
                return (
                  <>
                    <div className="p-4 border-b border-white/10 flex items-center gap-3">
                      <img
                        src={popupUser.image}
                        alt={popupUser.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="font-semibold text-white">{popupUser.name}</h4>
                        <p className="text-xs text-white/50">Chess Player</p>
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          navigate(`/player/${selectedUserPopup.userId}`);
                          setSelectedUserPopup(null);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-white/70 hover:bg-white/10 rounded-lg transition-colors text-left"
                      >
                        <Users className="w-4 h-4" />
                        <span className="text-sm">View Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          if (!user) {
                            openAuthModal('login');
                            setSelectedUserPopup(null);
                            return;
                          }
                          navigate('/messages', { state: { startChatWith: { id: selectedUserPopup.userId, name: popupUser.name, image: popupUser.image } } });
                          setSelectedUserPopup(null);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-white/70 hover:bg-white/10 rounded-lg transition-colors text-left"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">Send Message</span>
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                {(['new-york', 'london', 'barcelona', 'oslo', 'rest-of-world'] as const).map(cityId => {
                  const city = cities.find(c => c.id === cityId)!;
                  const availableRooms = cityRooms[cityId].filter(
                    room => !isRoomInMyBubble(room.id)
                  );

                  if (availableRooms.length === 0) return null;

                  return (
                    <div key={cityId} className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <FlagIcon code={city.flagCode} size="md" />
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
                                    <img
                                      key={uid}
                                      src={u.image}
                                      alt={u.name}
                                      className="w-4 h-4 rounded-full border border-[#1a1a1a] object-cover"
                                    />
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
                {(['new-york', 'london', 'barcelona', 'oslo', 'rest-of-world'] as const).every(
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

      {/* Community Search Modal */}
      <CommunitySearch
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        communities={getAllRooms().map(room => ({
          id: room.id,
          name: room.name,
          type: room.id.includes('tournament') ? 'tournament' as const :
                room.id.includes('club') ? 'club' as const : 'venue' as const,
          city: room.cityName,
          memberCount: room.memberCount,
          onlineCount: room.users.length,
          tags: room.tags || [],
        }))}
        cities={['New York', 'London', 'Barcelona', 'Oslo', 'Rest of World']}
        onSelectCommunity={(community) => {
          // Find the room and open its chat
          const room = getAllRooms().find(r => r.id === community.id);
          if (room) {
            setSelectedCity(room.cityId);
            setOpenChat(room.id);
          }
        }}
      />
    </div>
  );
};

export default HomeRoam;
