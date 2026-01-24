import { useState } from 'react';
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

  // Step 1: Generate Authorization URL
  const generateAuthUrl = () => {
    if (!clientId) {
      setError('Please enter your Client ID');
      return;
    }
    
    const scope = 'transactions:write';
    const authUrl = `${baseUrl}/o/authorize/?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
    
    // Open in new window
    window.open(authUrl, '_blank', 'width=600,height=700');
    setSuccess('Authorization window opened. After authorizing, paste the code from the redirect URL.');
  };

  // Step 2: Exchange code for token
  const exchangeCodeForToken = async () => {
    if (!authCode || !clientId || !clientSecret) {
      setError('Please fill in Authorization Code, Client ID, and Client Secret');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

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
      setError(err.response?.data?.error_description || err.response?.data?.error || 'Failed to exchange code for token');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Test creating a transaction
  const testCreateTransaction = async () => {
    if (!accessToken) {
      setError('Please get an access token first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

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
    if (!accessToken) {
      setError('Please get an access token first');
      return;
    }

    if (!testResult?.data?.transaction_id) {
      setError('Please create a transaction first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

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

  // Check for authorization code in URL
  const urlParams = new URLSearchParams(window.location.search);
  const codeFromUrl = urlParams.get('code');
  if (codeFromUrl && !authCode) {
    setAuthCode(codeFromUrl);
    setSuccess('Authorization code detected from URL!');
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">OAuth2 Flow Tester</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Test the complete OAuth2 authorization flow and API calls
        </p>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 rounded-lg text-red-700 dark:text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 rounded-lg text-green-700 dark:text-green-200">
            {success}
          </div>
        )}

        {/* Step 1: Enter Credentials */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Enter Your Application Credentials</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Client ID</label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="Your OAuth2 Client ID"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Client Secret</label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="Your OAuth2 Client Secret"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Authorize */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 2: Authorize Application</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Click the button below to open the authorization page. After authorizing, you'll be redirected back with an authorization code.
          </p>
          <button
            onClick={generateAuthUrl}
            disabled={!clientId}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50"
          >
            Open Authorization Page
          </button>
        </div>

        {/* Step 3: Exchange Code */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 3: Exchange Code for Token</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Authorization Code</label>
              <input
                type="text"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono text-sm"
                placeholder="Paste the code from the redirect URL"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                The code should be in the URL: {redirectUri}?code=...
              </p>
            </div>
            <button
              onClick={exchangeCodeForToken}
              disabled={loading || !authCode}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Exchanging...' : 'Exchange Code for Token'}
            </button>
            {accessToken && (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-900 rounded border">
                <p className="text-xs font-semibold mb-1">Access Token:</p>
                <code className="text-xs break-all">{accessToken}</code>
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Test API */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 4: Test Public API</h2>
          <div className="space-y-4">
            <button
              onClick={testCreateTransaction}
              disabled={loading || !accessToken}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 mr-2"
            >
              {loading ? 'Creating...' : 'Create Test Transaction'}
            </button>
            <button
              onClick={testDeleteTransaction}
              disabled={loading || !accessToken || !testResult?.data?.transaction_id}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete Test Transaction'}
            </button>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className={`mt-4 p-4 rounded-lg border ${
              testResult.success 
                ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700' 
                : 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700'
            }`}>
              <p className="font-semibold mb-2">
                {testResult.success ? '✓ Success' : '✗ Failed'}
              </p>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(testResult.data || testResult.error, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>Get your Client ID and Secret from the Developer Portal</li>
            <li>Enter them in Step 1</li>
            <li>Click "Open Authorization Page" and authorize the application</li>
            <li>After authorization, paste the code from the redirect URL</li>
            <li>Exchange the code for an access token</li>
            <li>Test creating and deleting transactions</li>
          </ol>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OAuthTestPage;
