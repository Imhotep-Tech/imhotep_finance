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

    setActionLoading((prev) => ({ ...prev, [appId]: true }));
    try {
      await axios.delete(`/api/developer/apps/${appId}/`);
      setApplications((prev) => prev.filter(app => app.id !== appId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete application');
    } finally {
      setActionLoading((prev) => ({ ...prev, [appId]: false }));
    }
  };

  // Handle add Swagger redirect URI
  const handleAddSwaggerUri = async (appId) => {
    setActionLoading((prev) => ({ ...prev, [`swagger_${appId}`]: true }));
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
      setActionLoading((prev) => ({ ...prev, [`swagger_${appId}`]: false }));
    }
  };

  // Handle regenerate secret
  const handleRegenerateSecret = async (appId) => {
    if (!window.confirm('Are you sure you want to regenerate the client secret? The old secret will no longer work.')) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [`regenerate_${appId}`]: true }));
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
      setActionLoading((prev) => ({ ...prev, [`regenerate_${appId}`]: false }));
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
    <div
      className="min-h-screen overflow-y-auto pb-8 bg-[var(--bg)] text-[var(--text)] transition-colors relative"
    >
      {/* Floating decorative elements (match main dashboard feel) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 left-10 w-28 h-28 rounded-full filter blur-xl opacity-20 animate-float bg-[#366c6b] mix-blend-multiply dark:bg-emerald-600/40 dark:mix-blend-screen"></div>
        <div className="absolute top-40 right-12 w-24 h-24 rounded-full filter blur-xl opacity-18 animate-float bg-[rgba(26,53,53,0.9)] dark:bg-teal-800/40" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-16 left-1/3 w-36 h-36 rounded-full filter blur-xl opacity-16 animate-float bg-[#2f7775] dark:bg-cyan-700/30 dark:mix-blend-screen" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="chef-card rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-chef text-gray-900 dark:text-gray-100 mb-1">
                Developer Portal
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                Manage your OAuth2 applications and API keys.
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#366c6b] text-white text-sm sm:text-base font-semibold shadow-md hover:bg-[#285150] transition-colors w-full sm:w-auto"
              >
                <span className="mr-2 text-lg">＋</span>
                Create Application
              </button>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Use OAuth2 to securely access Imhotep Finance APIs from your applications.
          </p>
        </div>

        {/* New App Success Alert */}
        {newlyCreatedApp && (
          <div className="rounded-2xl border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/60 p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-1">
                  Application Created Successfully
                </h3>
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mb-3">
                  <strong>Important:</strong> Save your Client Secret now. It will not be shown again.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-green-800 dark:text-green-200">
                      Client ID
                    </label>
                    <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2">
                      <code className="flex-1 p-2 bg-white dark:bg-gray-900 rounded border text-[11px] sm:text-xs font-mono break-all">
                        {newlyCreatedApp.client_id}
                      </code>
                      <button
                        onClick={() => copyToClipboard(newlyCreatedApp.client_id, 'Client ID')}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium w-full sm:w-auto"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-green-800 dark:text-green-200">
                      Client Secret
                    </label>
                    <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2">
                      <code className="flex-1 p-2 bg-white dark:bg-gray-900 rounded border text-[11px] sm:text-xs font-mono break-all">
                        {newlyCreatedApp.client_secret}
                      </code>
                      <button
                        onClick={() => copyToClipboard(newlyCreatedApp.client_secret, 'Client Secret')}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium w-full sm:w-auto"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setNewlyCreatedApp(null)}
                className="self-start text-green-800 dark:text-green-200 hover:text-green-900 dark:hover:text-green-100"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-2xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/60 p-4 sm:p-5 text-red-700 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Applications List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#366c6b]"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">
                Loading applications...
              </p>
            </div>
          ) : applications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">
                You have not created any OAuth2 applications yet.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#366c6b] text-white text-sm font-semibold shadow-md hover:bg-[#285150] transition-colors"
              >
                <span className="mr-2 text-lg">＋</span>
                Create Your First Application
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="metric-card bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-lg border border-gray-200/80 dark:border-gray-800/80 p-5 sm:p-6 flex flex-col h-full"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {app.name}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Created {new Date(app.created).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-row md:flex-col gap-2">
                      {!app.redirect_uris.includes('/swagger/oauth2-redirect.html') && (
                        <button
                          onClick={() => handleAddSwaggerUri(app.id)}
                          disabled={actionLoading[`swagger_${app.id}`]}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium disabled:opacity-60"
                          title="Add Swagger redirect URI (http://127.0.0.1:8000/swagger/oauth2-redirect.html) for testing in Swagger UI"
                        >
                          {actionLoading[`swagger_${app.id}`] ? 'Adding...' : 'Add Swagger URI'}
                        </button>
                      )}
                      <button
                        onClick={() => handleRegenerateSecret(app.id)}
                        disabled={actionLoading[`regenerate_${app.id}`]}
                        className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-xs font-medium disabled:opacity-60"
                      >
                        {actionLoading[`regenerate_${app.id}`] ? 'Regenerating...' : 'Regenerate Secret'}
                      </button>
                      <button
                        onClick={() => handleDelete(app.id, app.name)}
                        disabled={actionLoading[app.id]}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium disabled:opacity-60"
                      >
                        {actionLoading[app.id] ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 space-y-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    <div>
                      <p className="font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Client ID
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <code className="flex-1 p-2 bg-gray-50 dark:bg-gray-950 rounded border text-[11px] sm:text-xs font-mono break-all">
                          {app.client_id}
                        </code>
                        <button
                          onClick={() => copyToClipboard(app.client_id, 'Client ID')}
                          className="px-2.5 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-[11px] font-medium w-full sm:w-auto"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <p>
                        <span className="font-semibold text-gray-600 dark:text-gray-400">
                          Client Type:
                        </span>
                        <span className="ml-1 capitalize">{app.client_type}</span>
                      </p>
                      <p>
                        <span className="font-semibold text-gray-600 dark:text-gray-400">
                          Grant Type:
                        </span>
                        <span className="ml-1">{app.authorization_grant_type}</span>
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Redirect URIs
                      </p>
                      <div className="space-y-1 max-h-32 overflow-auto pr-1">
                        {app.redirect_uris.split('\n').map((uri, idx) => (
                          <code
                            key={idx}
                            className="block text-[11px] sm:text-xs bg-gray-50 dark:bg-gray-950 p-1.5 rounded border border-gray-200/80 dark:border-gray-800/80 break-all"
                          >
                            {uri}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documentation Section */}
        <div className="rounded-2xl border border-blue-200/80 dark:border-blue-800/80 bg-blue-50/90 dark:bg-blue-900/60 p-6 sm:p-7 mt-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Public API & OAuth2 Overview
          </h2>
          <div className="space-y-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            <p>
              Use your Client ID and Client Secret to implement OAuth2 authentication in your
              application and call the Imhotep Finance Public API.
            </p>
            <div>
              <h3 className="font-semibold mb-1.5">Standard OAuth2 Authorization Code Flow</h3>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>
                  Redirect users to{' '}
                  <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">
                    /o/authorize/
                  </code>
                  .
                </li>
                <li>
                  After the user approves access, they are redirected back to your{' '}
                  <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">
                    redirect_uri
                  </code>{' '}
                  with an authorization code.
                </li>
                <li>
                  Exchange the code for an access token at{' '}
                  <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">
                    /o/token/
                  </code>
                  .
                </li>
                <li>
                  Use the access token to call the Public API at{' '}
                  <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">
                    /api/v1/external/
                  </code>
                  .
                </li>
              </ol>
            </div>
            <div className="pt-2">
              <a
                href="https://github.com/Imhotep-Tech/imhotep_finance/blob/main/.docs/oauth2-public-api.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium text-[#366c6b] dark:text-teal-300 hover:underline"
              >
                View Full API Documentation
                <span className="ml-1">↗</span>
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
