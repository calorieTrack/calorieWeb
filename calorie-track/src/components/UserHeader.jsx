import React from 'react';
import './UserHeader.css';

function UserHeader({ user, onSignOut, onSettings, onTrends }) {
  const displayName = user.displayName || user.email;
  const [gravatarUrl, setGravatarUrl] = React.useState('');

  // Generate Gravatar URL using Web Cryptography API
  React.useEffect(() => {
    const generateGravatarUrl = async (email) => {
      if (!email) return;
      
      try {
        const trimmedEmail = email.toLowerCase().trim();
        // Use SubtleCrypto to generate SHA-256 hash
        const encoder = new TextEncoder();
        const data = encoder.encode(trimmedEmail);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        
        // Convert buffer to hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        const url = `https://www.gravatar.com/avatar/${hashHex}?d=identicon&s=50`;
        setGravatarUrl(url);
      } catch (error) {
        console.warn('Failed to generate Gravatar hash:', error);
        // Fallback: use email directly with default param
        setGravatarUrl(`https://www.gravatar.com/avatar/${email.toLowerCase().trim()}?d=identicon&s=50`);
      }
    };

    generateGravatarUrl(user.email);
  }, [user.email]);

  return (
    <div className="user-info">
      <div className="user-profile">
        {gravatarUrl && (
          <img 
            src={gravatarUrl} 
            alt="Profile" 
            className="user-avatar"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        <p>Welcome, {displayName}</p>
      </div>
      <div className="user-actions">
        <button onClick={onTrends} className="trends-btn">
          <span className="material-symbols-outlined lg icon-inline icon-mr" aria-hidden>bar_chart</span>
          Trends
        </button>
        <button onClick={onSettings} className="settings-btn">
          <span className="material-symbols-outlined lg icon-inline icon-mr" aria-hidden>settings</span>
          Settings
        </button>
        <button onClick={onSignOut}>Sign Out</button>
      </div>
    </div>
  );
}

export default UserHeader;
