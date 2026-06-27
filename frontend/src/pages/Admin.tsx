import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

export default function Admin() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
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

    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);

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

      setSuccessMsg(`Success! ${data.count} questions uploaded and seeded successfully.`);
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during file upload.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <header style={styles.navHeader}>
        <div style={styles.navBrand}>Admin Control Panel</div>
        <button style={styles.backBtnHeader} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <div style={styles.workspace} className="glass-card">
        <h2 style={styles.title}>Bulk Question Uploader</h2>
        <p style={styles.subtitle}>
          Upload a CSV spreadsheet to seed questions into the database. Formatting should include the columns:
          <strong style={styles.code}> groupId, passageText, section, type, questionText, options, correctAnswer, targetTestType, topic </strong>.
        </p>

        {successMsg && <div style={styles.successAlert}>{successMsg}</div>}
        {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

        <form onSubmit={handleUpload} style={styles.form}>
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
                {file ? file.name : 'Select or drag CSV question template'}
              </span>
            </label>
          </div>

          <button type="submit" style={styles.uploadBtn} disabled={loading || !file}>
            {loading ? 'Uploading and seeding database...' : 'Upload & Parse Questions'}
          </button>
        </form>
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
    maxWidth: '800px',
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
    fontSize: '20px',
    fontWeight: '800',
    color: '#FFFFFF',
  },
  backBtnHeader: {
    backgroundColor: '#1C1C22',
    color: '#FFFFFF',
    border: '1px solid #26262E',
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  workspace: {},
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#8E8E9F',
    lineHeight: '20px',
    marginBottom: '24px',
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
