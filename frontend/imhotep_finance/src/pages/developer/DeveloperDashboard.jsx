import { useState, useEffect } from 'react';
import axios from 'axios';
import Footer from '../../components/common/Footer';
import CreateAppModal from '../../components/developer/CreateAppModal';

const DeveloperDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [showSecret, setShowSecret] = useState({}); // Track which secrets are visible
  const [newlyCreatedApp, setNewlyCreatedApp] = useState(null); // Store newly created app with secret

  // Fetch applications
  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('/api/developer/apps/');
        setApplications(res.data || []);
      } catch (err) {
        setError(
          err.response?.data?.error ||
          'Failed to fetch applications'
        );
        setApplications([]);
      }
      setLoading(false);
    };
    fetchApplications();
  }, [showCreateModal]);

  // Handle app creation success
  const handleAppCreated = (appData) => {
    setNewlyCreatedApp(appData);
    setShowCreateModal(false);
    // Refresh the list
    const fetchApplications = async () => {
      try {
        const res = await axios.get('/api/developer/apps/');
        setApplications(res.data || []);
      } catch (err) {
        console.error('Failed to refresh applications:', err);
      }
    };
    fetchApplications();
  };

  // Handle delete application
  const handleDelete = async (appId, appName) => {
    if (!window.confirm(`Are you sure you want to delete "${appName}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading({ ...actionLoading, [appId]: true });
    try {
      await axios.delete(`/api/developer/apps/${appId}/`);
      setApplications(applications.filter(app => app.id !== appId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete application');
    } finally {
      setActionLoading({ ...actionLoading, [appId]: false });
    }
  };

  // Handle add Swagger redirect URI
  const handleAddSwaggerUri = async (appId) => {
    setActionLoading({ ...actionLoading, [`swagger_${appId}`]: true });
    try {
      const res = await axios.post(`/api/developer/apps/${appId}/add-swagger-uri/`);
      alert(res.data.message || 'Swagger redirect URI added successfully!');
      // Refresh the list
      const fetchApplications = async () => {
        try {
          const res = await axios.get('/api/developer/apps/');
          setApplications(res.data || []);
        } catch (err) {
          console.error('Failed to refresh applications:', err);
        }
      };
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add Swagger redirect URI');
    } finally {
      setActionLoading({ ...actionLoading, [`swagger_${appId}`]: false });
    }
  };

  // Handle regenerate secret
  const handleRegenerateSecret = async (appId) => {
    if (!window.confirm('Are you sure you want to regenerate the client secret? The old secret will no longer work.')) {
      return;
    }

    setActionLoading({ ...actionLoading, [`regenerate_${appId}`]: true });
    try {
      const res = await axios.post(`/api/developer/apps/${appId}/regenerate-secret/`);
      // Show the new secret
      setNewlyCreatedApp({
        id: res.data.id,
        name: res.data.name,
        client_id: res.data.client_id,
        client_secret: res.data.client_secret,
      });
      // Refresh the list
      const fetchApplications = async () => {
        try {
          const res = await axios.get('/api/developer/apps/');
          setApplications(res.data || []);
        } catch (err) {
          console.error('Failed to refresh applications:', err);
        }
      };
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to regenerate secret');
    } finally {
      setActionLoading({ ...actionLoading, [`regenerate_${appId}`]: false });
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`${label} copied to clipboard!`);
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Developer Portal</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your OAuth2 applications and API keys
          </p>
        </div>

        {/* New App Success Alert */}
        {newlyCreatedApp && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 rounded-lg">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  Application Created Successfully!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                  <strong>Important:</strong> Save your Client Secret now. It will not be shown again.
                </p>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-semibold text-green-800 dark:text-green-200">Client ID:</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 p-2 bg-white dark:bg-gray-800 rounded border text-sm font-mono">
                        {newlyCreatedApp.client_id}
                      </code>
                      <button
                        onClick={() => copyToClipboard(newlyCreatedApp.client_id, 'Client ID')}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-green-800 dark:text-green-200">Client Secret:</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 p-2 bg-white dark:bg-gray-800 rounded border text-sm font-mono">
                        {newlyCreatedApp.client_secret}
                      </code>
                      <button
                        onClick={() => copyToClipboard(newlyCreatedApp.client_secret, 'Client Secret')}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setNewlyCreatedApp(null)}
                className="text-green-800 dark:text-green-200 hover:text-green-900 dark:hover:text-green-100"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Create App Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            + Create New Application
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 rounded-lg text-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Applications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No applications yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
            >
              Create Your First Application
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{app.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-semibold text-gray-600 dark:text-gray-400">Client ID:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 p-2 bg-gray-100 dark:bg-gray-900 rounded border text-xs font-mono">
                            {app.client_id}
                          </code>
                          <button
                            onClick={() => copyToClipboard(app.client_id, 'Client ID')}
                            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-xs"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-600 dark:text-gray-400">Client Type:</span>
                        <span className="ml-2 capitalize">{app.client_type}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-600 dark:text-gray-400">Grant Type:</span>
                        <span className="ml-2">{app.authorization_grant_type}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-600 dark:text-gray-400">Redirect URIs:</span>
                        <div className="mt-1">
                          {app.redirect_uris.split('\n').map((uri, idx) => (
                            <code key={idx} className="block text-xs bg-gray-100 dark:bg-gray-900 p-1 rounded mb-1">
                              {uri}
                            </code>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-600 dark:text-gray-400">Created:</span>
                        <span className="ml-2">
                          {new Date(app.created).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    {!app.redirect_uris.includes('/swagger/oauth2-redirect.html') && (
                      <button
                        onClick={() => handleAddSwaggerUri(app.id)}
                        disabled={actionLoading[`swagger_${app.id}`]}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-50"
                        title="Add Swagger redirect URI (http://127.0.0.1:8000/swagger/oauth2-redirect.html) for testing in Swagger UI"
                      >
                        {actionLoading[`swagger_${app.id}`] ? 'Adding...' : 'Add Swagger URI'}
                      </button>
                    )}
                    <button
                      onClick={() => handleRegenerateSecret(app.id)}
                      disabled={actionLoading[`regenerate_${app.id}`]}
                      className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm disabled:opacity-50"
                    >
                      {actionLoading[`regenerate_${app.id}`] ? 'Regenerating...' : 'Regenerate Secret'}
                    </button>
                    <button
                      onClick={() => handleDelete(app.id, app.name)}
                      disabled={actionLoading[app.id]}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm disabled:opacity-50"
                    >
                      {actionLoading[app.id] ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Documentation Section */}
        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
          <h2 className="text-xl font-semibold mb-4">API Documentation</h2>
          <div className="space-y-3 text-sm">
            <p className="text-gray-700 dark:text-gray-300">
              Use your Client ID and Client Secret to implement OAuth2 authentication in your application.
            </p>
            <div>
              <h3 className="font-semibold mb-2">OAuth2 Flow:</h3>
              <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>Redirect users to: <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">/o/authorize/</code></li>
                <li>User grants permission and is redirected back with an authorization code</li>
                <li>Exchange the code for an access token at <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">/o/token/</code></li>
                <li>Use the access token to make API calls to <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">/api/v1/external/</code></li>
              </ol>
            </div>
            <div className="mt-4">
              <a
                href="/swagger/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                View Full API Documentation →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Create App Modal */}
      {showCreateModal && (
        <CreateAppModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleAppCreated}
        />
      )}

      <Footer />
    </div>
  );
};

export default DeveloperDashboard;
