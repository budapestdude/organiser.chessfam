import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Pencil, Trash2, Search, X, Check, XCircle, Clock, Calendar, DollarSign, Image as ImageIcon, Upload, Trash, PartyPopper, Plus } from 'lucide-react';
import { useStore } from '../../store';
import * as adminApi from '../../api/admin';
import { uploadsApi } from '../../api/uploads';

type TabType = 'pending' | 'all';

interface EarlyBirdTier {
  deadline: string;
  discount: number;
  discount_type: 'percentage' | 'fixed';
  label: string;
}

export default function AdminTournaments() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [pendingTournaments, setPendingTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [earlyBirdTiers, setEarlyBirdTiers] = useState<EarlyBirdTier[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [festivalEvents, setFestivalEvents] = useState<any[]>([]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedFestival, setSelectedFestival] = useState<any>(null);
  const [newEventForm, setNewEventForm] = useState<any>({});

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    await Promise.all([fetchTournaments(), fetchPendingTournaments()]);
  };

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllTournaments({ limit: 100, search: searchTerm });
      setTournaments(response.data.data.tournaments || []);
    } catch (error: any) {
      console.error('Error fetching tournaments:', error);
      alert(`Failed to fetch tournaments: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingTournaments = async () => {
    try {
      const response = await adminApi.getPendingTournaments();
      setPendingTournaments(response.data.tournaments || []);
    } catch (error: any) {
      console.error('Error fetching pending tournaments:', error);
    }
  };

  const handleApprove = async (tournamentId: number, tournamentName: string) => {
    if (!confirm(`Approve tournament "${tournamentName}"?`)) return;
    try {
      await adminApi.approveTournament(tournamentId);
      await fetchData();
      alert('Tournament approved successfully');
    } catch (error: any) {
      console.error('Error approving tournament:', error);
      alert(error.response?.data?.message || 'Failed to approve tournament');
    }
  };

  const handleReject = async (tournamentId: number, tournamentName: string) => {
    const reason = prompt(`Reject tournament "${tournamentName}"?\n\nEnter rejection reason (optional):`);
    if (reason === null) return;
    try {
      await adminApi.rejectTournament(tournamentId, reason || undefined);
      await fetchData();
      alert('Tournament rejected');
    } catch (error: any) {
      console.error('Error rejecting tournament:', error);
      alert(error.response?.data?.message || 'Failed to reject tournament');
    }
  };

  const openEditModal = (tournament: any) => {
    setSelectedTournament(tournament);
    setEditForm({
      name: tournament.name || '',
      description: tournament.description || '',
      tournament_type: tournament.tournament_type || '',
      time_control: tournament.time_control || '',
      format: tournament.format || '',
      start_date: tournament.start_date?.split('T')[0] || '',
      end_date: tournament.end_date?.split('T')[0] || '',
      registration_deadline: tournament.registration_deadline?.split('T')[0] || '',
      max_participants: tournament.max_participants || 0,
      entry_fee: tournament.entry_fee || 0,
      prize_pool: tournament.prize_pool || 0,
      currency: tournament.currency || 'USD',
      rating_min: tournament.rating_min || '',
      rating_max: tournament.rating_max || '',
      status: tournament.status || 'upcoming',
      external_registration_url: tournament.external_registration_url || '',
      premium_discount_eligible: tournament.premium_discount_eligible || false,
      image: tournament.image || '',
      images: tournament.images || [],
      rules: tournament.rules || '',
      junior_discount: tournament.junior_discount || 0,
      senior_discount: tournament.senior_discount || 0,
      women_discount: tournament.women_discount || 0,
      gm_wgm_discount: tournament.gm_wgm_discount || 0,
      im_wim_discount: tournament.im_wim_discount || 0,
      fm_wfm_discount: tournament.fm_wfm_discount || 0,
      junior_age_max: tournament.junior_age_max || '',
      senior_age_min: tournament.senior_age_min || '',
    });

    // Initialize early bird pricing
    if (tournament.early_bird_pricing && Array.isArray(tournament.early_bird_pricing)) {
      setEarlyBirdTiers(tournament.early_bird_pricing.map((tier: any) => ({
        deadline: tier.deadline?.split('T')[0] || '',
        discount: tier.discount || 0,
        discount_type: tier.discount_type || 'percentage',
        label: tier.label || ''
      })));
    } else {
      setEarlyBirdTiers([]);
    }

    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedTournament) return;
    setSubmitting(true);
    try {
      const updateData = {
        ...editForm,
        early_bird_pricing: earlyBirdTiers.filter(tier => tier.deadline && tier.discount > 0)
      };
      await adminApi.updateTournament(selectedTournament.id, updateData);
      setShowEditModal(false);
      await fetchData();
      alert('Tournament updated successfully');
    } catch (error: any) {
      console.error('Error updating tournament:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to update tournament';
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tournamentId: number, tournamentName: string) => {
    if (!confirm(`Are you sure you want to delete "${tournamentName}"? This will also delete all participant data.`)) {
      return;
    }
    try {
      await adminApi.deleteTournament(tournamentId);
      await fetchData();
      alert('Tournament deleted successfully');
    } catch (error: any) {
      console.error('Error deleting tournament:', error);
      alert(error.response?.data?.message || 'Failed to delete tournament');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const response = await uploadsApi.uploadImage(file);
      setEditForm({ ...editForm, image: response.url });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.some(file => file.size > 5 * 1024 * 1024)) {
      alert('Each image must be less than 5MB');
      return;
    }

    setUploadingGallery(true);
    try {
      const response = await uploadsApi.uploadImages(files);
      const newImages = response.files.map(file => file.url);
      setEditForm({ ...editForm, images: [...(editForm.images || []), ...newImages] });
    } catch (error) {
      console.error('Error uploading gallery images:', error);
      alert('Failed to upload some images');
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    const newImages = [...(editForm.images || [])];
    newImages.splice(index, 1);
    setEditForm({ ...editForm, images: newImages });
  };

  const addEarlyBirdTier = () => {
    if (earlyBirdTiers.length >= 3) {
      alert('Maximum 3 early bird tiers allowed');
      return;
    }
    setEarlyBirdTiers([...earlyBirdTiers, {
      deadline: '',
      discount: 0,
      discount_type: 'percentage',
      label: ''
    }]);
  };

  const updateEarlyBirdTier = (index: number, field: keyof EarlyBirdTier, value: any) => {
    const newTiers = [...earlyBirdTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setEarlyBirdTiers(newTiers);
  };

  const removeEarlyBirdTier = (index: number) => {
    setEarlyBirdTiers(earlyBirdTiers.filter((_, i) => i !== index));
  };

  // Festival Management Functions
  const handleConvertToFestival = async (tournamentId: number, tournamentName: string) => {
    if (!confirm(`Convert "${tournamentName}" to a festival? This will create a festival container and make this tournament the first event.`)) {
      return;
    }
    try {
      await adminApi.convertToFestival(tournamentId);
      await fetchData();
      alert('Tournament converted to festival successfully');
    } catch (error: any) {
      console.error('Error converting to festival:', error);
      alert(error.response?.data?.message || 'Failed to convert to festival');
    }
  };

  const openAddEventModal = async (festival: any) => {
    setSelectedFestival(festival);
    setNewEventForm({
      name: '',
      description: '',
      tournament_type: '',
      time_control: '',
      format: '',
      start_date: '',
      end_date: '',
      registration_deadline: '',
      max_participants: 0,
      entry_fee: 0,
      prize_pool: 0,
      currency: festival.currency || 'USD',
      rating_min: '',
      rating_max: '',
      venue_id: festival.venue_id
    });

    // Fetch existing events
    try {
      const response = await adminApi.getFestivalEvents(festival.id);
      setFestivalEvents(response.data || []);
    } catch (error) {
      console.error('Error fetching festival events:', error);
      setFestivalEvents([]);
    }

    setShowAddEventModal(true);
  };

  const handleCreateFestivalEvent = async () => {
    if (!selectedFestival || !newEventForm.name) {
      alert('Please fill in the event name');
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.createFestivalEvent(selectedFestival.id, newEventForm);
      setShowAddEventModal(false);
      await fetchData();
      alert('Festival event created successfully');
    } catch (error: any) {
      console.error('Error creating festival event:', error);
      alert(error.response?.data?.message || 'Failed to create festival event');
    } finally {
      setSubmitting(false);
    }
  };

  const displayedTournaments = activeTab === 'pending' ? pendingTournaments : tournaments;

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-7xl mx-auto">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/admin/dashboard')}
        className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-display font-bold text-white mb-2">Manage Tournaments</h1>
        <p className="text-white/60">Approve submissions and manage tournaments</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'pending'
              ? 'bg-gold-500 text-chess-darker'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingTournaments.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-gold-500 text-chess-darker'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            All Tournaments ({tournaments.length})
          </div>
        </button>
      </div>

      {activeTab === 'all' && (
        <div className="mb-6 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchTournaments()}
              placeholder="Search tournaments..."
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                       placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
            />
          </div>
          <button
            onClick={fetchTournaments}
            className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-lg
                     hover:bg-gold-400 transition-all"
          >
            Search
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-white/50">Loading tournaments...</div>
        </div>
      ) : displayedTournaments.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/50">
            {activeTab === 'pending' ? 'No pending tournaments' : 'No tournaments found'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayedTournaments.map((tournament) => (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{tournament.name}</h3>
                  <p className="text-sm text-white/60">{tournament.format} • {tournament.time_control}</p>
                  {tournament.organizer_name && (
                    <p className="text-xs text-white/50 mt-1">Organizer: {tournament.organizer_name}</p>
                  )}
                  {tournament.organizer_email && (
                    <p className="text-xs text-white/50">Email: {tournament.organizer_email}</p>
                  )}
                  {activeTab === 'pending' && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                      Pending Approval
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {activeTab === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApprove(tournament.id, tournament.name)}
                        className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all"
                        title="Approve tournament"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReject(tournament.id, tournament.name)}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                        title="Reject tournament"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => openEditModal(tournament)}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                        title="Edit tournament"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {tournament.is_festival_parent ? (
                        <button
                          onClick={() => openAddEventModal(tournament)}
                          className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all"
                          title="Add festival event"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      ) : !tournament.festival_id && !tournament.is_series_parent && (
                        <button
                          onClick={() => handleConvertToFestival(tournament.id, tournament.name)}
                          className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all"
                          title="Convert to festival"
                        >
                          <PartyPopper className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(tournament.id, tournament.name)}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                        title="Delete tournament"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="text-sm space-y-1">
                <p className="text-white/70">Date: {new Date(tournament.start_date).toLocaleDateString()}</p>
                <p className="text-white/70">Participants: {tournament.current_participants || 0}/{tournament.max_participants}</p>
                {tournament.prize_pool > 0 && (
                  <p className="text-white/70">Prize Pool: ${tournament.prize_pool}</p>
                )}
                {activeTab === 'all' && (
                  <p className="text-white/70">
                    Status: <span className={`capitalize ${
                      tournament.status === 'upcoming' ? 'text-blue-400' :
                      tournament.status === 'ongoing' ? 'text-green-400' :
                      tournament.status === 'completed' ? 'text-gray-400' : 'text-yellow-400'
                    }`}>
                      {tournament.status}
                    </span>
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* FULL SCREEN EDIT MODAL */}
      <AnimatePresence>
        {showEditModal && selectedTournament && (
          <div className="fixed inset-0 bg-black/90 flex items-start justify-center z-50 overflow-y-auto py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-chess-darker border border-white/10 rounded-2xl w-full max-w-6xl mx-4 mb-8"
            >
              {/* Header */}
              <div className="sticky top-0 bg-chess-darker border-b border-white/10 px-8 py-6 rounded-t-2xl flex items-center justify-between z-10">
                <h2 className="text-3xl font-bold text-white">Edit Tournament</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="px-8 py-6 space-y-8">
                {/* Basic Information */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-gold-400" />
                    Basic Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Tournament Name *</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                                 focus:outline-none focus:border-gold-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-white/70 mb-2">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                                 focus:outline-none focus:border-gold-500/50"
                        placeholder="Describe the tournament..."
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-white/70 mb-2">Tournament Type</label>
                        <select
                          value={editForm.tournament_type}
                          onChange={(e) => setEditForm({ ...editForm, tournament_type: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                                   focus:outline-none focus:border-gold-500/50"
                        >
                          <option value="">Select type...</option>
                          <option value="Classical">Classical</option>
                          <option value="Rapid">Rapid</option>
                          <option value="Blitz">Blitz</option>
                          <option value="Bullet">Bullet</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-white/70 mb-2">Format</label>
                        <input
                          type="text"
                          value={editForm.format}
                          onChange={(e) => setEditForm({ ...editForm, format: e.target.value })}
                          placeholder="e.g., Swiss, Round Robin"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30
                                   focus:outline-none focus:border-gold-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/70 mb-2">Time Control</label>
                        <input
                          type="text"
                          value={editForm.time_control}
                          onChange={(e) => setEditForm({ ...editForm, time_control: e.target.value })}
                          placeholder="e.g., 90+30"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30
                                   focus:outline-none focus:border-gold-500/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gold-400" />
                    Dates & Deadlines
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Start Date *</label>
                      <input
                        type="date"
                        value={editForm.start_date}
                        onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                                 focus:outline-none focus:border-gold-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-2">End Date</label>
                      <input
                        type="date"
                        value={editForm.end_date}
                        onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                                 focus:outline-none focus:border-gold-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Registration Deadline</label>
                      <input
                        type="date"
                        value={editForm.registration_deadline}
                        onChange={(e) => setEditForm({ ...editForm, registration_deadline: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                                 focus:outline-none focus:border-gold-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Participants & Fees */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-gold-400" />
                    Participants & Fees
                  </h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Max Participants</label>
                      <input
                        type="number"
                        value={editForm.max_participants}
                        onChange={(e) => setEditForm({ ...editForm, max_participants: parseInt(e.target.value) || 0 })}
                        min={0}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                                 focus:outline-none focus:border-gold-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Currency</label>
                      <select
                        value={editForm.currency}
                        onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                                 focus:outline-none focus:border-gold-500/50"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD ($)</option>
                        <option value="AUD">AUD ($)</option>
                        <option value="INR">INR (₹)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Entry Fee</label>
                      <input
                        type="number"
                        value={editForm.entry_fee}
                        onChange={(e) => setEditForm({ ...editForm, entry_fee: parseFloat(e.target.value) || 0 })}
                        min={0}
                        step={0.01}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                                 focus:outline-none focus:border-gold-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Prize Pool</label>
                      <input
                        type="number"
                        value={editForm.prize_pool}
                        onChange={(e) => setEditForm({ ...editForm, prize_pool: parseFloat(e.target.value) || 0 })}
                        min={0}
                        step={0.01}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                                 focus:outline-none focus:border-gold-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Min Rating</label>
                      <input
                        type="number"
                        value={editForm.rating_min}
                        onChange={(e) => setEditForm({ ...editForm, rating_min: e.target.value })}
                        placeholder="Optional"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30
                                 focus:outline-none focus:border-gold-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Max Rating</label>
                      <input
                        type="number"
                        value={editForm.rating_max}
                        onChange={(e) => setEditForm({ ...editForm, rating_max: e.target.value })}
                        placeholder="Optional"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30
                                 focus:outline-none focus:border-gold-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-gold-400" />
                    Images
                  </h3>

                  {/* Main Image */}
                  <div className="mb-6">
                    <label className="block text-sm text-white/70 mb-2">Main Tournament Image</label>
                    {editForm.image ? (
                      <div className="relative w-full h-48 rounded-xl overflow-hidden border border-white/10 mb-2">
                        <img
                          src={editForm.image}
                          alt="Tournament"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setEditForm({ ...editForm, image: '' })}
                          className="absolute top-2 right-2 p-2 bg-red-500/80 rounded-lg hover:bg-red-500 transition-all"
                        >
                          <Trash className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="block w-full h-48 border-2 border-dashed border-white/20 rounded-xl hover:border-gold-500/50 transition-all cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                        <div className="w-full h-full flex flex-col items-center justify-center text-white/40">
                          {uploadingImage ? (
                            <div className="text-gold-400">Uploading...</div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 mb-2" />
                              <span className="text-sm">Click to upload image</span>
                              <span className="text-xs mt-1">Max 5MB</span>
                            </>
                          )}
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Gallery Images */}
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Gallery Images (Optional)</label>
                    {editForm.images && editForm.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        {editForm.images.map((img: string, idx: number) => (
                          <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-white/10">
                            <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              onClick={() => removeGalleryImage(idx)}
                              className="absolute top-1 right-1 p-1 bg-red-500/80 rounded hover:bg-red-500 transition-all"
                            >
                              <Trash className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="block w-full py-3 px-4 border-2 border-dashed border-white/20 rounded-xl hover:border-gold-500/50 transition-all cursor-pointer text-center text-white/60 text-sm">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryUpload}
                        className="hidden"
                        disabled={uploadingGallery}
                      />
                      {uploadingGallery ? 'Uploading...' : '+ Add Gallery Images'}
                    </label>
                  </div>
                </div>

                {/* Early Bird Pricing */}
                {editForm.entry_fee > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Early Bird Pricing (Optional)</h3>
                    {earlyBirdTiers.map((tier, index) => (
                      <div key={index} className="bg-white/5 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white font-medium">Tier {index + 1}</span>
                          <button
                            onClick={() => removeEarlyBirdTier(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Label</label>
                            <input
                              type="text"
                              value={tier.label}
                              onChange={(e) => updateEarlyBirdTier(index, 'label', e.target.value)}
                              placeholder="Super Early Bird"
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Deadline</label>
                            <input
                              type="date"
                              value={tier.deadline}
                              onChange={(e) => updateEarlyBirdTier(index, 'deadline', e.target.value)}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Discount Type</label>
                            <select
                              value={tier.discount_type}
                              onChange={(e) => updateEarlyBirdTier(index, 'discount_type', e.target.value)}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                            >
                              <option value="percentage">Percentage</option>
                              <option value="fixed">Fixed Amount</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Discount</label>
                            <input
                              type="number"
                              value={tier.discount}
                              onChange={(e) => updateEarlyBirdTier(index, 'discount', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {earlyBirdTiers.length < 3 && (
                      <button
                        onClick={addEarlyBirdTier}
                        className="w-full py-2 border-2 border-dashed border-white/20 rounded-xl text-white/60 hover:border-gold-500/50 hover:text-gold-400 transition-all"
                      >
                        + Add Early Bird Tier
                      </button>
                    )}
                  </div>
                )}

                {/* Discounts */}
                {editForm.entry_fee > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Player Discounts (Optional)</h3>
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-white/5 rounded-xl p-4">
                        <h4 className="text-white font-medium mb-2">Junior Players</h4>
                        <input
                          type="number"
                          value={editForm.junior_discount}
                          onChange={(e) => setEditForm({ ...editForm, junior_discount: parseFloat(e.target.value) || 0 })}
                          min={0}
                          max={100}
                          placeholder="% discount"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                        />
                        <input
                          type="number"
                          value={editForm.junior_age_max}
                          onChange={(e) => setEditForm({ ...editForm, junior_age_max: e.target.value })}
                          placeholder="Max age (default 18)"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm mt-2"
                        />
                      </div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <h4 className="text-white font-medium mb-2">Senior Players</h4>
                        <input
                          type="number"
                          value={editForm.senior_discount}
                          onChange={(e) => setEditForm({ ...editForm, senior_discount: parseFloat(e.target.value) || 0 })}
                          min={0}
                          max={100}
                          placeholder="% discount"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                        />
                        <input
                          type="number"
                          value={editForm.senior_age_min}
                          onChange={(e) => setEditForm({ ...editForm, senior_age_min: e.target.value })}
                          placeholder="Min age (default 65)"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm mt-2"
                        />
                      </div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <h4 className="text-white font-medium mb-2">Women Players</h4>
                        <input
                          type="number"
                          value={editForm.women_discount}
                          onChange={(e) => setEditForm({ ...editForm, women_discount: parseFloat(e.target.value) || 0 })}
                          min={0}
                          max={100}
                          placeholder="% discount"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                        />
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                      <h4 className="text-white font-medium mb-3">Titled Player Discounts</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white/5 rounded-xl p-4">
                          <h5 className="text-gold-400 font-medium mb-2">GM / WGM</h5>
                          <input
                            type="number"
                            value={editForm.gm_wgm_discount}
                            onChange={(e) => setEditForm({ ...editForm, gm_wgm_discount: parseFloat(e.target.value) || 0 })}
                            min={0}
                            max={100}
                            placeholder="% discount"
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                          />
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                          <h5 className="text-orange-400 font-medium mb-2">IM / WIM</h5>
                          <input
                            type="number"
                            value={editForm.im_wim_discount}
                            onChange={(e) => setEditForm({ ...editForm, im_wim_discount: parseFloat(e.target.value) || 0 })}
                            min={0}
                            max={100}
                            placeholder="% discount"
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                          />
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                          <h5 className="text-blue-400 font-medium mb-2">FM / WFM</h5>
                          <input
                            type="number"
                            value={editForm.fm_wfm_discount}
                            onChange={(e) => setEditForm({ ...editForm, fm_wfm_discount: parseFloat(e.target.value) || 0 })}
                            min={0}
                            max={100}
                            placeholder="% discount"
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rules & Settings */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Additional Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Tournament Rules</label>
                      <textarea
                        value={editForm.rules}
                        onChange={(e) => setEditForm({ ...editForm, rules: e.target.value })}
                        rows={4}
                        placeholder="Enter tournament rules, regulations, and important information..."
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30
                                 focus:outline-none focus:border-gold-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-white/70 mb-2">External Registration URL</label>
                      <input
                        type="url"
                        value={editForm.external_registration_url}
                        onChange={(e) => setEditForm({ ...editForm, external_registration_url: e.target.value })}
                        placeholder="https://example.com/register"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30
                                 focus:outline-none focus:border-gold-500/50"
                      />
                      <p className="text-xs text-white/40 mt-1">
                        If set, users will be redirected to this URL instead of using internal registration
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm text-white/70 mb-2">Status</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                                 focus:outline-none focus:border-gold-500/50"
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.premium_discount_eligible}
                          onChange={(e) => setEditForm({ ...editForm, premium_discount_eligible: e.target.checked })}
                          className="w-5 h-5 rounded border-white/20 bg-white/5 text-gold-500"
                        />
                        <div>
                          <span className="text-white font-medium">Premium Discount Eligible</span>
                          <p className="text-xs text-white/50">Premium members get 10% off entry fee</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="sticky bottom-0 bg-chess-darker border-t border-white/10 px-8 py-6 rounded-b-2xl flex gap-4">
                <button
                  onClick={handleUpdate}
                  disabled={submitting}
                  className="flex-1 py-4 bg-gold-500 text-chess-darker font-semibold rounded-xl
                           hover:bg-gold-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Updating...' : 'Update Tournament'}
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-8 py-4 bg-white/5 text-white/70 font-semibold rounded-xl
                           hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Festival Event Modal */}
      <AnimatePresence>
        {showAddEventModal && selectedFestival && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-chess-darker border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-chess-darker border-b border-white/10 px-6 py-4 rounded-t-2xl flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Add Event to {selectedFestival.name}</h2>
                <button
                  onClick={() => setShowAddEventModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Existing Events */}
              {festivalEvents.length > 0 && (
                <div className="px-6 py-4 border-b border-white/10">
                  <h3 className="text-sm font-semibold text-white/70 mb-3">Existing Events ({festivalEvents.length}/10)</h3>
                  <div className="space-y-2">
                    {festivalEvents.map((event: any) => (
                      <div key={event.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{event.name}</p>
                          <p className="text-sm text-white/50">{event.tournament_type} · {event.entry_fee} {event.currency}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Event Form */}
              <div className="px-6 py-4 space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">New Event Details</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm text-white/70 mb-2">Event Name *</label>
                    <input
                      type="text"
                      value={newEventForm.name}
                      onChange={(e) => setNewEventForm({ ...newEventForm, name: e.target.value })}
                      placeholder="e.g., Open Event, Blitz, Rapid"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                               focus:outline-none focus:border-gold-500/50"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm text-white/70 mb-2">Description</label>
                    <textarea
                      value={newEventForm.description}
                      onChange={(e) => setNewEventForm({ ...newEventForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                               focus:outline-none focus:border-gold-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-2">Tournament Type</label>
                    <select
                      value={newEventForm.tournament_type}
                      onChange={(e) => setNewEventForm({ ...newEventForm, tournament_type: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                               focus:outline-none focus:border-gold-500/50"
                    >
                      <option value="">Select type</option>
                      <option value="Classical">Classical</option>
                      <option value="Rapid">Rapid</option>
                      <option value="Blitz">Blitz</option>
                      <option value="Bullet">Bullet</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-2">Time Control</label>
                    <input
                      type="text"
                      value={newEventForm.time_control}
                      onChange={(e) => setNewEventForm({ ...newEventForm, time_control: e.target.value })}
                      placeholder="e.g., 90+30"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                               focus:outline-none focus:border-gold-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={newEventForm.start_date}
                      onChange={(e) => setNewEventForm({ ...newEventForm, start_date: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                               focus:outline-none focus:border-gold-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-2">End Date</label>
                    <input
                      type="date"
                      value={newEventForm.end_date}
                      onChange={(e) => setNewEventForm({ ...newEventForm, end_date: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                               focus:outline-none focus:border-gold-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-2">Entry Fee</label>
                    <input
                      type="number"
                      value={newEventForm.entry_fee}
                      onChange={(e) => setNewEventForm({ ...newEventForm, entry_fee: parseFloat(e.target.value) || 0 })}
                      min={0}
                      step={0.01}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                               focus:outline-none focus:border-gold-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-2">Max Participants</label>
                    <input
                      type="number"
                      value={newEventForm.max_participants}
                      onChange={(e) => setNewEventForm({ ...newEventForm, max_participants: parseInt(e.target.value) || 0 })}
                      min={0}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                               focus:outline-none focus:border-gold-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="sticky bottom-0 bg-chess-darker border-t border-white/10 px-6 py-4 rounded-b-2xl flex gap-4">
                <button
                  onClick={handleCreateFestivalEvent}
                  disabled={submitting || festivalEvents.length >= 10}
                  className="flex-1 py-3 bg-purple-500 text-white font-semibold rounded-xl
                           hover:bg-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Event'}
                </button>
                <button
                  onClick={() => setShowAddEventModal(false)}
                  className="px-6 py-3 bg-white/5 text-white/70 font-semibold rounded-xl
                           hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
