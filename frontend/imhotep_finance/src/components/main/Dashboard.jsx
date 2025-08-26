import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import Footer from '../common/Footer';
import Logo from '../../assets/Logo.jpeg';

const Dashboard = () => {
  const { user } = useAuth();
  const [editorOpen, setEditorOpen] = useState(false);
  const [portfolioCode, setPortfolioCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Fetch portfolio code once on mount
  useEffect(() => {
    axios
      .get('/api/portfolio/my/get/')
      .then(res => {
        if (res.data?.user_code_status) {
          setPortfolioCode(res.data.user_code || '');
        } else {
          setPortfolioCode('');
        }
      })
      .catch(() => {
        setPortfolioCode('');
      });
  }, []);

  // Fetch portfolio code again every time editorOpen changes to true
  useEffect(() => {
    if (editorOpen) {
      setLoading(true);
      setError('');
      setSuccess('');
      axios
        .get('/api/portfolio/my/get/')
        .then(res => {
          if (res.data?.user_code_status) {
            setPortfolioCode(res.data.user_code || '');
          } else {
            setPortfolioCode('');
          }
        })
        .catch(() => {
          setPortfolioCode('');
        })
        .finally(() => setLoading(false));
    }
  }, [editorOpen]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    if (!portfolioCode || !portfolioCode.trim()) {
      setError('Portfolio code cannot be empty.');
      setSaving(false);
      return;
    }
    try {
      await axios.post('/api/portfolio/save/', { user_code: portfolioCode });
      setSuccess('Portfolio saved successfully!');
    } catch (err) {
      setError('Failed to save portfolio.');
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 bg-chef-pattern">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-40 w-40 h-40 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="chef-card rounded-3xl p-6 sm:p-8 lg:p-12 shadow-2xl border border-white/30 backdrop-blur-2xl bg-white/90 text-center">
          <div className="flex flex-col items-center mb-8">
            {/* Header with Chef Logo and Brand */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full mb-4 shadow-lg border-4 border-white">
              <img 
                src={Logo} 
                alt="Logo" 
                className="w-14 h-14 object-contain"
              />
            </div>
            <div
              className="font-extrabold text-3xl sm:text-4xl mb-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent font-chef drop-shadow-lg tracking-wide"
              style={{
                letterSpacing: '0.04em',
                lineHeight: '1.1',
                textShadow: '0 2px 8px rgba(124,58,237,0.12)'
              }}
            >
              Imhotep Finance
            </div>
            <p className="text-gray-500 text-sm mb-2"> Manage your finances efficiently with Imhotep Financial Manager</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-chef text-gray-800 mb-4">
              Welcome, {user?.first_name || user?.username}!
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 font-medium leading-relaxed max-w-2xl">
              Paste your AI-generated HTML/CSS/JS code and deploy your portfolio instantly.
            </p>
          </div>
          
          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto">
            <button
              className="chef-button bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white flex items-center space-x-2 w-full sm:w-auto"
              onClick={() => setEditorOpen(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{portfolioCode ? 'Edit Portfolio' : 'Create Portfolio'}</span>
            </button>
            {/* ...other dashboard actions if needed... */}
          </div>
        </div>

        {/* Portfolio Preview */}
        {/*
        {portfolioCode && (
          <div className="chef-card rounded-2xl p-6 sm:p-8 shadow-lg border border-white/30 backdrop-blur-2xl bg-white/90 mt-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Live Preview</h2>
            <div className="w-full h-96 bg-gray-100 rounded-lg overflow-auto border">
              <iframe
                title="Portfolio Preview"
                srcDoc={portfolioCode}
                sandbox="allow-scripts"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        )}
        */}

        {/* Instead, show a link to the user's portfolio page after saving: */}
        {portfolioCode && (
          <div className="chef-card rounded-2xl p-6 sm:p-8 shadow-lg border border-white/30 backdrop-blur-2xl bg-white/90 mt-8 text-center">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Your Portfolio is Live!</h2>
            <a
              href={`/u/${user?.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-semibold shadow-lg hover:from-purple-600 hover:to-indigo-600 transition"
            >
              View Your Portfolio
            </a>
            <p className="text-gray-500 text-sm mt-4">
              Share this link: <span className="font-mono">{`imhotep-finance.vercel.app/u/${user?.username}`}</span>
            </p>
          </div>
        )}

        {/* If no code, show a getting started guide */}
        {!portfolioCode && (
          <div className="chef-card rounded-2xl p-6 sm:p-8 shadow-lg border border-white/30 backdrop-blur-2xl bg-white/90">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold font-chef text-gray-800 mb-4">
                Get Started in 3 Steps
              </h3>
              <ol className="text-left text-gray-700 space-y-2 mb-4">
                <li><b>1.</b> Ask any AI assistant: <span className="italic">"Create me a portfolio website for a web developer with HTML, CSS, and JavaScript on one file. <b>Do not use images or external links except for images from https://i.imgur.com/ or https://live.staticflickr.com/. Do not use navigation bars or navigation links.</b>"</span></li>
                <li><b>2.</b> Paste the generated code into the editor.</li>
                <li><b>3.</b> Click <b>Save & Deploy</b> to publish your portfolio instantly!</li>
              </ol>
              <p className="text-gray-500 text-sm">
                Your portfolio will be live at <b>pharaohfolio.com/u/yourusername</b>
              </p>
            </div>
            {/* Security Notice */}
            <div className="mt-4 mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs text-left">
              <b>Security Notice:</b> For your safety, <b>only &lt;img&gt; tags with src from <span className="underline">https://i.imgur.com/</span> or <span className="underline">https://live.staticflickr.com/</span> are allowed</b>. 
              All other images and all navigation bars/links will be removed. You may use <b>&lt;a&gt;</b> tags for external links. 
              To add images, upload them to <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">imgur.com</a> or <a href="https://www.flickr.com/" target="_blank" rel="noopener noreferrer" className="underline text-blue-700">flickr.com</a> and use the direct image link (starts with <span className="underline">https://i.imgur.com/</span> or <span className="underline">https://live.staticflickr.com/</span>).
              <br />
              <b>Navigation bars and navigation links are not allowed and will be removed for security.</b>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Code Editor */}
      {editorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              onClick={() => setEditorOpen(false)}
              aria-label="Close editor"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Portfolio Editor</h2>
            <p className="text-gray-600 mb-4 text-sm">
              Paste your HTML, CSS, and JavaScript code below. This will be your live portfolio.
            </p>
            <div className="flex justify-end mt-4 gap-2">
              <button
                className="chef-button-secondary"
                onClick={() => setEditorOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="chef-button bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                onClick={handleSave}
                disabled={saving || loading}
              >
                {saving ? 'Saving...' : 'Save & Deploy'}
              </button>
            </div>
            {success && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">{success}</div>
            )}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Dashboard;