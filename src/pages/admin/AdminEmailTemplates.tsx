import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Copy,
  Send,
  Check,
  X,
  Search,
  Filter,
} from 'lucide-react';
import * as adminApi from '../../api/admin';
import DataTable from '../../components/admin/DataTable';

interface EmailTemplate {
  id: number;
  template_key: string;
  template_name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[];
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'preview'>('create');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sampleVariables, setSampleVariables] = useState<Record<string, any>>({});

  const [formData, setFormData] = useState({
    template_key: '',
    template_name: '',
    subject: '',
    html_content: '',
    text_content: '',
    variables: [] as string[],
    category: 'Authentication',
    is_active: true,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
  });

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAllEmailTemplates({
        category: category !== 'all' ? category : undefined,
        search: searchTerm || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });

      setTemplates(res.data.data || []);
      setPagination((prev) => ({ ...prev, ...(res.data.meta || {}) }));
    } catch (error) {
      console.error('Failed to fetch email templates:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, category, searchTerm]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await adminApi.getEmailTemplateCategories();
      setCategories(res.data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = () => {
    setModalMode('create');
    setSelectedTemplate(null);
    setFormData({
      template_key: '',
      template_name: '',
      subject: '',
      html_content: '',
      text_content: '',
      variables: [],
      category: 'Authentication',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setModalMode('edit');
    setSelectedTemplate(template);
    setFormData({
      template_key: template.template_key,
      template_name: template.template_name,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content,
      variables: template.variables,
      category: template.category,
      is_active: template.is_active,
    });
    setShowModal(true);
  };

  const handlePreview = async (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setModalMode('preview');

    // Initialize sample variables
    const sampleVars: Record<string, any> = {};
    template.variables.forEach((varName) => {
      sampleVars[varName] = `[${varName}]`;
    });
    setSampleVariables(sampleVars);

    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this email template?')) return;

    try {
      await adminApi.deleteEmailTemplate(id);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete email template:', error);
      alert('Failed to delete email template');
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await adminApi.duplicateEmailTemplate(id);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to duplicate email template:', error);
      alert('Failed to duplicate email template');
    }
  };

  const handleToggleActive = async (template: EmailTemplate) => {
    try {
      await adminApi.updateEmailTemplate(template.id, {
        is_active: !template.is_active,
      });
      fetchTemplates();
    } catch (error) {
      console.error('Failed to toggle template status:', error);
      alert('Failed to toggle template status');
    }
  };

  const handleSubmit = async () => {
    try {
      if (modalMode === 'create') {
        await adminApi.createEmailTemplate(formData);
      } else if (modalMode === 'edit' && selectedTemplate) {
        await adminApi.updateEmailTemplate(selectedTemplate.id, formData);
      }

      setShowModal(false);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to save email template:', error);
      alert('Failed to save email template');
    }
  };

  const handleSendTest = async () => {
    if (!selectedTemplate || !testEmail) {
      alert('Please enter a test email address');
      return;
    }

    try {
      await adminApi.sendTestEmail(selectedTemplate.id, testEmail, sampleVariables);
      alert('Test email sent successfully!');
      setShowTestModal(false);
      setTestEmail('');
    } catch (error) {
      console.error('Failed to send test email:', error);
      alert('Failed to send test email');
    }
  };

  const columns = [
    {
      key: 'template_name',
      header: 'Name',
      render: (template: EmailTemplate) => (
        <div>
          <div className="font-medium text-white">{template.template_name}</div>
          <div className="text-sm text-white/50">{template.template_key}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (template: EmailTemplate) => (
        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
          {template.category}
        </span>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (template: EmailTemplate) => (
        <div className="text-white/70 truncate max-w-md">{template.subject}</div>
      ),
    },
    {
      key: 'variables',
      header: 'Variables',
      render: (template: EmailTemplate) => (
        <div className="flex flex-wrap gap-1">
          {template.variables.slice(0, 3).map((varName) => (
            <span
              key={varName}
              className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs"
            >
              {varName}
            </span>
          ))}
          {template.variables.length > 3 && (
            <span className="px-2 py-0.5 bg-white/10 text-white/50 rounded text-xs">
              +{template.variables.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (template: EmailTemplate) => (
        <button
          onClick={() => handleToggleActive(template)}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            template.is_active
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {template.is_active ? (
            <>
              <Check className="w-3 h-3" />
              Active
            </>
          ) : (
            <>
              <X className="w-3 h-3" />
              Inactive
            </>
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (template: EmailTemplate) => (
        <div className="flex gap-2">
          <button
            onClick={() => handlePreview(template)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Preview"
          >
            <Eye className="w-4 h-4 text-white/70" />
          </button>
          <button
            onClick={() => {
              setSelectedTemplate(template);
              setShowTestModal(true);
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Send Test"
          >
            <Send className="w-4 h-4 text-white/70" />
          </button>
          <button
            onClick={() => handleEdit(template)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4 text-white/70" />
          </button>
          <button
            onClick={() => handleDuplicate(template.id)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Duplicate"
          >
            <Copy className="w-4 h-4 text-white/70" />
          </button>
          <button
            onClick={() => handleDelete(template.id)}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Email Templates</h1>
          <p className="text-white/60">Manage email templates with custom variables</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-6 py-3 bg-gold-500 text-chess-darker font-bold rounded-xl hover:bg-gold-400 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Template
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:border-primary-500 focus:outline-none"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="pl-12 pr-8 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-primary-500 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Table */}
      <DataTable
        columns={columns}
        data={templates}
        loading={loading}
        emptyMessage="No email templates found"
      />

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-chess-darker border border-white/10 rounded-2xl p-8 max-w-4xl w-full my-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Mail className="w-7 h-7 text-gold-400" />
                {modalMode === 'create'
                  ? 'Create Email Template'
                  : modalMode === 'edit'
                  ? 'Edit Email Template'
                  : 'Preview Email Template'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white/70" />
              </button>
            </div>

            {modalMode === 'preview' && selectedTemplate ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Subject</h3>
                  <div className="p-4 bg-white/5 rounded-lg text-white">
                    {selectedTemplate.subject}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">HTML Content</h3>
                  <div className="p-4 bg-white/5 rounded-lg text-white/70 max-h-96 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: selectedTemplate.html_content }} />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Text Content</h3>
                  <div className="p-4 bg-white/5 rounded-lg text-white/70 max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {selectedTemplate.text_content}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Variables</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((varName) => (
                      <span
                        key={varName}
                        className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm"
                      >
                        {'{{'}{varName}{'}}'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Template Key *
                    </label>
                    <input
                      type="text"
                      value={formData.template_key}
                      onChange={(e) =>
                        setFormData({ ...formData, template_key: e.target.value })
                      }
                      disabled={modalMode === 'edit'}
                      placeholder="e.g., email_verification"
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none disabled:opacity-50"
                    />
                    <p className="text-xs text-white/50 mt-1">
                      Unique identifier used in code (cannot be changed after creation)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={formData.template_name}
                      onChange={(e) =>
                        setFormData({ ...formData, template_name: e.target.value })
                      }
                      placeholder="e.g., Email Verification"
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                    >
                      <option value="Authentication">Authentication</option>
                      <option value="Bookings">Bookings</option>
                      <option value="Tournaments">Tournaments</option>
                      <option value="Clubs">Clubs</option>
                      <option value="Challenges">Challenges</option>
                      <option value="Verification">Verification</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-8">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({ ...formData, is_active: e.target.checked })
                      }
                      className="w-5 h-5 bg-white/5 border border-white/10 rounded"
                    />
                    <label htmlFor="is_active" className="text-white/70">
                      Active
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Verify your email - {{userName}}"
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none"
                  />
                  <p className="text-xs text-white/50 mt-1">
                    Use {'{{variableName}}'} for dynamic content
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Variables (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.variables.join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        variables: e.target.value.split(',').map((v) => v.trim()),
                      })
                    }
                    placeholder="e.g., userName, verificationLink"
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    HTML Content *
                  </label>
                  <textarea
                    value={formData.html_content}
                    onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                    placeholder="HTML email content..."
                    rows={8}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Text Content *
                  </label>
                  <textarea
                    value={formData.text_content}
                    onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
                    placeholder="Plain text fallback content..."
                    rows={6}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none font-mono text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              {modalMode !== 'preview' && (
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-6 py-3 bg-gold-500 text-chess-darker font-bold rounded-xl hover:bg-gold-400 transition-colors"
                >
                  {modalMode === 'create' ? 'Create Template' : 'Save Changes'}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Test Email Modal */}
      {showTestModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-chess-darker border border-white/10 rounded-2xl p-8 max-w-2xl w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Send className="w-7 h-7 text-gold-400" />
                Send Test Email
              </h2>
              <button
                onClick={() => setShowTestModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white/70" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Test Email Address
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Sample Variables
                </label>
                <div className="space-y-2">
                  {selectedTemplate.variables.map((varName) => (
                    <div key={varName} className="flex gap-3 items-center">
                      <label className="text-white/60 w-32">{varName}:</label>
                      <input
                        type="text"
                        value={sampleVariables[varName] || ''}
                        onChange={(e) =>
                          setSampleVariables({ ...sampleVariables, [varName]: e.target.value })
                        }
                        placeholder={`Enter ${varName}...`}
                        className="flex-1 p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
              <button
                onClick={() => setShowTestModal(false)}
                className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTest}
                className="flex-1 px-6 py-3 bg-gold-500 text-chess-darker font-bold rounded-xl hover:bg-gold-400 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send Test
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminEmailTemplates;
