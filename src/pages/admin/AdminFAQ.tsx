import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, HelpCircle, GripVertical } from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import * as adminApi from '../../api/admin';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface FAQFormData {
  question: string;
  answer: string;
  category: string;
  display_order: number;
  is_published: boolean;
}

export default function AdminFAQ() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
  });
  const [deleteModal, setDeleteModal] = useState<FAQ | null>(null);
  const [editModal, setEditModal] = useState<FAQ | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [formData, setFormData] = useState<FAQFormData>({
    question: '',
    answer: '',
    category: 'General',
    display_order: 0,
    is_published: true,
  });

  const fetchFAQs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAllFAQs({
        category: category !== 'all' ? category : undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setFaqs(res.data.data || []);
      setPagination(prev => ({ ...prev, ...(res.data.meta || {}) }));
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, category]);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  const handleDelete = async () => {
    if (!deleteModal) return;

    try {
      await adminApi.deleteFAQ(deleteModal.id);
      setDeleteModal(null);
      fetchFAQs();
    } catch (error) {
      console.error('Failed to delete FAQ:', error);
    }
  };

  const handleCreate = async () => {
    try {
      await adminApi.createFAQ(formData);
      setCreateModal(false);
      setFormData({
        question: '',
        answer: '',
        category: 'General',
        display_order: 0,
        is_published: true,
      });
      fetchFAQs();
    } catch (error) {
      console.error('Failed to create FAQ:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editModal) return;

    try {
      await adminApi.updateFAQ(editModal.id, formData);
      setEditModal(null);
      setFormData({
        question: '',
        answer: '',
        category: 'General',
        display_order: 0,
        is_published: true,
      });
      fetchFAQs();
    } catch (error) {
      console.error('Failed to update FAQ:', error);
    }
  };

  const handleTogglePublish = async (faq: FAQ) => {
    try {
      await adminApi.updateFAQ(faq.id, {
        is_published: !faq.is_published,
      });
      fetchFAQs();
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
    }
  };

  const openEditModal = (faq: FAQ) => {
    setEditModal(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      display_order: faq.display_order,
      is_published: faq.is_published,
    });
  };

  const openCreateModal = () => {
    setCreateModal(true);
    setFormData({
      question: '',
      answer: '',
      category: 'General',
      display_order: 0,
      is_published: true,
    });
  };

  const columns = [
    {
      key: 'order',
      header: 'Order',
      width: '80px',
      render: (faq: FAQ) => (
        <div className="flex items-center gap-2 text-white/60">
          <GripVertical className="w-4 h-4" />
          <span>{faq.display_order}</span>
        </div>
      ),
    },
    {
      key: 'question',
      header: 'Question',
      render: (faq: FAQ) => (
        <div className="flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
          <span className="text-white/80 font-medium">{faq.question}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      width: '120px',
      render: (faq: FAQ) => (
        <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
          {faq.category}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (faq: FAQ) => (
        <button
          onClick={() => handleTogglePublish(faq)}
          className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
            faq.is_published
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
          }`}
        >
          {faq.is_published ? (
            <>
              <Eye className="w-3 h-3" />
              <span className="text-xs">Published</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3 h-3" />
              <span className="text-xs">Draft</span>
            </>
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (faq: FAQ) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEditModal(faq)}
            className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
            title="Edit FAQ"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteModal(faq)}
            className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
            title="Delete FAQ"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const categories = ['General', 'Games', 'Tournaments', 'Clubs', 'Payments', 'Premium', 'Masters'];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">FAQ Management</h1>
          <p className="text-white/50 text-sm mt-1">
            {pagination.total > 0 ? `${pagination.total} total FAQs` : 'Loading...'}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add FAQ
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={faqs}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        emptyMessage="No FAQs found"
      />

      {/* Create/Edit Modal */}
      {(createModal || editModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] rounded-xl p-6 w-full max-w-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-6">
              {editModal ? 'Edit FAQ' : 'Create FAQ'}
            </h3>

            <div className="space-y-4">
              {/* Question */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Question
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="What is your question?"
                />
              </div>

              {/* Answer */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Answer
                </label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Provide a detailed answer..."
                />
              </div>

              {/* Category and Display Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Published Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-2 focus:ring-purple-500"
                />
                <label htmlFor="is_published" className="text-sm text-white/80">
                  Publish immediately
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setCreateModal(false);
                  setEditModal(null);
                }}
                className="px-4 py-2 text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editModal ? handleUpdate : handleCreate}
                disabled={!formData.question || !formData.answer}
                className="px-6 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editModal ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] rounded-xl p-6 w-full max-w-md border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Delete FAQ</h3>
            <p className="text-white/60 mb-2">
              Are you sure you want to delete this FAQ?
            </p>
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <p className="text-white/80 font-medium mb-2">
                Q: {deleteModal.question}
              </p>
              <p className="text-white/60 text-sm">
                A: {deleteModal.answer.substring(0, 100)}...
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
