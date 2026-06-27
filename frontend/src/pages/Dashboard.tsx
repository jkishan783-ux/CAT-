import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

export default function Dashboard() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  // Local component states
  const [dailyAttempted, setDailyAttempted] = useState(false);
  const [intervalAttempted, setIntervalAttempted] = useState(false);
  const [intervalTimeLeft, setIntervalTimeLeft] = useState('');
  const [leaderboard, setLeaderboard] = useState<any>({ topMockScorers: [], topStreakHolders: [] });
  const [loading, setLoading] = useState(true);

  // Fetch Dashboard Data
  useEffect(() => {
    if (!token) return;

    const fetchDashData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const todayStr = new Date().toISOString().split('T')[0];

        const [dailyRes, intervalRes, leaderboardRes] = await Promise.all([
          fetch(`${API_BASE_URL}/tests/daily?date=${todayStr}`, { headers }),
          fetch(`${API_BASE_URL}/tests/interval`, { headers }),
          fetch(`${API_BASE_URL}/leaderboard`, { headers }),
        ]);

        const dailyData = await dailyRes.json();
        const intervalData = await intervalRes.json();
        const leaderboardData = await leaderboardRes.json();

        setDailyAttempted(dailyData.alreadyAttempted);
        setIntervalAttempted(intervalData.alreadyAttempted);
        setLeaderboard(leaderboardData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashData();
  }, [token]);

  // 6-Hour Interval countdown clock
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentIntervalIndex = Math.floor(currentHours / 6);
      const nextIntervalHour = (currentIntervalIndex + 1) * 6;

      const targetDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        nextIntervalHour,
        0,
        0,
        0
      );

      const diffMs = targetDate.getTime() - now.getTime();
      if (diffMs <= 0) {
        setIntervalTimeLeft('00h 00m 00s');
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');
      setIntervalTimeLeft(`${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStartTest = (type: 'mock' | 'daily' | 'interval', id?: string) => {
    navigate(`/test?type=${type}${id ? `&id=${id}` : ''}`);
  };

  if (loading) {
    return <div style={styles.loadingContainer}>Loading dashboard analytics...</div>;
  }

  return (
    <div style={styles.pageContainer}>
      {/* Navigation Header */}
      <header style={styles.navHeader}>
        <div style={styles.navBrand}>CAT Preparation Dashboard</div>
        <div style={styles.navUserControls}>
          <span style={styles.userName}>Hello, {user?.name}</span>
          {user?.role === 'admin' && (
            <button style={styles.adminBtn} onClick={() => navigate('/admin')}>
              Admin Panel
            </button>
          )}
          <button style={styles.logoutBtn} onClick={() => { logout(); navigate('/auth'); }}>
            Logout
          </button>
        </div>
      </header>

      <div style={styles.gridContainer}>
        {/* Left Column: Streaks and Test Options */}
        <div style={styles.leftCol}>
          
          {/* Daily Streak Card */}
          <div style={styles.streakCard} className="glass-card">
            <div style={styles.streakFlameIcon}>🔥</div>
            <div style={styles.streakDetails}>
              <div style={styles.streakNum}>{user?.streakCounter || 0} Days</div>
              <div style={styles.streakLabel}>Active Daily Streak</div>
              <div style={styles.streakStatus}>
                {dailyAttempted ? (
                  <span style={styles.statusSuccess}>✅ Daily Test Completed</span>
                ) : (
                  <span style={styles.statusPending}>⚠️ Daily Test Pending</span>
                )}
              </div>
            </div>
          </div>

          {/* Test Sections */}
          <h2 style={styles.sectionTitle}>Available Tests</h2>
          <div style={styles.testsGrid}>
            
            {/* Daily Test */}
            <div style={styles.testCard} className="glass-card">
              <div style={styles.testHeader}>
                <h3 style={styles.testTitle}>Daily Streak Test</h3>
                <span style={styles.testDuration}>20 mins</span>
              </div>
              <p style={styles.testDesc}>Exactly 10 questions. Cutoff timer. Keeps your streak active.</p>
              {dailyAttempted ? (
                <button style={styles.testBtnDisabled} disabled>Already Attempted</button>
              ) : (
                <button style={styles.testBtn} onClick={() => handleStartTest('daily')}>Start Daily Test</button>
              )}
            </div>

            {/* Interval Test */}
            <div style={styles.testCard} className="glass-card">
              <div style={styles.testHeader}>
                <h3 style={styles.testTitle}>6-Hour Interval Test</h3>
                <span style={styles.testDuration}>12 mins</span>
              </div>
              <p style={styles.testDesc}>4 questions. Refreshes at 12 AM, 6 AM, 12 PM, and 6 PM.</p>
              <div style={styles.countdownRow}>
                <span style={styles.countdownLabel}>Next refresh:</span>
                <span style={styles.countdownTime}>{intervalTimeLeft}</span>
              </div>
              {intervalAttempted ? (
                <button style={styles.testBtnDisabled} disabled>Attempted in this Window</button>
              ) : (
                <button style={styles.testBtn} onClick={() => handleStartTest('interval')}>Start Interval Test</button>
              )}
            </div>

            {/* Mock Test */}
            <div style={styles.testCard} className="glass-card">
              <div style={styles.testHeader}>
                <h3 style={styles.testTitle}>Full Mock Test (Sectional Lock)</h3>
                <span style={styles.testDuration}>120 mins</span>
              </div>
              <p style={styles.testDesc}>Full length simulation. Strict order: VARC (40m) $\rightarrow$ DILR (40m) $\rightarrow$ QA (40m). Section jumping locked.</p>
              <button style={styles.testBtnPrimary} onClick={() => handleStartTest('mock', '1')}>Start Mock Test 1</button>
            </div>

          </div>
        </div>

        {/* Right Column: Global Leaderboards */}
        <div style={styles.rightCol}>
          <h2 style={styles.sectionTitle}>Global Leaderboard</h2>
          <div style={styles.leaderboardContainer} className="glass-card">
            
            {/* Top Mock Scorers */}
            <div style={styles.leaderboardColumn}>
              <h3 style={styles.leaderboardSubheading}>🏆 Top Mock Scores</h3>
              <div style={styles.leaderboardList}>
                {leaderboard.topMockScorers.map((u: any, idx: number) => (
                  <div key={u.email} style={styles.leaderboardRow}>
                    <span style={styles.rank}>#{idx + 1}</span>
                    <span style={styles.leaderboardName}>{u.name}</span>
                    <span style={styles.leaderboardValue}>{u.highestMockScore} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Streak Holders */}
            <div style={styles.leaderboardColumn}>
              <h3 style={styles.leaderboardSubheading}>🔥 Top Streaks</h3>
              <div style={styles.leaderboardList}>
                {leaderboard.topStreakHolders.map((u: any, idx: number) => (
                  <div key={u.email} style={styles.leaderboardRow}>
                    <span style={styles.rank}>#{idx + 1}</span>
                    <span style={styles.leaderboardName}>{u.name}</span>
                    <span style={styles.leaderboardValue}>{u.streakCounter} days</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '18px',
    color: '#8E8E9F',
  },
  pageContainer: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    paddingBottom: '60px',
  },
  navHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '20px',
    borderBottom: '1px solid #26262E',
    marginBottom: '32px',
  },
  navBrand: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#FFFFFF',
  },
  navUserControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userName: {
    color: '#8E8E9F',
    fontSize: '14px',
  },
  adminBtn: {
    backgroundColor: '#1C1C22',
    color: '#3B82F6',
    border: '1px solid #26262E',
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr',
    gap: '32px',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  streakCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '32px',
    borderLeft: '4px solid #F97316',
  },
  streakFlameIcon: {
    fontSize: '40px',
  },
  streakDetails: {},
  streakNum: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#F97316',
  },
  streakLabel: {
    fontSize: '13px',
    color: '#8E8E9F',
    marginVertical: '2px',
  },
  streakStatus: {
    marginTop: '6px',
  },
  statusSuccess: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: '12px',
  },
  statusPending: {
    color: '#F59E0B',
    fontWeight: '600',
    fontSize: '12px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: '16px',
  },
  testsGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  testCard: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  testHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  testTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  testDuration: {
    fontSize: '11px',
    backgroundColor: '#1C1C22',
    color: '#8E8E9F',
    padding: '3px 8px',
    borderRadius: '4px',
    border: '1px solid #26262E',
  },
  testDesc: {
    fontSize: '13px',
    color: '#8E8E9F',
    lineHeight: '18px',
    marginBottom: '14px',
  },
  countdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#0A0A0C',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    marginBottom: '14px',
    border: '1px solid #1C1C22',
  },
  countdownLabel: {
    color: '#8E8E9F',
  },
  countdownTime: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  testBtn: {
    backgroundColor: '#1C1C22',
    color: '#FFFFFF',
    border: '1px solid #26262E',
    height: '38px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  testBtnPrimary: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    height: '38px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  testBtnDisabled: {
    backgroundColor: '#1C1C22',
    color: '#535362',
    border: '1px solid #1C1C22',
    height: '38px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'default',
  },
  leaderboardContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  leaderboardColumn: {},
  leaderboardSubheading: {
    fontSize: '14px',
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: '12px',
    paddingBottom: '6px',
    borderBottom: '1px solid #26262E',
  },
  leaderboardList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  leaderboardRow: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
  },
  rank: {
    color: '#F59E0B',
    fontWeight: '700',
    width: '32px',
  },
  leaderboardName: {
    color: '#E1E1E6',
    flex: 1,
  },
  leaderboardValue: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
};
