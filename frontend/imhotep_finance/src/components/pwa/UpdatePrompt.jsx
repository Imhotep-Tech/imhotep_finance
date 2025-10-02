import { usePWA } from '../../hooks/usePWA';

const UpdatePrompt = () => {
  const { updateAvailable, updateApp } = usePWA();

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[90%] md:max-w-md">
      <div
        className="bg-gradient-to-r from-[#ed7143] to-[#ff6b6b] text-white rounded-xl p-4 shadow-2xl"
        style={{
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="font-semibold mb-1">🎉 New Update Available!</div>
            <div className="text-sm opacity-90">
              A new version of Imhotep Finance is ready to install.
            </div>
          </div>
          <button
            onClick={updateApp}
            className="bg-white text-[#ed7143] px-5 py-2.5 rounded-lg font-semibold whitespace-nowrap hover:scale-105 transition-transform"
          >
            Update Now
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default UpdatePrompt;
