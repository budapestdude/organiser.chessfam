// Avatar component with upload capability
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, User, X, Upload, Loader2 } from 'lucide-react';
import { useImageUpload, getAvatarUrl, validateImageFile } from '../hooks/useImageUpload';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  onUpload?: (url: string) => void;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
  chessTitle?: string;
  chessTitleVerified?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const sizePx = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

const titleColors: Record<string, string> = {
  GM: 'bg-yellow-500',
  IM: 'bg-orange-500',
  FM: 'bg-blue-500',
  CM: 'bg-green-500',
  NM: 'bg-purple-500',
  WGM: 'bg-yellow-500',
  WIM: 'bg-orange-500',
  WFM: 'bg-blue-500',
  WCM: 'bg-green-500',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  editable = false,
  onUpload,
  showOnlineStatus = false,
  isOnline = false,
  chessTitle,
  chessTitleVerified = false,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { upload, isUploading, progress, error } = useImageUpload({
    bucket: 'avatars',
    generateThumbnail: true,
    thumbnailSize: 150,
  });

  const avatarUrl = getAvatarUrl(src, name, sizePx[size]);
  const sizeClass = sizeClasses[size];

  const handleClick = () => {
    if (editable) {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowUploadModal(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const result = await upload(selectedFile);
    if (result && onUpload) {
      onUpload(result.url);
    }

    setShowUploadModal(false);
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  const handleCancel = () => {
    setShowUploadModal(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  return (
    <>
      <div className={`relative inline-block ${className}`}>
        <motion.div
          className={`${sizeClass} rounded-full overflow-hidden bg-gray-700 ${editable ? 'cursor-pointer' : ''}`}
          whileHover={editable ? { scale: 1.05 } : {}}
          whileTap={editable ? { scale: 0.95 } : {}}
          onClick={handleClick}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name || 'Avatar'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
              <User className="w-1/2 h-1/2 text-white" />
            </div>
          )}

          {editable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-full">
              <Camera className="w-1/3 h-1/3 text-white" />
            </div>
          )}
        </motion.div>

        {/* Online status indicator */}
        {showOnlineStatus && (
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
              isOnline ? 'bg-green-500' : 'bg-gray-500'
            }`}
          />
        )}

        {/* Chess title badge - only show if verified */}
        {chessTitle && chessTitleVerified && (
          <span
            className={`absolute -top-1 -right-1 px-1 text-[10px] font-bold text-white rounded ${
              titleColors[chessTitle] || 'bg-gray-500'
            }`}
          >
            {chessTitle}
          </span>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Update Avatar</h3>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {previewUrl && (
                <div className="mb-4 flex justify-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {error && (
                <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
              )}

              {isUploading && (
                <div className="mb-4">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400 text-center mt-2">
                    Uploading... {Math.round(progress)}%
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-colors flex items-center justify-center gap-2"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Avatar Group component for showing multiple avatars
interface AvatarGroupProps {
  avatars: Array<{
    src?: string | null;
    name?: string;
    isOnline?: boolean;
  }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 5,
  size = 'sm',
  className = '',
}) => {
  const displayed = avatars.slice(0, max);
  const remaining = avatars.length - max;

  const overlapClass = {
    xs: '-ml-2',
    sm: '-ml-3',
    md: '-ml-4',
  };

  return (
    <div className={`flex items-center ${className}`}>
      {displayed.map((avatar, index) => (
        <div
          key={index}
          className={`relative ${index > 0 ? overlapClass[size] : ''}`}
          style={{ zIndex: displayed.length - index }}
        >
          <Avatar
            src={avatar.src}
            name={avatar.name}
            size={size}
            showOnlineStatus={avatar.isOnline !== undefined}
            isOnline={avatar.isOnline}
            className="ring-2 ring-gray-900"
          />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={`relative ${overlapClass[size]} ${sizeClasses[size]} rounded-full bg-gray-700 flex items-center justify-center ring-2 ring-gray-900`}
          style={{ zIndex: 0 }}
        >
          <span className="text-xs text-gray-300 font-medium">+{remaining}</span>
        </div>
      )}
    </div>
  );
};

export default Avatar;
