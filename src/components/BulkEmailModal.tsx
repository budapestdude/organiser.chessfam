import { useState } from 'react';
import { Mail, X, Send, Eye } from 'lucide-react';

interface BulkEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (subject: string, body: string) => Promise<void>;
  recipientCount: number;
  recipientType: 'participants' | 'members';
}

export default function BulkEmailModal({
  isOpen,
  onClose,
  onSend,
  recipientCount,
  recipientType,
}: BulkEmailModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      alert('Please fill in both subject and message');
      return;
    }

    if (!confirm(`Send this email to ${recipientCount} ${recipientType}?`)) {
      return;
    }

    setSending(true);
    try {
      await onSend(subject, body);
      alert(`Email sent successfully to ${recipientCount} ${recipientType}!`);
      setSubject('');
      setBody('');
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const insertVariable = (variable: string) => {
    setBody(body + `{{${variable}}}`);
  };

  const previewBody = body
    .replace(/\{\{name\}\}/g, 'John Doe')
    .replace(/\{\{event_name\}\}/g, recipientType === 'participants' ? 'Sample Tournament' : 'Sample Club')
    .replace(/\{\{email\}\}/g, 'example@email.com');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Send Email to {recipientCount} {recipientType}
              </h2>
              <p className="text-sm text-white/60">
                Compose a message to send to selected {recipientType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={sending}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Variables Help */}
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-400 mb-2">Available variables:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => insertVariable('name')}
              className="px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              {'{{name}}'} - Recipient's name
            </button>
            <button
              onClick={() => insertVariable('email')}
              className="px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              {'{{email}}'} - Recipient's email
            </button>
            <button
              onClick={() => insertVariable('event_name')}
              className="px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              {'{{event_name}}'} - Event name
            </button>
          </div>
        </div>

        {!showPreview ? (
          <>
            {/* Subject */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Subject <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject..."
                disabled={sending}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-gold-400 focus:outline-none transition-colors disabled:opacity-50"
              />
            </div>

            {/* Body */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={`Enter your message here...\n\nYou can use variables like {{name}} to personalize the email.`}
                disabled={sending}
                rows={12}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-gold-400 focus:outline-none transition-colors resize-y disabled:opacity-50"
              />
              <p className="text-xs text-white/40 mt-2">
                {body.length} characters
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Preview */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Email Preview</h3>
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <div className="mb-4 pb-4 border-b border-white/10">
                  <p className="text-sm text-white/60 mb-1">Subject:</p>
                  <p className="text-white font-medium">{subject}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60 mb-2">Message:</p>
                  <div className="text-white whitespace-pre-wrap">{previewBody}</div>
                </div>
              </div>
              <p className="text-xs text-white/40 mt-2">
                This is how the email will appear with sample data. Variables will be replaced with actual recipient data.
              </p>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            disabled={sending || !subject.trim() || !body.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className="w-4 h-4" />
            <span>{showPreview ? 'Edit' : 'Preview'}</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={sending}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-400 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Email</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
