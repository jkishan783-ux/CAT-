

interface SectionInsight {
  sectionName: 'VARC' | 'DILR' | 'QA';
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  netScore: number;
  accuracy: number;
  timeSpentSeconds: number;
}

interface TopicInsight {
  topic: string;
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  netScore: number;
  accuracy: number;
  timeSpentSeconds: number;
}

interface GradedAnswer {
  questionId: string;
  selectedAnswer: string;
  correctAnswer: string;
  questionText: string;
  isCorrect: boolean;
  timeSpent: number;
  scoreContribution: number;
  section: string;
  topic: string;
}

interface ScorecardProps {
  score: {
    totalScore: number;
    correctCount: number;
    incorrectCount: number;
    unattemptedCount: number;
    accuracy: number;
  };
  analytics: {
    timeTraps: string[];
    sectionalInsights: Record<'VARC' | 'DILR' | 'QA', SectionInsight>;
    topicMatrix: Record<string, TopicInsight>;
  };
  gradedAnswers: GradedAnswer[];
  onClose: () => void;
}

export default function Scorecard({
  score,
  analytics,
  gradedAnswers,
  onClose,
}: ScorecardProps) {
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const sections = Object.values(analytics.sectionalInsights);
  const topics = Object.values(analytics.topicMatrix);

  // Filter time traps
  const timeTrapQuestions = gradedAnswers.filter((ans) =>
    analytics.timeTraps.includes(ans.questionId)
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Test Analysis Report</h1>
        <p style={styles.headerSubtitle}>Comprehensive score diagnostics and insights</p>
      </div>

      {/* Overview stats */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard} className="glass-card">
          <div style={styles.summaryLabel}>Total Score</div>
          <div style={{ ...styles.summaryValue, ...styles.primaryText }}>{score.totalScore}</div>
        </div>

        <div style={styles.summaryCard} className="glass-card">
          <div style={styles.summaryLabel}>Accuracy %</div>
          <div style={{ ...styles.summaryValue, ...(score.accuracy >= 80 ? styles.successText : styles.warningText) }}>
            {score.accuracy}%
          </div>
        </div>

        <div style={styles.summaryCard} className="glass-card">
          <div style={styles.summaryLabel}>Time Traps</div>
          <div style={{ ...styles.summaryValue, ...(timeTrapQuestions.length > 0 ? styles.dangerText : styles.successText) }}>
            {timeTrapQuestions.length}
          </div>
        </div>
      </div>

      {/* Alarm or Success Banner for time traps */}
      {timeTrapQuestions.length > 0 ? (
        <div style={styles.alarmPanel}>
          <h3 style={styles.alarmTitle}>🚨 Attention Needed: Time Traps Identified</h3>
          <p style={styles.alarmDesc}>
            You spent more than 3 minutes (180s) on the following questions and answered incorrectly. Avoid getting stuck in these traps on the main exam:
          </p>
          <div style={styles.trapList}>
            {timeTrapQuestions.map((q, idx) => (
              <div key={q.questionId} style={styles.trapItem}>
                <div style={styles.trapHeader}>
                  <span style={styles.trapTitle}>Trap #{idx + 1} ({q.section} • {q.topic})</span>
                  <span style={styles.trapTime}>Spent: {formatTime(q.timeSpent)}</span>
                </div>
                <p style={styles.trapText}>{q.questionText}</p>
                <div style={styles.trapMeta}>
                  <span>Your input: <strong style={styles.dangerText}>{q.selectedAnswer || 'None'}</strong></span>
                  <span>Correct Answer: <strong style={styles.successText}>{q.correctAnswer}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={styles.successPanel}>
          <h3 style={styles.successTitle}>🚀 Perfect Time Optimization!</h3>
          <p style={styles.successDesc}>
            No time traps detected. You managed your sectional clocks effectively and didn't stall on incorrect items.
          </p>
        </div>
      )}

      {/* Sectional Performance */}
      <h2 style={styles.sectionHeading}>Sectional Insights</h2>
      <div style={styles.insightsList}>
        {sections.map((sec) => (
          <div key={sec.sectionName} style={styles.insightCard} className="glass-card">
            <div style={styles.insightHeader}>
              <span style={styles.insightName}>{sec.sectionName}</span>
              <span style={styles.insightScore}>Net Score: {sec.netScore} pts</span>
            </div>
            <div style={styles.insightGrid}>
              <div style={styles.insightCol}>
                <span style={styles.insightLabel}>Accuracy</span>
                <span style={styles.insightValue}>{sec.accuracy}%</span>
              </div>
              <div style={styles.insightCol}>
                <span style={styles.insightLabel}>Correct/Attempted</span>
                <span style={styles.insightValue}>{sec.correctCount}/{sec.attemptedCount}</span>
              </div>
              <div style={styles.insightCol}>
                <span style={styles.insightLabel}>Time Spent</span>
                <span style={styles.insightValue}>{formatTime(sec.timeSpentSeconds)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Diagnostic topic matrix */}
      <h2 style={styles.sectionHeading}>Diagnostic Topic Matrix</h2>
      <div style={styles.matrixContainer} className="glass-card">
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeaderRow}>
              <th style={styles.tableHeaderColLeft}>Topic Name</th>
              <th style={styles.tableHeaderCol}>Attempted</th>
              <th style={styles.tableHeaderCol}>Net Score</th>
              <th style={styles.tableHeaderCol}>Accuracy</th>
              <th style={styles.tableHeaderCol}>Total Time</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((t) => (
              <tr key={t.topic} style={styles.tableRow}>
                <td style={styles.tableCellLeft}>{t.topic}</td>
                <td style={styles.tableCell}>{t.correctCount}/{t.attemptedCount}</td>
                <td style={{ ...styles.tableCell, ...(t.netScore >= 0 ? styles.successText : styles.dangerText) }}>
                  {t.netScore > 0 ? `+${t.netScore}` : t.netScore}
                </td>
                <td style={{ ...styles.tableCell, ...styles.bold }}>{t.accuracy}%</td>
                <td style={styles.tableCell}>{formatTime(t.timeSpentSeconds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Close button */}
      <button style={styles.closeBtn} onClick={onClose}>
        Return to Dashboard
      </button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '40px auto',
    padding: '0 24px',
    paddingBottom: '80px',
  },
  header: {
    marginBottom: '32px',
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: '14px',
    color: '#8E8E9F',
    marginTop: '6px',
  },
  summaryGrid: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '32px',
  },
  summaryCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '6px',
  },
  summaryLabel: {
    color: '#8E8E9F',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: '800',
  },
  primaryText: {
    color: '#3B82F6',
  },
  successText: {
    color: '#10B981',
  },
  warningText: {
    color: '#F59E0B',
  },
  dangerText: {
    color: '#EF4444',
  },
  alarmPanel: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid #EF4444',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '32px',
  },
  alarmTitle: {
    color: '#EF4444',
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  alarmDesc: {
    color: '#B5A6A6',
    fontSize: '13px',
    lineHeight: '20px',
    marginBottom: '18px',
  },
  trapList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  trapItem: {
    backgroundColor: '#170E0E',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    padding: '16px',
  },
  trapHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  trapTitle: {
    color: '#EF4444',
  },
  trapTime: {
    color: '#8E8E9F',
  },
  trapText: {
    color: '#E1E1E6',
    fontSize: '13px',
    lineHeight: '18px',
    marginBottom: '10px',
  },
  trapMeta: {
    display: 'flex',
    gap: '24px',
    fontSize: '12px',
    color: '#8E8E9F',
  },
  successPanel: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    border: '1px solid #10B981',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '32px',
  },
  successTitle: {
    color: '#10B981',
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  successDesc: {
    color: '#A6B5AD',
    fontSize: '13px',
    lineHeight: '20px',
  },
  sectionHeading: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: '16px',
    marginTop: '32px',
  },
  insightsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    marginBottom: '32px',
  },
  insightCard: {
    borderLeft: '4px solid #3B82F6',
  },
  insightHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    borderBottom: '1px solid #26262E',
    paddingBottom: '8px',
  },
  insightName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: '15px',
  },
  insightScore: {
    color: '#3B82F6',
    fontWeight: '700',
    fontSize: '14px',
  },
  insightGrid: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  insightCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  insightLabel: {
    color: '#8E8E9F',
    fontSize: '10px',
    textTransform: 'uppercase' as const,
  },
  insightValue: {
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '600',
  },
  matrixContainer: {
    padding: 0,
    overflow: 'hidden',
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
    padding: '12px 18px',
    textAlign: 'left' as const,
  },
  tableHeaderCol: {
    color: '#8E8E9F',
    fontSize: '12px',
    fontWeight: '600',
    padding: '12px 18px',
    textAlign: 'right' as const,
  },
  tableRow: {
    borderBottom: '1px solid #1C1C22',
  },
  tableCellLeft: {
    color: '#FFFFFF',
    fontSize: '13px',
    padding: '14px 18px',
    textAlign: 'left' as const,
  },
  tableCell: {
    color: '#8E8E9F',
    fontSize: '13px',
    padding: '14px 18px',
    textAlign: 'right' as const,
  },
  bold: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  closeBtn: {
    display: 'block',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    height: '46px',
    width: '100%',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '40px',
    transition: 'background-color 0.2s',
  },
};
