import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Mail, Building2, Clock, CheckSquare, Loader2, CheckCircle } from 'lucide-react';
import { useStore } from '../store';
import { venuesApi, type CreateVenueSubmissionRequest } from '../api/venues';
import ImageUpload from '../components/ImageUpload';
import ImageGalleryUpload from '../components/ImageGalleryUpload';

const VENUE_TYPES = [
  { value: 'park', label: 'Park' },
  { value: 'cafe', label: 'Café' },
  { value: 'club', label: 'Chess Club' },
  { value: 'community_center', label: 'Community Center' },
  { value: 'other', label: 'Other' }
];

const COMMON_AMENITIES = [
  'Free WiFi',
  'Restrooms',
  'Parking',
  'Food & Drinks',
  'Chess Sets Available',
  'Chess Clocks',
  'Outdoor Seating',
  'Indoor Seating',
  'Air Conditioning',
  'Wheelchair Accessible'
];

export default function EditVenue() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, openAuthModal } = useStore();

  const [fetchLoading, setFetchLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CreateVenueSubmissionRequest>({
    venue_name: '',
    venue_type: 'park',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    opening_hours: '',
    image_url: '',
    images: [],
    contact_person_name: '',
    contact_person_phone: ''
  });

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!id) {
      navigate('/locations');
      return;
    }

    const fetchVenue = async () => {
      try {
        setFetchLoading(true);
        const response = await venuesApi.getVenueById(parseInt(id));
        const venueData = response.data;

        // Check if user is the owner
        if (venueData.owner_id !== user.id) {
          setError('You can only edit venues you own');
          setTimeout(() => navigate('/locations'), 2000);
          return;
        }

        // Populate form with existing data
        setFormData({
          venue_name: venueData.name || '',
          venue_type: venueData.venue_type || 'park',
          address: venueData.address || '',
          city: venueData.city || '',
          state: venueData.state || '',
          country: venueData.country || '',
          postal_code: venueData.postal_code || '',
          phone: venueData.phone || '',
          email: venueData.email || '',
          website: venueData.website || '',
          description: venueData.description || '',
          opening_hours: venueData.opening_hours || '',
          image_url: venueData.image_url || '',
          images: venueData.images || [],
          contact_person_name: venueData.contact_person_name || '',
          contact_person_phone: venueData.contact_person_phone || ''
        });

        setSelectedAmenities(venueData.amenities || []);
      } catch (err: any) {
        console.error('Failed to fetch venue:', err);
        setError(err.response?.data?.message || 'Failed to load venue details');
        setTimeout(() => navigate('/locations'), 2000);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchVenue();
  }, [id, user, navigate, openAuthModal]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!formData.venue_name || !formData.address || !formData.city || !formData.country || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await venuesApi.updateVenue(parseInt(id!), {
        ...formData,
        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined
      });

      setSuccess(true);
      setTimeout(() => {
        navigate(`/locations/${id}`);
      }, 1500);
    } catch (error: any) {
      console.error('Venue update failed:', error);
      setError(error.response?.data?.message || 'Failed to update venue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/locations')}
            className="text-white/60 hover:text-white transition-colors"
          >
            Return to Locations
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Venue Updated!</h2>
          <p className="text-white/60">Redirecting to venue page...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(`/locations/${id}`)}
        className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Venue
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-400/10 rounded-full mb-4">
          <Building2 className="w-8 h-8 text-gold-400" />
        </div>
        <h1 className="text-4xl font-display font-bold text-white mb-2">Edit Venue</h1>
        <p className="text-white/60">
          Update your venue information
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="bg-white/5 rounded-2xl border border-white/10 p-8 space-y-6"
      >
        {/* Venue Information */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gold-400" />
            Venue Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Venue Name *</label>
              <input
                type="text"
                name="venue_name"
                value={formData.venue_name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                         placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
                placeholder="Washington Square Park Chess Area"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">Venue Type *</label>
              <select
                name="venue_type"
                value={formData.venue_type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                         focus:outline-none focus:border-gold-500/50"
                required
              >
                {VENUE_TYPES.map(type => (
                  <option key={type.value} value={type.value} className="bg-chess-darker">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                         placeholder:text-white/30 focus:outline-none focus:border-gold-500/50 resize-none"
                placeholder="Describe your venue, what makes it special for chess players..."
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gold-400" />
            Location
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Street Address *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                         placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
                placeholder="123 Main Street"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
                  placeholder="New York"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">State/Province</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
                  placeholder="NY"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Country *</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
                  placeholder="United States"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Postal Code</label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
                  placeholder="10012"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-gold-400" />
            Contact Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                         placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
                placeholder="venue@example.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Contact Person Name</label>
                <input
                  type="text"
                  name="contact_person_name"
                  value={formData.contact_person_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Contact Person Phone</label>
                <input
                  type="tel"
                  name="contact_person_phone"
                  value={formData.contact_person_phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                           placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
                  placeholder="+1 (555) 987-6543"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold-400" />
            Additional Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Opening Hours</label>
              <input
                type="text"
                name="opening_hours"
                value={formData.opening_hours}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white
                         placeholder:text-white/30 focus:outline-none focus:border-gold-500/50"
                placeholder="Mon-Fri: 9am-9pm, Sat-Sun: 10am-10pm"
              />
            </div>

            <div>
              <ImageUpload
                label="Cover Image"
                helperText="Main venue image (JPG, PNG, GIF or WebP, max 5MB)"
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                onClear={() => setFormData({ ...formData, image_url: '' })}
              />
            </div>

            <div>
              <ImageGalleryUpload
                label="Additional Images"
                helperText="Up to 5 images (JPG, PNG, GIF or WebP, max 5MB each)"
                value={formData.images || []}
                onChange={(urls) => setFormData({ ...formData, images: urls })}
                maxImages={5}
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-3 flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Amenities
              </label>
              <div className="grid grid-cols-2 gap-3">
                {COMMON_AMENITIES.map(amenity => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                              ${selectedAmenities.includes(amenity)
                                ? 'bg-gold-500/20 text-gold-400 border border-gold-500'
                                : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                              }`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker
                     font-semibold rounded-xl hover:from-gold-400 hover:to-gold-500 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Updating Venue...
              </>
            ) : (
              'Update Venue'
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
