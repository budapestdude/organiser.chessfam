import { useEffect, useState, useCallback } from 'react';
import { Star, Trash2, User, MapPin, Users, Trophy } from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import * as adminApi from '../../api/admin';

interface Review {
  id: number;
  type: 'player' | 'venue' | 'club' | 'tournament';
  reviewer_id: number;
  reviewer_name: string;
  target_id: number;
  target_name: string;
  rating: number;
  content: string;
  created_at: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [deleteModal, setDeleteModal] = useState<Review | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getReviews({
        type: type !== 'all' ? type : undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setReviews(res.data.reviews);
      setPagination(prev => ({ ...prev, ...res.data.pagination }));
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, type]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDelete = async () => {
    if (!deleteModal) return;

    try {
      await adminApi.deleteReview(deleteModal.type, deleteModal.id);
      setDeleteModal(null);
      fetchReviews();
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  };

  const getTypeIcon = (reviewType: string) => {
    switch (reviewType) {
      case 'player':
        return <User className="w-4 h-4 text-blue-400" />;
      case 'venue':
        return <MapPin className="w-4 h-4 text-green-400" />;
      case 'club':
        return <Users className="w-4 h-4 text-purple-400" />;
      case 'tournament':
        return <Trophy className="w-4 h-4 text-yellow-400" />;
      default:
        return null;
    }
  };

  const columns = [
    {
      key: 'type',
      header: 'Type',
      width: '100px',
      render: (review: Review) => (
        <div className="flex items-center gap-2">
          {getTypeIcon(review.type)}
          <span className="capitalize">{review.type}</span>
        </div>
      ),
    },
    {
      key: 'reviewer',
      header: 'Reviewer',
      render: (review: Review) => (
        <span className="text-white/80">{review.reviewer_name}</span>
      ),
    },
    {
      key: 'target',
      header: 'Target',
      render: (review: Review) => (
        <span className="text-white/80">{review.target_name}</span>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      width: '100px',
      render: (review: Review) => (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-yellow-400">{review.rating}</span>
        </div>
      ),
    },
    {
      key: 'content',
      header: 'Content',
      render: (review: Review) => (
        <p className="text-white/60 text-sm truncate max-w-[300px]">{review.content}</p>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      width: '120px',
      render: (review: Review) => (
        <span className="text-white/40 text-sm">{new Date(review.created_at).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (review: Review) => (
        <button
          onClick={() => setDeleteModal(review)}
          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
          title="Delete review"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Content Moderation</h1>

      {/* Filters */}
      <div className="mb-6">
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Reviews</option>
          <option value="player">Player Reviews</option>
          <option value="venue">Venue Reviews</option>
          <option value="club">Club Reviews</option>
          <option value="tournament">Tournament Reviews</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={reviews}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        emptyMessage="No reviews found"
      />

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] rounded-xl p-6 w-full max-w-md border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Delete Review</h3>
            <p className="text-white/60 mb-2">
              Are you sure you want to delete this review?
            </p>
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <p className="text-white/80 mb-2">"{deleteModal.content}"</p>
              <p className="text-white/40 text-sm">
                - {deleteModal.reviewer_name} on {deleteModal.target_name}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
