import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api/client';

const AdminEmailTest = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await api.post('/admin/test-email', { email });
      setResult({
        success: true,
        message: response.data.message || 'Test email sent successfully! Check your inbox.',
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.response?.data?.error || 'Failed to send test email. Check server logs.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Email System Test</h1>
        <p className="text-white/60">Send a test email to verify your email configuration</p>
      </div>

      <div className="max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Send Test Email</h2>
              <p className="text-sm text-white/60">Verify Resend configuration</p>
            </div>
          </div>

          <form onSubmit={handleSendTest} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
                Test Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none"
              />
              <p className="text-xs text-white/50 mt-2">
                A test email will be sent to this address
              </p>
            </div>

            {result && (
              <div
                className={`p-4 rounded-lg border ${
                  result.success
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={result.success ? 'text-green-400' : 'text-red-400'}>
                      {result.message}
                    </p>
                    {result.success && (
                      <p className="text-sm text-white/60 mt-2">
                        Check your spam folder if you don't see it in your inbox.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Test Email
                </>
              )}
            </button>
          </form>

          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-400 mb-2">Configuration Check</h3>
            <div className="text-sm text-white/70 space-y-1">
              <p>Required environment variables in Railway:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-white/60">
                <li><code className="text-primary-400">RESEND_API_KEY</code></li>
                <li><code className="text-primary-400">EMAIL_FROM</code> (e.g., noreply@chessfam.com)</li>
                <li><code className="text-primary-400">EMAIL_FROM_NAME</code> (e.g., ChessFam)</li>
                <li><code className="text-primary-400">FRONTEND_URL</code> (e.g., https://chessfam.com)</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminEmailTest;
