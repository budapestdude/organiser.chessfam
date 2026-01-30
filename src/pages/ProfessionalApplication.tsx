import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Award,
  Camera,
  Video,
  Mic,
  Code,
  Pen,
  BarChart3,
  Laptop,
  PenTool,
  Film,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Globe,
  MapPin,
  Briefcase,
  Languages as LanguagesIcon,
  DollarSign
} from 'lucide-react';
import { useStore } from '../store';
import { professionalsApi } from '../api/professionals';

const PROFESSIONAL_TYPES = [
  { value: 'coach', label: 'Chess Coach', icon: Award, description: 'Teach chess to students of all levels' },
  { value: 'arbiter', label: 'Arbiter', icon: Award, description: 'Officiate chess tournaments and events' },
  { value: 'photographer', label: 'Photographer', icon: Camera, description: 'Capture chess events and portraits' },
  { value: 'videographer', label: 'Videographer', icon: Video, description: 'Record and produce chess video content' },
  { value: 'analyst', label: 'Analyst', icon: BarChart3, description: 'Provide game analysis and insights' },
  { value: 'commentator', label: 'Commentator', icon: Mic, description: 'Commentate chess games and events' },
  { value: 'influencer', label: 'Influencer', icon: Users, description: 'Promote chess through social media' },
  { value: 'writer', label: 'Writer', icon: Pen, description: 'Write chess articles and content' },
  { value: 'dgt_operator', label: 'DGT Operator', icon: Laptop, description: 'Operate digital chess boards' },
  { value: 'programmer', label: 'Programmer', icon: Code, description: 'Develop chess software and tools' },
  { value: 'editor', label: 'Editor', icon: PenTool, description: 'Edit chess content and materials' },
  { value: 'designer', label: 'Designer', icon: PenTool, description: 'Design chess graphics and branding' },
  { value: 'producer', label: 'Producer', icon: Film, description: 'Produce chess events and content' }
];

const LANGUAGES = [
  'English', 'Spanish', 'Russian', 'Chinese', 'Hindi', 'French',
  'German', 'Portuguese', 'Arabic', 'Japanese', 'Italian', 'Dutch'
];

const PRICING_MODELS = [
  { value: 'hourly', label: 'Hourly Rate' },
  { value: 'per_event', label: 'Per Event' },
  { value: 'per_day', label: 'Per Day' },
  { value: 'custom_quote', label: 'Custom Quote' }
];

interface Service {
  service_name: string;
  service_description: string;
  pricing_model: 'hourly' | 'per_event' | 'per_day' | 'custom_quote';
  base_price?: number;
}

interface FormData {
  professional_type: string;
  name: string;
  bio: string;
  profile_image?: string;
  experience_years: number;
  specialties: string[];
  languages: string[];
  country: string;
  city: string;
  remote_available: boolean;
  type_specific_data: Record<string, any>;
  proposed_services: Service[];
}

export default function ProfessionalApplication() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);

  const [formData, setFormData] = useState<FormData>({
    professional_type: '',
    name: user?.name || '',
    bio: '',
    experience_years: 1,
    specialties: [],
    languages: ['English'],
    country: '',
    city: '',
    remote_available: true,
    type_specific_data: {},
    proposed_services: []
  });

  // Check for existing application
  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!user) {
        setCheckingExisting(false);
        return;
      }

      try {
        const response = await professionalsApi.getMyApplication();
        if (response.data) {
          setExistingApplication(response.data);
        }
      } catch (err) {
        // No existing application or API error
        console.log('[ProfessionalApplication] No existing application or API error:', err);
      } finally {
        setCheckingExisting(false);
      }
    };

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.warn('[ProfessionalApplication] API check timed out, continuing anyway');
      setCheckingExisting(false);
    }, 5000);

    checkExistingApplication().then(() => {
      clearTimeout(timeout);
    });

    return () => clearTimeout(timeout);
  }, [user]);

  const handleTypeSelect = (type: string) => {
    setFormData({ ...formData, professional_type: type });
    setStep(2);
  };

  const handleAddService = () => {
    setFormData({
      ...formData,
      proposed_services: [
        ...formData.proposed_services,
        {
          service_name: '',
          service_description: '',
          pricing_model: 'hourly',
          base_price: undefined
        }
      ]
    });
  };

  const handleUpdateService = (index: number, field: string, value: any) => {
    const updatedServices = [...formData.proposed_services];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    setFormData({ ...formData, proposed_services: updatedServices });
  };

  const handleRemoveService = (index: number) => {
    setFormData({
      ...formData,
      proposed_services: formData.proposed_services.filter((_, i) => i !== index)
    });
  };

  const toggleLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!formData.professional_type || !formData.name || formData.proposed_services.length === 0) {
      setError('Please complete all required fields and add at least one service');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await professionalsApi.applyAsProfessional(formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto flex flex-col items-center justify-center">
        <Users className="w-16 h-16 text-white/20 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Sign in to apply</h2>
        <p className="text-white/50 mb-6">You need to be logged in to become a professional</p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (checkingExisting) {
    return (
      <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold-500 animate-spin mb-4" />
        <p className="text-white/50">Checking application status...</p>
      </div>
    );
  }

  // Show existing application status
  if (existingApplication) {
    const statusConfig = {
      pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Under Review' },
      approved: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Approved' },
      rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Rejected' }
    };
    const status = statusConfig[existingApplication.status as keyof typeof statusConfig] || statusConfig.pending;
    const StatusIcon = status.icon;

    return (
      <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <button
            onClick={() => navigate('/professionals')}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-2xl font-display font-bold text-white">Application Status</h1>
          <div className="w-16" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center"
        >
          <div className={`w-20 h-20 rounded-full ${status.bg} flex items-center justify-center mx-auto mb-4`}>
            <StatusIcon className={`w-10 h-10 ${status.color}`} />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">{status.label}</h2>
          <p className="text-white/60 mb-6">
            {existingApplication.status === 'pending' && 'Your application is being reviewed by our team.'}
            {existingApplication.status === 'approved' && 'Congratulations! You are now a verified professional.'}
            {existingApplication.status === 'rejected' && 'Unfortunately, your application was not approved.'}
          </p>

          {existingApplication.rejection_reason && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-red-400 font-medium mb-1">Reason:</p>
              <p className="text-white/70">{existingApplication.rejection_reason}</p>
            </div>
          )}

          <button
            onClick={() => navigate(existingApplication.status === 'approved' ? '/dashboard' : '/professionals')}
            className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
          >
            {existingApplication.status === 'approved' ? 'Go to Dashboard' : 'View Professionals'}
          </button>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4"
        >
          <CheckCircle className="w-10 h-10 text-green-400" />
        </motion.div>
        <h2 className="text-xl font-semibold text-white mb-2">Application Submitted!</h2>
        <p className="text-white/50 mb-6 text-center max-w-md">
          Your application is now under review. We'll notify you once it's been processed.
        </p>
        <button
          onClick={() => navigate('/professionals')}
          className="px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors"
        >
          Back to Professionals
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <button
          onClick={() => step === 1 ? navigate('/professionals') : setStep(step - 1)}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-2xl font-display font-bold text-white">Become a Professional</h1>
        <div className="w-16" />
      </motion.div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step ? 'w-12 bg-gold-500' : s < step ? 'w-8 bg-gold-500/50' : 'w-8 bg-white/10'
              }`}
            />
          ))}
        </div>
        <p className="text-center text-white/60 text-sm mt-2">
          Step {step} of 3
        </p>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-gold-500/20 to-gold-600/20 border border-gold-500/30 rounded-xl p-4 mb-6"
      >
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-gold-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-white">Join Our Professional Network</h3>
            <p className="text-sm text-white/60">
              Offer your services to the chess community and connect with organizers, players, and enthusiasts.
            </p>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400"
        >
          {error}
        </motion.div>
      )}

      {/* Step 1: Choose Professional Type */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Choose Your Professional Type</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {PROFESSIONAL_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => handleTypeSelect(type.value)}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-gold-500/30 transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gold-500/20 rounded-lg flex items-center justify-center group-hover:bg-gold-500/30 transition-colors">
                      <Icon className="w-6 h-6 text-gold-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{type.label}</h3>
                      <p className="text-sm text-white/60">{type.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Step 2: Basic Information */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-6"
        >
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-gold-400" />
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Professional Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name or business name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Bio *</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Describe your experience, credentials, and what you offer..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Years of Experience</label>
                  <input
                    type="number"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={50}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm text-white/70 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Country"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.remote_available}
                    onChange={(e) => setFormData({ ...formData, remote_available: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-400" />
                    <span className="text-white">Available for remote work</span>
                  </div>
                </label>
              </div>

              <div>
                <h3 className="text-sm text-white/70 mb-3 flex items-center gap-2">
                  <LanguagesIcon className="w-4 h-4" />
                  Languages
                </h3>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((language) => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => toggleLanguage(language)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        formData.languages.includes(language)
                          ? 'bg-gold-500 text-chess-darker'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => setStep(3)}
              disabled={!formData.name || !formData.bio}
              className="flex-1 px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Services
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Services & Pricing */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-6"
        >
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gold-400" />
              Services & Pricing
            </h2>

            <div className="space-y-4 mb-6">
              {formData.proposed_services.map((service, index) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={service.service_name}
                        onChange={(e) => handleUpdateService(index, 'service_name', e.target.value)}
                        placeholder="Service name (e.g., Tournament Coverage, Hourly Coaching)"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                      />
                      <textarea
                        value={service.service_description}
                        onChange={(e) => handleUpdateService(index, 'service_description', e.target.value)}
                        placeholder="Describe what's included in this service..."
                        rows={2}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-gold-500 focus:outline-none resize-none"
                      />
                      <div className="grid md:grid-cols-2 gap-3">
                        <select
                          value={service.pricing_model}
                          onChange={(e) => handleUpdateService(index, 'pricing_model', e.target.value)}
                          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                        >
                          {PRICING_MODELS.map((model) => (
                            <option key={model.value} value={model.value}>{model.label}</option>
                          ))}
                        </select>
                        {service.pricing_model !== 'custom_quote' && (
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
                            <input
                              type="number"
                              value={service.base_price || ''}
                              onChange={(e) => handleUpdateService(index, 'base_price', parseFloat(e.target.value) || undefined)}
                              placeholder="Price"
                              min={0}
                              className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-gold-500 focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveService(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddService}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 border-dashed rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              + Add Service
            </button>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSubmit}
              disabled={loading || formData.proposed_services.length === 0}
              className="flex-1 px-6 py-3 bg-gold-500 text-chess-darker font-semibold rounded-xl hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
