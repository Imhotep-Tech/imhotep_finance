import { useEffect, useState } from 'react';
import axios from 'axios';
import Footer from '../../components/common/Footer';

/**
 * OAuth2 Test Page - For testing the OAuth2 flow
 * This page helps developers test the complete OAuth2 authorization flow
 */
const OAuthTestPage = () => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testResult, setTestResult] = useState(null);

  const baseUrl = window.location.origin.replace(':3000', ':8000');
  const redirectUri = `${window.location.origin}/developer/oauth-test`;

  // Detect authorization code from URL once on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');
    if (codeFromUrl) {
      setAuthCode(codeFromUrl);
      setSuccess('Authorization code detected from URL!');
    }
    // We intentionally run this only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  // Step 1: Generate Authorization URL
  const generateAuthUrl = () => {
    resetMessages();

    if (!clientId) {
      setError('Please enter your Client ID');
      return;
    }

    const scope = 'transactions:write';
    const authUrl = `${baseUrl}/o/authorize/?response_type=code&client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;

    // Open in new window
    window.open(authUrl, '_blank', 'width=600,height=700');
    setSuccess('Authorization window opened. After authorizing, you will be redirected back with a code.');
  };

  // Step 2: Exchange code for token
  const exchangeCodeForToken = async () => {
    resetMessages();

    if (!authCode || !clientId || !clientSecret) {
      setError('Please fill in Authorization Code, Client ID, and Client Secret');
      return;
    }

    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('grant_type', 'authorization_code');
      formData.append('code', authCode);
      formData.append('redirect_uri', redirectUri);
      formData.append('client_id', clientId);
      formData.append('client_secret', clientSecret);

      const response = await axios.post(`${baseUrl}/o/token/`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      setAccessToken(response.data.access_token);
      setSuccess('Access token obtained successfully!');
      setAuthCode(''); // Clear code after use
    } catch (err) {
      setError(
        err.response?.data?.error_description ||
        err.response?.data?.error ||
        'Failed to exchange code for token'
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Test creating a transaction
  const testCreateTransaction = async () => {
    resetMessages();

    if (!accessToken) {
      setError('Please get an access token first');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${baseUrl}/api/v1/external/transaction/add/`,
        {
          amount: '25.00',
          currency: 'USD',
          trans_status: 'deposit',
          category: 'OAuth2 Test',
          trans_details: 'Test transaction created via OAuth2 API',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setTestResult({
        type: 'create',
        success: true,
        data: response.data,
      });
      setSuccess('Transaction created successfully!');
    } catch (err) {
      setTestResult({
        type: 'create',
        success: false,
        error: err.response?.data || err.message,
      });
      setError(err.response?.data?.error || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Test deleting a transaction
  const testDeleteTransaction = async () => {
    resetMessages();

    if (!accessToken) {
      setError('Please get an access token first');
      return;
    }

    if (!testResult?.data?.transaction_id) {
      setError('Please create a transaction first');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.delete(
        `${baseUrl}/api/v1/external/transaction/delete/${testResult.data.transaction_id}/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setTestResult({
        type: 'delete',
        success: true,
        data: response.data,
      });
      setSuccess('Transaction deleted successfully!');
    } catch (err) {
      setTestResult({
        type: 'delete',
        success: false,
        error: err.response?.data || err.message,
      });
      setError(err.response?.data?.error || 'Failed to delete transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen overflow-y-auto pb-8 bg-[var(--bg)] text-[var(--text)] transition-colors relative"
    >
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 left-8 w-28 h-28 rounded-full filter blur-xl opacity-20 animate-float bg-[#366c6b] mix-blend-multiply dark:bg-emerald-600/40 dark:mix-blend-screen"></div>
        <div className="absolute top-40 right-8 w-24 h-24 rounded-full filter blur-xl opacity-18 animate-float bg-[rgba(26,53,53,0.9)] dark:bg-teal-800/40" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-16 left-1/3 w-36 h-36 rounded-full filter blur-xl opacity-16 animate-float bg-[#2f7775] dark:bg-cyan-700/30 dark:mix-blend-screen" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="chef-card rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold font-chef text-gray-900 dark:text-gray-100 mb-2">
            OAuth2 Flow Tester
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3">
            Test the complete OAuth2 authorization flow and Public API calls using your
            developer credentials.
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Use this tool after you create an application in the Developer Portal to make
            sure your OAuth2 integration works end-to-end.
          </p>
        </div>

        {/* Error/Success Messages */}
        {(error || success) && (
          <div className="space-y-3">
            {error && (
              <div className="rounded-2xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/70 p-4 text-red-700 dark:text-red-200 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-2xl border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/70 p-4 text-green-700 dark:text-green-200 text-sm">
                {success}
              </div>
            )}
          </div>
        )}

        {/* Step 1: Enter Credentials */}
        <section className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-lg border border-gray-200/80 dark:border-gray-800/80 p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Step 1: Enter Your Application Credentials
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">
                Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#366c6b]"
                placeholder="Your OAuth2 Client ID from the Developer Portal"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">
                Client Secret
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#366c6b]"
                placeholder="Your OAuth2 Client Secret"
              />
            </div>
          </div>
        </section>

        {/* Step 2: Authorize */}
        <section className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-lg border border-gray-200/80 dark:border-gray-800/80 p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
            Step 2: Authorize Application
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
            Click the button below to open the authorization page. After approving access, you
            will be redirected back to{' '}
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-[11px] sm:text-xs">
              {redirectUri}
            </code>{' '}
            with an authorization code.
          </p>
          <button
            onClick={generateAuthUrl}
            disabled={!clientId}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#366c6b] text-white text-sm font-semibold shadow-md hover:bg-[#285150] disabled:opacity-60"
          >
            Open Authorization Page
          </button>
        </section>

        {/* Step 3: Exchange Code */}
        <section className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-lg border border-gray-200/80 dark:border-gray-800/80 p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Step 3: Exchange Code for Access Token
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200">
                Authorization Code
              </label>
              <input
                type="text"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#366c6b]"
                placeholder="Paste the ?code= value from the redirect URL"
              />
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                The URL will look like:{' '}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                  {redirectUri}?code=...
                </code>
              </p>
            </div>
            <button
              onClick={exchangeCodeForToken}
              disabled={loading || !authCode}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-60"
            >
              {loading ? 'Exchanging...' : 'Exchange Code for Token'}
            </button>
            {accessToken && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-950 rounded-lg border border-gray-200/80 dark:border-gray-800/80">
                <p className="text-[11px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Access Token
                </p>
                <code className="block text-[11px] sm:text-xs break-all">
                  {accessToken}
                </code>
              </div>
            )}
          </div>
        </section>

        {/* Step 4: Test API */}
        <section className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-lg border border-gray-200/80 dark:border-gray-800/80 p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Step 4: Test Public API
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-3">
            <button
              onClick={testCreateTransaction}
              disabled={loading || !accessToken}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create Test Transaction'}
            </button>
            <button
              onClick={testDeleteTransaction}
              disabled={loading || !accessToken || !testResult?.data?.transaction_id}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60"
            >
              {loading ? 'Deleting...' : 'Delete Test Transaction'}
            </button>
          </div>

          {/* Test Results */}
          {testResult && (
            <div
              className={`mt-4 p-4 rounded-2xl border text-xs sm:text-sm ${
                testResult.success
                  ? 'bg-green-50 dark:bg-green-900/70 border-green-200 dark:border-green-700 text-green-800 dark:text-green-100'
                  : 'bg-red-50 dark:bg-red-900/70 border-red-200 dark:border-red-700 text-red-800 dark:text-red-100'
              }`}
            >
              <p className="font-semibold mb-2">
                {testResult.success ? '✓ Request Succeeded' : '✗ Request Failed'}
              </p>
              <pre className="text-[11px] sm:text-xs overflow-auto max-h-64">
                {JSON.stringify(testResult.data || testResult.error, null, 2)}
              </pre>
            </div>
          )}
        </section>

        {/* Instructions */}
        <section className="rounded-2xl border border-blue-200/80 dark:border-blue-800/80 bg-blue-50/90 dark:bg-blue-900/70 p-5 sm:p-6">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100 text-sm sm:text-base">
            Quick Guide
          </h3>
          <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            <li>Go to the Developer Portal and create an OAuth2 application.</li>
            <li>Copy the Client ID and Client Secret into Step 1 above.</li>
            <li>Click &quot;Open Authorization Page&quot; and approve access.</li>
            <li>After redirect, confirm the code is filled in Step 3 (or paste it manually).</li>
            <li>Exchange the code for an access token.</li>
            <li>Use the token to create and delete test transactions via the Public API.</li>
          </ol>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default OAuthTestPage;
