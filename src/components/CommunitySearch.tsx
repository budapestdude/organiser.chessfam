// Community search with filters for HomeRoam page
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Users, MapPin, Zap, Crown, Trophy,
  Calendar, ChevronDown, Check, Radio, SlidersHorizontal,
  Clock, TrendingUp
} from 'lucide-react';

// Filter types
type TimeControl = 'blitz' | 'rapid' | 'classical' | 'all';
type SortOption = 'popular' | 'active' | 'newest' | 'nearest';
type CommunityType = 'venue' | 'club' | 'tournament' | 'all';

interface FilterState {
  timeControl: TimeControl;
  communityType: CommunityType;
  hasGM: boolean;
  hasIM: boolean;
  isLive: boolean;
  city: string | null;
  sortBy: SortOption;
}

interface Community {
  id: string;
  name: string;
  type: 'venue' | 'club' | 'tournament';
  city: string;
  memberCount: number;
  onlineCount: number;
  tags: string[];
  imageUrl?: string;
}

interface CommunitySearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCommunity?: (community: Community) => void;
  communities: Community[];
  cities: string[];
}

const timeControlOptions: { value: TimeControl; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: null },
  { value: 'blitz', label: 'Blitz', icon: <Zap className="w-3 h-3" /> },
  { value: 'rapid', label: 'Rapid', icon: <Clock className="w-3 h-3" /> },
  { value: 'classical', label: 'Classical', icon: <Calendar className="w-3 h-3" /> },
];

const communityTypeOptions: { value: CommunityType; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'venue', label: 'Venues' },
  { value: 'club', label: 'Clubs' },
  { value: 'tournament', label: 'Tournaments' },
];

const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'popular', label: 'Most Popular', icon: <Users className="w-4 h-4" /> },
  { value: 'active', label: 'Most Active', icon: <Radio className="w-4 h-4" /> },
  { value: 'newest', label: 'Newest', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'nearest', label: 'Nearest', icon: <MapPin className="w-4 h-4" /> },
];

export const CommunitySearch: React.FC<CommunitySearchProps> = ({
  isOpen,
  onClose,
  onSelectCommunity,
  communities,
  cities,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    timeControl: 'all',
    communityType: 'all',
    hasGM: false,
    hasIM: false,
    isLive: false,
    city: null,
    sortBy: 'popular',
  });

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setShowFilters(false);
      setActiveDropdown(null);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

  // Filter and search communities
  const filteredCommunities = useMemo(() => {
    let results = [...communities];

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Time control filter
    if (filters.timeControl !== 'all') {
      results = results.filter(c => c.tags.includes(filters.timeControl));
    }

    // Community type filter
    if (filters.communityType !== 'all') {
      results = results.filter(c => c.type === filters.communityType);
    }

    // GM/IM filter
    if (filters.hasGM) {
      results = results.filter(c => c.tags.includes('gm-present'));
    }
    if (filters.hasIM) {
      results = results.filter(c => c.tags.includes('im-present'));
    }

    // Live filter
    if (filters.isLive) {
      results = results.filter(c => c.onlineCount > 0 || c.tags.includes('tournament-live'));
    }

    // City filter
    if (filters.city) {
      results = results.filter(c => c.city === filters.city);
    }

    // Sort
    switch (filters.sortBy) {
      case 'popular':
        results.sort((a, b) => b.memberCount - a.memberCount);
        break;
      case 'active':
        results.sort((a, b) => b.onlineCount - a.onlineCount);
        break;
      case 'newest':
        // Would use createdAt in real implementation
        break;
      case 'nearest':
        // Would use geolocation in real implementation
        break;
    }

    return results;
  }, [communities, query, filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.timeControl !== 'all') count++;
    if (filters.communityType !== 'all') count++;
    if (filters.hasGM) count++;
    if (filters.hasIM) count++;
    if (filters.isLive) count++;
    if (filters.city) count++;
    return count;
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      timeControl: 'all',
      communityType: 'all',
      hasGM: false,
      hasIM: false,
      isLive: false,
      city: null,
      sortBy: 'popular',
    });
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (activeDropdown) {
        setActiveDropdown(null);
      } else if (showFilters) {
        setShowFilters(false);
      } else {
        onClose();
      }
    }
  }, [activeDropdown, showFilters, onClose]);

  const DropdownButton = ({
    value,
    dropdownId,
    children
  }: {
    value: string;
    dropdownId: string;
    children: React.ReactNode;
  }) => (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setActiveDropdown(activeDropdown === dropdownId ? null : dropdownId);
        }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
          activeDropdown === dropdownId
            ? 'bg-purple-500 text-white'
            : 'bg-white/10 text-white/70 hover:bg-white/20'
        }`}
      >
        <span>{value}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${
          activeDropdown === dropdownId ? 'rotate-180' : ''
        }`} />
      </button>

      <AnimatePresence>
        {activeDropdown === dropdownId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-1 bg-[#252525] border border-white/10 rounded-lg overflow-hidden shadow-xl z-50 min-w-[160px]"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const FilterToggle = ({
    label,
    active,
    onClick,
    icon
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
    icon?: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-purple-500 text-white'
          : 'bg-white/10 text-white/70 hover:bg-white/20'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 pt-16 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            className="bg-[#1a1a1a] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Search Header */}
            <div className="p-4 border-b border-white/10">
              {/* Search Input */}
              <div className="relative mb-3">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search communities by name, city, or activity..."
                  className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 text-base"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                )}
              </div>

              {/* Filter Toggle */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    showFilters || activeFilterCount > 0
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Sort Dropdown */}
                <DropdownButton
                  value={sortOptions.find(o => o.value === filters.sortBy)?.label || 'Sort'}
                  dropdownId="sort"
                >
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilters({ ...filters, sortBy: option.value });
                        setActiveDropdown(null);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/10 transition-colors ${
                        filters.sortBy === option.value ? 'text-purple-400' : 'text-white/70'
                      }`}
                    >
                      {option.icon}
                      {option.label}
                      {filters.sortBy === option.value && <Check className="w-4 h-4 ml-auto" />}
                    </button>
                  ))}
                </DropdownButton>
              </div>
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-white/10 overflow-hidden"
                >
                  <div className="p-4 space-y-4">
                    {/* Time Control */}
                    <div>
                      <p className="text-xs text-white/40 mb-2">Time Control</p>
                      <div className="flex flex-wrap gap-2">
                        {timeControlOptions.map((option) => (
                          <FilterToggle
                            key={option.value}
                            label={option.label}
                            active={filters.timeControl === option.value}
                            onClick={() => setFilters({ ...filters, timeControl: option.value })}
                            icon={option.icon}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Community Type */}
                    <div>
                      <p className="text-xs text-white/40 mb-2">Type</p>
                      <div className="flex flex-wrap gap-2">
                        {communityTypeOptions.map((option) => (
                          <FilterToggle
                            key={option.value}
                            label={option.label}
                            active={filters.communityType === option.value}
                            onClick={() => setFilters({ ...filters, communityType: option.value })}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Special Filters */}
                    <div>
                      <p className="text-xs text-white/40 mb-2">Special</p>
                      <div className="flex flex-wrap gap-2">
                        <FilterToggle
                          label="GM Present"
                          active={filters.hasGM}
                          onClick={() => setFilters({ ...filters, hasGM: !filters.hasGM })}
                          icon={<Crown className="w-3 h-3" />}
                        />
                        <FilterToggle
                          label="IM Present"
                          active={filters.hasIM}
                          onClick={() => setFilters({ ...filters, hasIM: !filters.hasIM })}
                          icon={<Crown className="w-3 h-3" />}
                        />
                        <FilterToggle
                          label="Live Now"
                          active={filters.isLive}
                          onClick={() => setFilters({ ...filters, isLive: !filters.isLive })}
                          icon={<Radio className="w-3 h-3" />}
                        />
                      </div>
                    </div>

                    {/* City Filter */}
                    <div>
                      <p className="text-xs text-white/40 mb-2">City</p>
                      <div className="flex flex-wrap gap-2">
                        <FilterToggle
                          label="All Cities"
                          active={filters.city === null}
                          onClick={() => setFilters({ ...filters, city: null })}
                        />
                        {cities.map((city) => (
                          <FilterToggle
                            key={city}
                            label={city}
                            active={filters.city === city}
                            onClick={() => setFilters({ ...filters, city })}
                            icon={<MapPin className="w-3 h-3" />}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Clear Filters */}
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="text-sm text-purple-400 hover:text-purple-300"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto">
              {filteredCommunities.length > 0 ? (
                <div className="p-2">
                  <p className="px-3 py-2 text-xs text-white/40">
                    {filteredCommunities.length} {filteredCommunities.length === 1 ? 'community' : 'communities'} found
                  </p>
                  {filteredCommunities.map((community) => (
                    <button
                      key={community.id}
                      onClick={() => {
                        onSelectCommunity?.(community);
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      {/* Community Icon/Image */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        community.type === 'tournament'
                          ? 'bg-red-500/20'
                          : community.type === 'club'
                          ? 'bg-blue-500/20'
                          : 'bg-green-500/20'
                      }`}>
                        {community.imageUrl ? (
                          <img
                            src={community.imageUrl}
                            alt={community.name}
                            className="w-full h-full rounded-xl object-cover"
                          />
                        ) : community.type === 'tournament' ? (
                          <Trophy className="w-5 h-5 text-red-400" />
                        ) : community.type === 'club' ? (
                          <Users className="w-5 h-5 text-blue-400" />
                        ) : (
                          <MapPin className="w-5 h-5 text-green-400" />
                        )}
                      </div>

                      {/* Community Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium truncate">{community.name}</p>
                          {community.tags.includes('gm-present') && (
                            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] rounded">GM</span>
                          )}
                          {community.tags.includes('tournament-live') && (
                            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                              LIVE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-white/50">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {community.city}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {community.memberCount}
                          </span>
                          {community.onlineCount > 0 && (
                            <span className="flex items-center gap-1 text-green-400">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                              {community.onlineCount} online
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="hidden sm:flex flex-wrap gap-1 max-w-[120px]">
                        {community.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-white/10 text-white/50 text-[10px] rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Search className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50 mb-2">No communities found</p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-purple-400 hover:text-purple-300"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 px-4 py-3 flex items-center justify-between text-xs text-white/40">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Esc</kbd>
                  Close
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommunitySearch;
