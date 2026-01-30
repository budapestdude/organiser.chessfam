import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Globe, DollarSign, Loader2, CheckCircle, X } from 'lucide-react';
import { professionalsApi } from '../api/professionals';
import { useStore } from '../store';

interface Service {
  id: number;
  service_name: string;
  service_description?: string;
  pricing_model: string;
  base_price?: number;
  currency: string;
  available: boolean;
}

interface BookingWidgetProps {
  professionalId: number;
  professionalName: string;
  services: Service[];
  available: boolean;
}

export default function BookingWidget({
  professionalId,
  professionalName,
  services,
  available
}: BookingWidgetProps) {
  const { user, openAuthModal } = useStore();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    booking_date: '',
    booking_time: '',
    duration_hours: 1,
    location_type: 'online' as 'online' | 'onsite',
    quantity: 1,
    notes: ''
  });

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setShowBookingForm(true);
    setError(null);
  };

  const calculateTotalPrice = (): number => {
    if (!selectedService || !selectedService.base_price) {
      return 0;
    }

    switch (selectedService.pricing_model) {
      case 'hourly':
        return selectedService.base_price * formData.duration_hours;
      case 'per_day':
        return selectedService.base_price * formData.quantity;
      case 'per_event':
        return selectedService.base_price;
      default:
        return 0;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!selectedService) {
      setError('Please select a service');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const bookingData: any = {
        professional_id: professionalId,
        service_id: selectedService.id,
        service_name: selectedService.service_name,
        pricing_model: selectedService.pricing_model,
        location_type: formData.location_type,
        notes: formData.notes || undefined
      };

      // Add fields based on pricing model
      if (selectedService.pricing_model === 'hourly') {
        bookingData.booking_date = formData.booking_date || undefined;
        bookingData.booking_time = formData.booking_time || undefined;
        bookingData.duration_hours = formData.duration_hours;
        bookingData.unit_price = selectedService.base_price;
        bookingData.total_price = calculateTotalPrice();
      } else if (selectedService.pricing_model === 'per_day') {
        bookingData.booking_date = formData.booking_date || undefined;
        bookingData.quantity = formData.quantity;
        bookingData.unit_price = selectedService.base_price;
        bookingData.total_price = calculateTotalPrice();
      } else if (selectedService.pricing_model === 'per_event') {
        bookingData.booking_date = formData.booking_date || undefined;
        bookingData.unit_price = selectedService.base_price;
        bookingData.total_price = selectedService.base_price || 0;
      } else if (selectedService.pricing_model === 'custom_quote') {
        bookingData.booking_date = formData.booking_date || undefined;
        bookingData.total_price = 0; // To be determined
      }

      await professionalsApi.createBooking(bookingData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowBookingForm(false);
    setSelectedService(null);
    setSuccess(false);
    setError(null);
    setFormData({
      booking_date: '',
      booking_time: '',
      duration_hours: 1,
      location_type: 'online',
      quantity: 1,
      notes: ''
    });
  };

  if (!available) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
        <p className="text-red-400">This professional is currently unavailable</p>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
        <p className="text-white/60">No services available</p>
      </div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center"
      >
        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          {selectedService?.pricing_model === 'custom_quote' ? 'Quote Requested!' : 'Booking Submitted!'}
        </h3>
        <p className="text-white/60 mb-4">
          {selectedService?.pricing_model === 'custom_quote'
            ? `${professionalName} will contact you with a custom quote.`
            : `Your booking request has been sent to ${professionalName}.`}
        </p>
        <button
          onClick={resetForm}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          Book Another Service
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Service Selection */}
      {!showBookingForm && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white/70">Select a Service</h3>
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => handleServiceSelect(service)}
              disabled={!service.available}
              className="w-full text-left bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-gold-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="font-medium text-white mb-1">{service.service_name}</div>
              {service.service_description && (
                <p className="text-sm text-white/60 mb-2">{service.service_description}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gold-400 font-medium">
                  {service.base_price ? `${service.currency} ${service.base_price}` : 'Custom Quote'}
                </span>
                <span className="text-xs text-white/40 capitalize">
                  {service.pricing_model.replace('_', ' ')}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Booking Form */}
      <AnimatePresence>
        {showBookingForm && selectedService && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Selected Service Header */}
            <div className="flex items-center justify-between p-4 bg-gold-500/10 border border-gold-500/30 rounded-xl">
              <div>
                <div className="font-medium text-white">{selectedService.service_name}</div>
                <div className="text-sm text-gold-400">
                  {selectedService.base_price
                    ? `${selectedService.currency} ${selectedService.base_price}`
                    : 'Custom Quote'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBookingForm(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Date & Time */}
            {selectedService.pricing_model !== 'custom_quote' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/70 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date {selectedService.pricing_model !== 'per_day' && '(optional)'}
                  </label>
                  <input
                    type="date"
                    value={formData.booking_date}
                    onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                  />
                </div>

                {selectedService.pricing_model === 'hourly' && (
                  <div>
                    <label className="block text-sm text-white/70 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Time (optional)
                    </label>
                    <input
                      type="time"
                      value={formData.booking_time}
                      onChange={(e) => setFormData({ ...formData, booking_time: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Duration (hourly) */}
            {selectedService.pricing_model === 'hourly' && (
              <div>
                <label className="block text-sm text-white/70 mb-2">Duration (hours)</label>
                <input
                  type="number"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 1 })}
                  min={1}
                  max={24}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                  required
                />
              </div>
            )}

            {/* Quantity (per day) */}
            {selectedService.pricing_model === 'per_day' && (
              <div>
                <label className="block text-sm text-white/70 mb-2">Number of Days</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  min={1}
                  max={365}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                  required
                />
              </div>
            )}

            {/* Location Type */}
            <div>
              <label className="block text-sm text-white/70 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, location_type: 'online' })}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                    formData.location_type === 'online'
                      ? 'bg-gold-500/20 border-gold-500 text-gold-400'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Online
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, location_type: 'onsite' })}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                    formData.location_type === 'onsite'
                      ? 'bg-gold-500/20 border-gold-500 text-gold-400'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  On-site
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm text-white/70 mb-2">
                Additional Notes {selectedService.pricing_model === 'custom_quote' && '(required)'}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={
                  selectedService.pricing_model === 'custom_quote'
                    ? 'Describe your requirements in detail...'
                    : 'Any special requests or information...'
                }
                rows={3}
                required={selectedService.pricing_model === 'custom_quote'}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-gold-500 focus:outline-none resize-none"
              />
            </div>

            {/* Price Summary */}
            {selectedService.pricing_model !== 'custom_quote' && selectedService.base_price && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center justify-between text-white">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gold-400" />
                    Total Price
                  </span>
                  <span className="text-xl font-bold text-gold-400">
                    {selectedService.currency} {calculateTotalPrice()}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !user}
              className="w-full px-6 py-3 bg-gold-500 hover:bg-gold-600 text-chess-darker font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : selectedService.pricing_model === 'custom_quote' ? (
                'Request Quote'
              ) : (
                'Book Now'
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
