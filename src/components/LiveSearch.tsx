// Search component for the live page - communities and users
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Users, MapPin, Radio, Hash, User, Loader2 } from 'lucide-react';
import { Avatar } from './Avatar';
import { communitiesApi } from '../api/live';
import type { EventTag } from '../types/live';
import { EVENT_TAG_LABELS, EVENT_TAG_COLORS } from '../types/live';
import { searchLimiter } from '../lib/sanitize';

interface SearchResult {
  type: 'community' | 'user' | 'tag';
  id: string;
  name: string;
  subtitle?: string;
  imageUrl?: string;
  meta?: {
    memberCount?: number;
    onlineCount?: number;
    city?: string;
    tag?: EventTag;
  };
}

interface LiveSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (result: SearchResult) => void;
  placeholder?: string;
  filterType?: 'all' | 'community' | 'user' | 'tag';
}

export const LiveSearch: React.FC<LiveSearchProps> = ({
  isOpen,
  onClose,
  onSelect,
  placeholder = 'Search communities, users, or tags...',
  filterType = 'all',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      loadRecentSearches();
    } else {
      setQuery('');
      setResults([]);
      setActiveIndex(0);
    }
  }, [isOpen]);

  // Load recent searches from localStorage
  const loadRecentSearches = () => {
    try {
      const stored = localStorage.getItem('live-recent-searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch {
      // Ignore errors
    }
  };

  // Save search to recent
  const saveRecentSearch = (searchQuery: string) => {
    try {
      const stored = localStorage.getItem('live-recent-searches');
      const recent = stored ? JSON.parse(stored) : [];
      const updated = [searchQuery, ...recent.filter((s: string) => s !== searchQuery)].slice(0, 10);
      localStorage.setItem('live-recent-searches', JSON.stringify(updated));
    } catch {
      // Ignore errors
    }
  };

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Rate limiting check
    if (!searchLimiter.isAllowed('live-search')) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const searchResults: SearchResult[] = [];

        // Search communities
        if (filterType === 'all' || filterType === 'community') {
          const communities = await communitiesApi.getAll({ limit: 10 });
          const filtered = communities.filter((c) =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.slug.toLowerCase().includes(query.toLowerCase()) ||
            c.city?.toLowerCase().includes(query.toLowerCase())
          );

          searchResults.push(
            ...filtered.map((c) => ({
              type: 'community' as const,
              id: c.id,
              name: c.name,
              subtitle: c.description?.slice(0, 60),
              imageUrl: c.imageUrl,
              meta: {
                memberCount: c.memberCount,
                onlineCount: c.onlineCount,
                city: c.city,
              },
            }))
          );
        }

        // Search by tags
        if (filterType === 'all' || filterType === 'tag') {
          const allTags: EventTag[] = ['blitz', 'rapid', 'classical', 'gm-present', 'im-present', 'tournament-live', 'lesson', 'simul', 'open-play'];
          const matchingTags = allTags.filter((tag) =>
            EVENT_TAG_LABELS[tag].toLowerCase().includes(query.toLowerCase()) ||
            tag.includes(query.toLowerCase())
          );

          searchResults.push(
            ...matchingTags.map((tag) => ({
              type: 'tag' as const,
              id: tag,
              name: EVENT_TAG_LABELS[tag],
              subtitle: `Filter by ${EVENT_TAG_LABELS[tag]} events`,
              meta: { tag },
            }))
          );
        }

        setResults(searchResults.slice(0, 15));
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, filterType]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[activeIndex]) {
          handleSelect(results[activeIndex]);
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  }, [results, activeIndex, onClose]);

  const handleSelect = (result: SearchResult) => {
    saveRecentSearch(query);

    if (onSelect) {
      onSelect(result);
    } else {
      // Default navigation behavior
      switch (result.type) {
        case 'community':
          // Navigate to community or trigger chat open
          break;
        case 'tag':
          // Filter by tag
          break;
        case 'user':
          // View user profile
          break;
      }
    }

    onClose();
  };

  const clearRecentSearches = () => {
    localStorage.removeItem('live-recent-searches');
    setRecentSearches([]);
  };

  const getResultIcon = (result: SearchResult) => {
    switch (result.type) {
      case 'community':
        return <Users className="w-4 h-4 text-purple-400" />;
      case 'user':
        return <User className="w-4 h-4 text-blue-400" />;
      case 'tag':
        return <Hash className="w-4 h-4 text-green-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 pt-20 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            className="bg-gray-800 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full pl-12 pr-12 py-4 bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
              {loading && (
                <Loader2 className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400 animate-spin" />
              )}
            </div>

            <div className="border-t border-gray-700" />

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {query ? (
                results.length > 0 ? (
                  <div className="py-2">
                    {results.map((result, index) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleSelect(result)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 transition-colors ${
                          index === activeIndex ? 'bg-gray-700/50' : ''
                        }`}
                      >
                        {result.type === 'community' && result.imageUrl ? (
                          <Avatar src={result.imageUrl} name={result.name} size="sm" />
                        ) : result.type === 'tag' && result.meta?.tag ? (
                          <div className={`w-8 h-8 rounded-full ${EVENT_TAG_COLORS[result.meta.tag]} flex items-center justify-center`}>
                            <Hash className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                            {getResultIcon(result)}
                          </div>
                        )}

                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-white font-medium truncate">{result.name}</p>
                          {result.subtitle && (
                            <p className="text-sm text-gray-400 truncate">{result.subtitle}</p>
                          )}
                        </div>

                        {result.meta && (
                          <div className="flex items-center gap-3 text-sm text-gray-400">
                            {result.meta.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {result.meta.city}
                              </span>
                            )}
                            {result.meta.onlineCount !== undefined && (
                              <span className="flex items-center gap-1 text-green-400">
                                <Radio className="w-3 h-3" />
                                {result.meta.onlineCount}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : !loading ? (
                  <div className="py-8 text-center">
                    <Search className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400">No results found for "{query}"</p>
                  </div>
                ) : null
              ) : recentSearches.length > 0 ? (
                <div className="py-2">
                  <div className="flex items-center justify-between px-4 py-2">
                    <p className="text-sm text-gray-500">Recent searches</p>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-gray-500 hover:text-gray-400"
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(search)}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-700/50 transition-colors text-left"
                    >
                      <Search className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-300">{search}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Search className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">Search for communities, users, or tags</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-700 px-4 py-3 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">Esc</kbd>
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

// Inline search bar component for embedding in pages
interface SearchBarProps {
  onSearch?: (query: string) => void;
  onOpenFullSearch?: () => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onOpenFullSearch,
  placeholder = 'Search...',
  className = '',
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && onSearch) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClick={onOpenFullSearch}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
      />
    </form>
  );
};

export default LiveSearch;
