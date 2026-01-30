import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Image as ImageIcon } from 'lucide-react';

interface DefaultImageSelectorProps {
  onSelect: (url: string) => void;
  selectedImage?: string;
  type?: 'club' | 'tournament';
}

// Default images for clubs and tournaments
const DEFAULT_CLUB_IMAGES = [
  'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800',
  'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=800',
  'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=800',
  'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=800',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
  'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=800',
];

const DEFAULT_TOURNAMENT_IMAGES = [
  'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=800',
  'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800',
  'https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=800',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
  'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=800',
  'https://images.unsplash.com/photo-1551917951-7a8cd64c6d0e?w=800',
];

const DefaultImageSelector = ({ onSelect, selectedImage, type = 'club' }: DefaultImageSelectorProps) => {
  const [showGallery, setShowGallery] = useState(false);

  const images = type === 'club' ? DEFAULT_CLUB_IMAGES : DEFAULT_TOURNAMENT_IMAGES;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setShowGallery(!showGallery)}
        className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
      >
        <ImageIcon className="w-4 h-4" />
        {showGallery ? 'Hide' : 'Choose from'} default images
      </button>

      <AnimatePresence>
        {showGallery && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-3 gap-3"
          >
            {images.map((imageUrl, index) => (
              <motion.button
                key={imageUrl}
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  onSelect(imageUrl);
                  setShowGallery(false);
                }}
                className={`
                  relative aspect-video rounded-lg overflow-hidden
                  border-2 transition-all cursor-pointer
                  ${selectedImage === imageUrl
                    ? 'border-gold-500 ring-2 ring-gold-500/30'
                    : 'border-white/10 hover:border-white/30'
                  }
                `}
              >
                <img
                  src={imageUrl}
                  alt={`Default ${type} image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {selectedImage === imageUrl && (
                  <div className="absolute inset-0 bg-gold-500/20 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center">
                      <Check className="w-5 h-5 text-chess-darker" />
                    </div>
                  </div>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {selectedImage && images.includes(selectedImage) && (
        <div className="text-xs text-white/50">
          Using default image
        </div>
      )}
    </div>
  );
};

export default DefaultImageSelector;
