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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Create New OAuth2 Application</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 rounded text-red-700 dark:text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Application Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., My Todo App"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Client Type <span className="text-red-500">*</span>
              </label>
              <select
                name="client_type"
                value={formData.client_type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="confidential">Confidential (Server-side apps)</option>
                <option value="public">Public (Client-side apps)</option>
              </select>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Use "Confidential" for server-side applications, "Public" for client-side apps (mobile, SPA).
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Authorization Grant Type <span className="text-red-500">*</span>
              </label>
              <select
                name="authorization_grant_type"
                value={formData.authorization_grant_type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="authorization-code">Authorization Code (Recommended)</option>
                <option value="implicit">Implicit</option>
                <option value="password">Resource Owner Password-Based</option>
                <option value="client-credentials">Client Credentials</option>
              </select>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Use "Authorization Code" for standard OAuth2 flow.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Redirect URIs <span className="text-red-500">*</span>
              </label>
              <textarea
                name="redirect_uris"
                value={formData.redirect_uris}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="https://myapp.com/callback&#10;https://myapp.com/callback2"
              />
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Enter one URI per line. Must start with http:// or https://
              </p>
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                ℹ️ The Swagger redirect URI will be automatically added for API testing via Swagger UI.
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="skip_authorization"
                id="skip_authorization"
                checked={formData.skip_authorization}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="skip_authorization" className="ml-2 text-sm">
                Skip authorization (auto-approve)
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors"
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
