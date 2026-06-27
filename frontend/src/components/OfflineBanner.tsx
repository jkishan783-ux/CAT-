import { useState, useEffect } from 'react';

const HEALTH_CHECK_URL = 'http://localhost:5000/health';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(HEALTH_CHECK_URL, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (response.ok) {
          setIsOffline(false);
        } else {
          setIsOffline(true);
        }
      } catch (err) {
        setIsOffline(true);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!isOffline) return null;

  return (
    <div style={styles.banner}>
      <span style={styles.icon}>⚠️</span>
      <span style={styles.text}>
        Network Connection Offline — Exam responses are safely backed up locally.
      </span>
    </div>
  );
}

const styles = {
  banner: {
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    padding: '12px 24px',
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '600',
    borderTop: '1px solid #F87171',
    boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.25)',
  },
  icon: {
    marginRight: '8px',
  },
  text: {
    letterSpacing: '0.3px',
  },
};
