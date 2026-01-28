import { useState } from 'react';
import axios from 'axios';

const CreateAppModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    client_type: 'confidential',
    authorization_grant_type: 'authorization-code',
    redirect_uris: '',
    skip_authorization: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/developer/apps/', formData);
      onSuccess(response.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.redirect_uris?.[0] ||
        'Failed to create application'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/95 dark:bg-gray-900/95">
        <div className="p-5 sm:p-6 md:p-8">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                Create New OAuth2 Application
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Define how your application will authenticate with Imhotep Finance using OAuth2.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/80 px-3 py-2 text-xs sm:text-sm text-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">
                Application Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#366c6b]"
                placeholder="e.g., My Todo App"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">
                  Client Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="client_type"
                  value={formData.client_type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#366c6b]"
                >
                  <option value="confidential">Confidential (Server-side apps)</option>
                  <option value="public">Public (Client-side apps)</option>
                </select>
                <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-400">
                  Use &quot;Confidential&quot; for backend or server-rendered apps,
                  &quot;Public&quot; for SPAs or mobile apps.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">
                  Authorization Grant Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="authorization_grant_type"
                  value={formData.authorization_grant_type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#366c6b]"
                >
                  <option value="authorization-code">Authorization Code (Recommended)</option>
                  <option value="implicit">Implicit</option>
                  <option value="password">Resource Owner Password-Based</option>
                  <option value="client-credentials">Client Credentials</option>
                </select>
                <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-400">
                  For most web and mobile apps, use the Authorization Code flow.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">
                Redirect URIs <span className="text-red-500">*</span>
              </label>
              <textarea
                name="redirect_uris"
                value={formData.redirect_uris}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#366c6b] font-mono"
                placeholder={
                  'https://myapp.com/oauth/callback\nhttp://localhost:3000/developer/oauth-test'
                }
              />
              <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-400">
                Enter one URI per line. Each must start with <code>http://</code> or{' '}
                <code>https://</code>.
              </p>
              <p className="mt-1 text-[11px] text-blue-600 dark:text-blue-400">
                ℹ️ The Swagger redirect URI will be automatically added for testing via Swagger
                UI.
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-gray-50 dark:bg-gray-900 px-3 py-2">
              <input
                type="checkbox"
                name="skip_authorization"
                id="skip_authorization"
                checked={formData.skip_authorization}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-[#366c6b] border-gray-300 dark:border-gray-600 rounded focus:ring-[#366c6b]"
              />
              <div>
                <label
                  htmlFor="skip_authorization"
                  className="block text-sm font-medium text-gray-800 dark:text-gray-200"
                >
                  Skip user authorization step
                </label>
                <p className="text-[11px] text-gray-600 dark:text-gray-400">
                  When enabled, the user consent screen will be skipped and access will be
                  auto-approved for this application.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#366c6b] hover:bg-[#285150] text-white text-sm font-semibold shadow-md disabled:opacity-60 transition-colors"
              >
                {loading ? 'Creating...' : 'Create Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAppModal;
