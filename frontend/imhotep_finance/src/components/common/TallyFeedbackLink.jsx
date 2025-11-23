import { useAuth } from '../../contexts/AuthContext';

const TallyFeedbackLink = () => {
  const { user } = useAuth();

  const baseHash = "#tally-open=nPKe1P&tally-width=400&tally-overlay=1&tally-emoji-text=👋&tally-emoji-animation=wave&tally-auto-close=5000&tally-form-events-forwarding=1";
  
  let finalHref = baseHash;

  if (user) {
    const appName = 'Imhotep Finance';
    const email = user.email || '';
    const username = user.username || 
                     (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '') || 
                     '';

    finalHref = `${baseHash}&email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}&app_name=${encodeURIComponent(appName)}`;
  }

  return (
    <a href={finalHref} className="hover:underline">
      Feedback & Bugs
    </a>
  );
};

export default TallyFeedbackLink;
