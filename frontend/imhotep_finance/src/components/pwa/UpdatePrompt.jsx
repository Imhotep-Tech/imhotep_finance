import { usePWA } from '../../hooks/usePWA';

const UpdatePrompt = () => {
  const { updateAvailable, reloadApp } = usePWA();

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 text-lg">⬆️</span>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              Update Available
            </h3>
            <p className="text-xs text-blue-700 mb-3">
              A new version of Imhotep Finance is available.
            </p>
            <button
              onClick={reloadApp}
              className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
            >
              Update Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePrompt;
