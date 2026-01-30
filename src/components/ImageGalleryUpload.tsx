import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import apiClient from '../api/client';

interface ImageGalleryUploadProps {
  value?: string[]; // Array of image URLs
  onChange: (urls: string[]) => void;
  label?: string;
  helperText?: string;
  maxImages?: number;
}

const ImageGalleryUpload = ({
  value = [],
  onChange,
  label = 'Upload Images',
  helperText,
  maxImages = 5
}: ImageGalleryUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [confirmedRights, setConfirmedRights] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check if user confirmed rights
    if (!confirmedRights) {
      setError('Please confirm you own the rights to these images');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Check max images limit
    if (value.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed. You can upload ${maxImages - value.length} more.`);
      return;
    }

    // Validate each file
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('All files must be images');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is too large. Maximum 5MB per image.`);
        return;
      }
    }

    setUploading(true);
    setError(null);
    const uploadedUrls: string[] = [];

    try {
      // Upload files one by one
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);

        const formData = new FormData();
        formData.append('image', file);

        const response = await apiClient.post('/uploads/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const imageUrl = response.data.data.url;
        uploadedUrls.push(imageUrl);
      }

      // Add new URLs to existing ones
      onChange([...value, ...uploadedUrls]);

      // Clear file input and reset confirmation
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setConfirmedRights(false); // Reset for next upload
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const canAddMore = value.length < maxImages;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white/80">
          {label} ({value.length}/{maxImages})
        </label>
      )}

      {/* Image Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
          {value.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Gallery image ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-white/10"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rights confirmation checkbox */}
      {canAddMore && (
        <label className="flex items-start gap-2 p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
          <input
            type="checkbox"
            checked={confirmedRights}
            onChange={(e) => {
              setConfirmedRights(e.target.checked);
              setError(null);
            }}
            className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-gold-500 focus:ring-gold-500 focus:ring-offset-0"
          />
          <span className="text-sm text-white/70">
            I confirm that I own the rights to these images or have permission to use them
          </span>
        </label>
      )}

      {/* Upload Button */}
      {canAddMore && (
        <div className="relative">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full h-32 border-2 border-dashed border-white/20 hover:border-white/40 rounded-lg flex flex-col items-center justify-center gap-2 text-white/60 hover:text-white/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">{uploadProgress}</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8" />
                <span className="text-sm font-medium">{label}</span>
                {helperText && (
                  <span className="text-xs text-white/40">{helperText}</span>
                )}
                <span className="text-xs text-white/40">
                  {value.length === 0 ? `Up to ${maxImages} images` : `${maxImages - value.length} more`}
                </span>
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};

export default ImageGalleryUpload;
