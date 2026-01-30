import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Plus, X, Save, Check, AlertCircle, Trophy, Coffee, Dumbbell } from 'lucide-react';
import { clubEventsApi, type ClubEvent, type CreateEventInput, type EventAttendee } from '../api/clubEvents';
import { useStore } from '../store';

interface ClubEventsProps {
  clubId: number;
  isMember: boolean;
  canManageEvents: boolean; // admins and owners
}

const ClubEvents = ({ clubId, isMember, canManageEvents }: ClubEventsProps) => {
  const { user, openAuthModal } = useStore();
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [formData, setFormData] = useState<CreateEventInput>({
    title: '',
    description: '',
    event_type: 'meetup',
    start_time: '',
    end_time: '',
    location: '',
    max_participants: undefined,
    is_members_only: true,
  });

  useEffect(() => {
    fetchEvents();
  }, [clubId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await clubEventsApi.getClubEvents(clubId);
      setEvents(response.data || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.start_time || !formData.end_time) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await clubEventsApi.createEvent(clubId, formData);
      setShowCreateModal(false);
      resetForm();
      fetchEvents();
      alert('Event created successfully!');
    } catch (error: any) {
      console.error('Failed to create event:', error);
      alert(error.response?.data?.error || 'Failed to create event');
    }
  };

  const handleRSVP = async (eventId: number, status: 'going' | 'maybe' | 'not_going') => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    try {
      await clubEventsApi.rsvpToEvent(eventId, status);
      fetchEvents();
      if (selectedEvent?.id === eventId) {
        fetchEventAttendees(eventId);
      }
    } catch (error: any) {
      console.error('Failed to RSVP:', error);
      alert(error.response?.data?.error || 'Failed to RSVP to event');
    }
  };

  const fetchEventAttendees = async (eventId: number) => {
    try {
      const response = await clubEventsApi.getAttendees(eventId);
      setAttendees(response.data || []);
    } catch (error) {
      console.error('Failed to fetch attendees:', error);
    }
  };

  const handleViewEvent = (event: ClubEvent) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
    fetchEventAttendees(event.id);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: 'meetup',
      start_time: '',
      end_time: '',
      location: '',
      max_participants: undefined,
      is_members_only: true,
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'tournament':
        return <Trophy className="w-5 h-5 text-gold-400" />;
      case 'training':
        return <Dumbbell className="w-5 h-5 text-blue-400" />;
      case 'social':
        return <Coffee className="w-5 h-5 text-purple-400" />;
      default:
        return <Calendar className="w-5 h-5 text-green-400" />;
    }
  };

  const getRSVPColor = (status?: string) => {
    switch (status) {
      case 'going':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'maybe':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'not_going':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-white/5 text-white/60 border-white/10';
    }
  };

  const upcomingEvents = events.filter(e => new Date(e.start_time) >= new Date());
  const pastEvents = events.filter(e => new Date(e.start_time) < new Date());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gold-400" />
          Club Events
        </h3>
        {canManageEvents && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker font-semibold rounded-xl hover:from-gold-400 hover:to-gold-500 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        )}
      </div>

      {/* Upcoming Events */}
      <div>
        <h4 className="text-lg font-medium text-white mb-4">Upcoming Events</h4>
        {upcomingEvents.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
            <Calendar className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all cursor-pointer"
                onClick={() => handleViewEvent(event)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getEventIcon(event.event_type)}
                      <h5 className="text-lg font-semibold text-white">{event.title}</h5>
                      <span className="px-2 py-1 rounded-full text-xs bg-white/10 text-white/60 capitalize">
                        {event.event_type}
                      </span>
                    </div>

                    {event.description && (
                      <p className="text-white/70 text-sm mb-3">{event.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(event.start_time).toLocaleString()}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {event.attendee_count || 0} attending
                        {event.max_participants && ` / ${event.max_participants}`}
                      </div>
                    </div>
                  </div>

                  {isMember && (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleRSVP(event.id, 'going')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                          event.rsvp_status === 'going'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        Going
                      </button>
                      <button
                        onClick={() => handleRSVP(event.id, 'maybe')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                          event.rsvp_status === 'maybe'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        <AlertCircle className="w-4 h-4" />
                        Maybe
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-white mb-4">Past Events</h4>
          <div className="space-y-3">
            {pastEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4 opacity-60 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => handleViewEvent(event)}
              >
                <div className="flex items-center gap-3 mb-2">
                  {getEventIcon(event.event_type)}
                  <h5 className="font-medium text-white">{event.title}</h5>
                </div>
                <div className="text-sm text-white/60">
                  {new Date(event.start_time).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-chess-darker border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-chess-darker border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <h3 className="text-2xl font-display font-bold text-white">Create Event</h3>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Event Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Event Type *</label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value as any })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none"
                  >
                    <option value="meetup">Meetup</option>
                    <option value="tournament">Tournament</option>
                    <option value="social">Social</option>
                    <option value="training">Training</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Start Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">End Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                    placeholder="123 Main St, City"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Max Participants (optional)</label>
                  <input
                    type="number"
                    value={formData.max_participants || ''}
                    onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || undefined })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                    min="1"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="members-only"
                    checked={formData.is_members_only}
                    onChange={(e) => setFormData({ ...formData, is_members_only: e.target.checked })}
                    className="w-5 h-5 rounded border-white/10 bg-white/5 text-gold-500 focus:ring-gold-500"
                  />
                  <label htmlFor="members-only" className="text-white/70">
                    Members only event
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-white/70 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker font-semibold rounded-xl hover:from-gold-400 hover:to-gold-500 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Create Event
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {showEventDetail && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEventDetail(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-chess-darker border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-chess-darker border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <h3 className="text-2xl font-display font-bold text-white">{selectedEvent.title}</h3>
                <button onClick={() => setShowEventDetail(false)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {selectedEvent.description && (
                  <p className="text-white/70">{selectedEvent.description}</p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-white/70">
                    <Calendar className="w-5 h-5" />
                    <span>{new Date(selectedEvent.start_time).toLocaleString()} - {new Date(selectedEvent.end_time).toLocaleString()}</span>
                  </div>
                  {selectedEvent.location && (
                    <div className="flex items-center gap-3 text-white/70">
                      <MapPin className="w-5 h-5" />
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-white/70">
                    <Users className="w-5 h-5" />
                    <span>{attendees.length} attending{selectedEvent.max_participants && ` / ${selectedEvent.max_participants} max`}</span>
                  </div>
                </div>

                {/* Attendees */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Attendees</h4>
                  <div className="space-y-2">
                    {attendees.filter(a => a.status === 'going').map((attendee) => (
                      <div key={attendee.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <img
                          src={attendee.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${attendee.name}`}
                          alt={attendee.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="text-white font-medium">{attendee.name}</div>
                          {attendee.rating && <div className="text-sm text-white/50">Rating: {attendee.rating}</div>}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs border ${getRSVPColor(attendee.status)}`}>
                          {attendee.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClubEvents;
