import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  streakCounter: number;
  highestMockScore: number;
  createdAt: string;
}

interface AttemptItem {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  } | null;
  testType: 'mock' | 'daily' | 'interval';
  testId: string;
  score: {
    totalScore: number;
    correctCount: number;
    incorrectCount: number;
    unattemptedCount: number;
    accuracy: number;
  };
  totalDurationSpent: number;
  completedAt: string;
}

type TabType = 'users' | 'performance' | 'uploader';

export default function Admin() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // Navigation tab switcher state
  const [activeTab, setActiveTab] = useState<TabType>('users');

  // Loaded DB data states
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [attemptsList, setAttemptsList] = useState<AttemptItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // CSV Uploader states
  const [targetType, setTargetType] = useState<'daily' | 'interval' | 'mock'>('mock');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Authorization check
  if (!user || user.role !== 'admin') {
    return (
      <div style={styles.restrictedContainer}>
        <div style={styles.restrictedBox} className="glass-card">
          <h2 style={styles.restrictedTitle}>Access Denied</h2>
          <p style={styles.restrictedDesc}>
            You do not have the required administrative privileges to view this page.
          </p>
          <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Load active users list
  const loadUsers = async () => {
    setLoadingData(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUsersList(data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Load performance logs
  const loadAttempts = async () => {
    setLoadingData(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/attempts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAttemptsList(data);
      }
    } catch (err) {
      console.error('Failed to load performance attempts:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Trigger data fetches on tab clicks
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'performance') {
      loadAttempts();
    }
  }, [activeTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select a valid CSV file first.');
      return;
    }

    setUploading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('targetType', targetType); // passes target exam type parameters

    try {
      const response = await fetch(`${API_BASE_URL}/admin/upload-questions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to upload questions.');
      }

      setSuccessMsg(`Success! ${data.count} questions for "${targetType.toUpperCase()}" uploaded and parsed successfully.`);
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during file upload.');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={styles.pageContainer}>
      {/* Navigation Header */}
      <header style={styles.navHeader}>
        <div style={styles.navBrand}>Admin Control Center</div>
        <button style={styles.backBtnHeader} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </header>

      {/* Tabs list switch header */}
      <div style={styles.tabHeadersContainer}>
        <button
          style={activeTab === 'users' ? styles.tabBtnActive : styles.tabBtn}
          onClick={() => setActiveTab('users')}
        >
          👥 User Management
        </button>
        <button
          style={activeTab === 'performance' ? styles.tabBtnActive : styles.tabBtn}
          onClick={() => setActiveTab('performance')}
        >
          📈 Performance Analytics
        </button>
        <button
          style={activeTab === 'uploader' ? styles.tabBtnActive : styles.tabBtn}
          onClick={() => setActiveTab('uploader')}
        >
          📤 Question Uploader
        </button>
      </div>

      {/* Main Workspace */}
      <div style={styles.workspace} className="glass-card">
        
        {/* Tab 1: User Management (User Active status checks) */}
        {activeTab === 'users' && (
          <div>
            <div style={styles.tabTitleRow}>
              <h2 style={styles.tabTitle}>Active Users</h2>
              <button style={styles.refreshBtn} onClick={loadUsers} disabled={loadingData}>
                {loadingData ? 'Syncing...' : '🔄 Sync Users'}
              </button>
            </div>
            <p style={styles.tabSubtitle}>List of active registered student accounts in your database.</p>

            {loadingData && usersList.length === 0 ? (
              <div style={styles.loadingMessage}>Loading active users list...</div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.tableHeaderColLeft}>Student Name</th>
                      <th style={styles.tableHeaderColLeft}>Email Address</th>
                      <th style={styles.tableHeaderCol}>Active Streak</th>
                      <th style={styles.tableHeaderCol}>High Mock Score</th>
                      <th style={styles.tableHeaderCol}>Account Role</th>
                      <th style={styles.tableHeaderCol}>Registered On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => (
                      <tr key={u._id} style={styles.tableRow}>
                        <td style={styles.tableCellLeftBold}>{u.name}</td>
                        <td style={styles.tableCellLeft}>{u.email}</td>
                        <td style={styles.tableCell}>
                          <span style={styles.streakWrap}>🔥 {u.streakCounter} days</span>
                        </td>
                        <td style={styles.tableCellBold}>{u.highestMockScore} pts</td>
                        <td style={styles.tableCell}>
                          <span style={u.role === 'admin' ? styles.roleBadgeAdmin : styles.roleBadgeUser}>
                            {u.role}
                          </span>
                        </td>
                        <td style={styles.tableCell}>{formatDate(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Performance Analyzer */}
        {activeTab === 'performance' && (
          <div>
            <div style={styles.tabTitleRow}>
              <h2 style={styles.tabTitle}>Exam Performance Logs</h2>
              <button style={styles.refreshBtn} onClick={loadAttempts} disabled={loadingData}>
                {loadingData ? 'Syncing...' : '🔄 Sync Attempts'}
              </button>
            </div>
            <p style={styles.tabSubtitle}>Live tracking records of completed mock, sectional, and daily examinations.</p>

            {loadingData && attemptsList.length === 0 ? (
              <div style={styles.loadingMessage}>Loading performance transcripts...</div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.tableHeaderColLeft}>Student</th>
                      <th style={styles.tableHeaderColLeft}>Test Type</th>
                      <th style={styles.tableHeaderCol}>Net Score</th>
                      <th style={styles.tableHeaderCol}>Correct/Attempted</th>
                      <th style={styles.tableHeaderCol}>Accuracy</th>
                      <th style={styles.tableHeaderCol}>Time Spent</th>
                      <th style={styles.tableHeaderCol}>Date Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attemptsList.map((a) => (
                      <tr key={a._id} style={styles.tableRow}>
                        <td style={styles.tableCellLeft}>
                          {a.userId ? (
                            <div>
                              <div style={styles.boldText}>{a.userId.name}</div>
                              <div style={styles.subText}>{a.userId.email}</div>
                            </div>
                          ) : (
                            <span style={styles.mutedText}>Deleted User</span>
                          )}
                        </td>
                        <td style={styles.tableCellLeft}>
                          <span style={styles.testTypeBadge}>{a.testType.toUpperCase()}</span>
                        </td>
                        <td style={a.score.totalScore >= 0 ? styles.tableCellSuccess : styles.tableCellDanger}>
                          {a.score.totalScore} pts
                        </td>
                        <td style={styles.tableCell}>
                          {a.score.correctCount} / {a.score.correctCount + a.score.incorrectCount}
                        </td>
                        <td style={styles.tableCellBold}>{a.score.accuracy}%</td>
                        <td style={styles.tableCell}>{formatTime(a.totalDurationSpent)}</td>
                        <td style={styles.tableCell}>{formatDate(a.completedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Question Uploader (Support Daily, Interval, Mock) */}
        {activeTab === 'uploader' && (
          <div>
            <h2 style={styles.tabTitle}>Question Sheet Ingestion</h2>
            <p style={styles.tabSubtitle}>
              Ingest questions directly into target databases. Supported headers:
              <strong style={styles.code}> groupId, passageText, section, type, questionText, options, correctAnswer, targetTestType, topic </strong>.
            </p>

            {successMsg && <div style={styles.successAlert}>{successMsg}</div>}
            {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

            <form onSubmit={handleUpload} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.inputLabel}>Target Test Type</label>
                <select
                  style={styles.selectInput}
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                >
                  <option value="daily">Daily Streak Test (20m / 10 questions)</option>
                  <option value="interval">6-Hour Interval Test (12m / 4 questions)</option>
                  <option value="mock">Full Length Mock Test (Sectional locks, split views)</option>
                </select>
              </div>

              <div style={styles.uploadBox}>
                <input
                  type="file"
                  accept=".csv"
                  id="csvFileInput"
                  style={styles.fileInput}
                  onChange={handleFileChange}
                />
                <label htmlFor="csvFileInput" style={styles.uploadLabel}>
                  <span style={styles.uploadIcon}>📁</span>
                  <span style={styles.uploadText}>
                    {file ? file.name : `Select CSV question sheet for "${targetType.toUpperCase()}"`}
                  </span>
                </label>
              </div>

              <button type="submit" style={styles.uploadBtn} disabled={uploading || !file}>
                {uploading ? 'Parsing CSV and seeding database...' : 'Ingest Question Bank'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  restrictedContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '24px',
    backgroundColor: '#0A0A0C',
  },
  restrictedBox: {
    maxWidth: '400px',
    textAlign: 'center' as const,
  },
  restrictedTitle: {
    color: '#EF4444',
    fontSize: '22px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  restrictedDesc: {
    color: '#8E8E9F',
    fontSize: '14px',
    lineHeight: '20px',
    marginBottom: '24px',
  },
  backBtn: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    height: '42px',
    padding: '0 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  pageContainer: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    paddingBottom: '80px',
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
  backBtnHeader: {
    backgroundColor: '#1C1C22',
    color: '#FFFFFF',
    border: '1px solid #26262E',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  tabHeadersContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    borderBottom: '1px solid #1C1C22',
    paddingBottom: '12px',
  },
  tabBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#8E8E9F',
    fontSize: '14px',
    fontWeight: '600',
    padding: '8px 16px',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'background-color 0.2s',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: 'none',
    color: '#3B82F6',
    fontSize: '14px',
    fontWeight: '700',
    padding: '8px 16px',
    cursor: 'default',
    borderRadius: '6px',
  },
  workspace: {
    padding: '32px',
  },
  tabTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  tabTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabSubtitle: {
    fontSize: '13px',
    color: '#8E8E9F',
    marginBottom: '24px',
  },
  refreshBtn: {
    backgroundColor: '#1C1C22',
    color: '#3B82F6',
    border: '1px solid #26262E',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  loadingMessage: {
    padding: '40px 0',
    textAlign: 'center' as const,
    color: '#8E8E9F',
    fontSize: '14px',
  },
  tableWrap: {
    overflowX: 'auto' as const,
    border: '1px solid #26262E',
    borderRadius: '12px',
    backgroundColor: '#0F0F12',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  tableHeaderRow: {
    backgroundColor: '#16161B',
    borderBottom: '1px solid #26262E',
  },
  tableHeaderColLeft: {
    color: '#8E8E9F',
    fontSize: '12px',
    fontWeight: '600',
    padding: '14px 18px',
    textAlign: 'left' as const,
  },
  tableHeaderCol: {
    color: '#8E8E9F',
    fontSize: '12px',
    fontWeight: '600',
    padding: '14px 18px',
    textAlign: 'right' as const,
  },
  tableRow: {
    borderBottom: '1px solid #1C1C22',
  },
  tableCellLeft: {
    color: '#E1E1E6',
    fontSize: '13px',
    padding: '16px 18px',
    textAlign: 'left' as const,
  },
  tableCellLeftBold: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '13px',
    padding: '16px 18px',
    textAlign: 'left' as const,
  },
  tableCell: {
    color: '#8E8E9F',
    fontSize: '13px',
    padding: '16px 18px',
    textAlign: 'right' as const,
  },
  tableCellBold: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '13px',
    padding: '16px 18px',
    textAlign: 'right' as const,
  },
  tableCellSuccess: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: '13px',
    padding: '16px 18px',
    textAlign: 'right' as const,
  },
  tableCellDanger: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: '13px',
    padding: '16px 18px',
    textAlign: 'right' as const,
  },
  streakWrap: {
    color: '#F97316',
    fontWeight: '600',
  },
  roleBadgeAdmin: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #EF4444',
    color: '#EF4444',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
  },
  roleBadgeUser: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid #10B981',
    color: '#10B981',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
  },
  boldText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  subText: {
    color: '#535362',
    fontSize: '11px',
    marginTop: '2px',
  },
  testTypeBadge: {
    backgroundColor: '#1C1C22',
    color: '#3B82F6',
    border: '1px solid #26262E',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
  },
  mutedText: {
    color: '#535362',
    fontStyle: 'italic',
  },
  code: {
    color: '#3B82F6',
    backgroundColor: '#0A0A0C',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
  successAlert: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid #10B981',
    borderRadius: '8px',
    padding: '14px',
    color: '#10B981',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '20px',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #EF4444',
    borderRadius: '8px',
    padding: '14px',
    color: '#EF4444',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  inputLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#8E8E9F',
  },
  selectInput: {
    backgroundColor: '#0F0F12',
    border: '1px solid #26262E',
    borderRadius: '8px',
    height: '44px',
    padding: '0 12px',
    color: '#FFFFFF',
    fontSize: '14px',
    outline: 'none',
  },
  uploadBox: {
    border: '2px dashed #26262E',
    borderRadius: '12px',
    backgroundColor: '#0F0F12',
    height: '160px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  fileInput: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    opacity: 0,
    cursor: 'pointer',
    width: '100%',
    height: '100%',
  },
  uploadLabel: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
  },
  uploadIcon: {
    fontSize: '36px',
  },
  uploadText: {
    fontSize: '14px',
    color: '#8E8E9F',
  },
  uploadBtn: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    height: '46px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};
