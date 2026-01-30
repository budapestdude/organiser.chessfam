import { useState, useEffect } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { linkPreviewApi, extractYouTubeId, type LinkPreviewData } from '../api/linkPreview';

interface LinkPreviewProps {
  url: string;
}

const LinkPreview = ({ url }: LinkPreviewProps) => {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchPreview();
  }, [url]);

  const fetchPreview = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await linkPreviewApi.getPreview(url);
      setPreview(data);
    } catch (err) {
      console.error('Error fetching link preview:', err);
      setError(true);
      // Fallback to basic URL display
      setPreview({ url });
    } finally {
      setLoading(false);
    }
  };

  // Check if this is a YouTube URL
  const youtubeId = extractYouTubeId(url);

  // Render YouTube embed
  if (youtubeId) {
    return (
      <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
        <div className="relative" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
        <span className="ml-2 text-white/40 text-sm">Loading preview...</span>
      </div>
    );
  }

  // Error or no preview data - show simple link
  if (error || !preview) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
      >
        <ExternalLink className="w-4 h-4" />
        <span className="underline break-all">{url}</span>
      </a>
    );
  }

  // Render general link preview card
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 block bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl overflow-hidden transition-all group"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Preview Image */}
        {preview.image && (
          <div className="sm:w-48 h-40 sm:h-auto flex-shrink-0 bg-white/5">
            <img
              src={preview.image}
              alt={preview.title || 'Link preview'}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide image if it fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Preview Content */}
        <div className="flex-1 p-4">
          {/* Site Name */}
          {preview.siteName && (
            <div className="text-xs text-white/50 mb-1">{preview.siteName}</div>
          )}

          {/* Title */}
          {preview.title && (
            <div className="font-semibold text-white group-hover:text-blue-400 transition-colors mb-1 line-clamp-2">
              {preview.title}
            </div>
          )}

          {/* Description */}
          {preview.description && (
            <div className="text-sm text-white/70 line-clamp-2 mb-2">
              {preview.description}
            </div>
          )}

          {/* URL */}
          <div className="flex items-center gap-1 text-xs text-white/40">
            <ExternalLink className="w-3 h-3" />
            <span className="truncate">{new URL(url).hostname}</span>
          </div>
        </div>
      </div>
    </a>
  );
};

export default LinkPreview;
