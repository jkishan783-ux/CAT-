import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name) {
          throw new Error('Name is required for registration.');
        }
        await signup(name, email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.brandSection}>
        <h1 style={styles.brandTitle}>CAT Prep Portal</h1>
        <p style={styles.brandDesc}>
          Master the Common Admission Test with strict timing, detailed scoring, and comprehensive diagnostics.
        </p>
      </div>

      <div style={styles.card} className="glass-card">
        <h2 style={styles.cardTitle}>{isLogin ? 'Sign In' : 'Create Account'}</h2>
        <p style={styles.cardSubtitle}>
          {isLogin ? 'Access your dashboard and tests' : 'Register to start tracing your progress'}
        </p>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                style={styles.input}
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              style={styles.input}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div style={styles.toggleSection}>
          <span style={styles.toggleText}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button style={styles.toggleBtn} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Create one now' : 'Sign in instead'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
  },
  brandSection: {
    textAlign: 'center' as const,
    marginBottom: '32px',
    maxWidth: '480px',
  },
  brandTitle: {
    fontSize: '36px',
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: '8px',
  },
  brandDesc: {
    fontSize: '15px',
    color: '#8E8E9F',
    lineHeight: '22px',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
  },
  cardTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: '6px',
  },
  cardSubtitle: {
    fontSize: '13px',
    color: '#8E8E9F',
    marginBottom: '24px',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #EF4444',
    borderRadius: '8px',
    padding: '12px',
    color: '#EF4444',
    fontSize: '13px',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '18px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#8E8E9F',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  input: {
    backgroundColor: '#1C1C22',
    border: '1px solid #26262E',
    borderRadius: '8px',
    height: '44px',
    padding: '0 16px',
    color: '#FFFFFF',
    fontSize: '14px',
    outline: 'none',
  },
  submitBtn: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    height: '46px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background-color 0.2s',
  },
  toggleSection: {
    marginTop: '24px',
    textAlign: 'center' as const,
    fontSize: '13px',
  },
  toggleText: {
    color: '#8E8E9F',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#3B82F6',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
