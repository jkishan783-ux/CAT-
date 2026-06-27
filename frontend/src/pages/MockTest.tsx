import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Scorecard from './Scorecard';

const API_BASE_URL = 'http://localhost:5000/api';

interface Question {
  _id: string;
  groupId: string | null;
  passageText?: string;
  section: 'VARC' | 'DILR' | 'QA';
  type: 'MCQ' | 'TITA';
  questionText: string;
  options: string[];
}

interface Section {
  sectionName: 'VARC' | 'DILR' | 'QA';
  timeLimitMinutes: number;
  questions: Question[];
}

export default function MockTest() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const testType = (searchParams.get('type') || 'mock') as 'mock' | 'daily' | 'interval';
  const testIdParam = searchParams.get('id') || '';

  // API loaded data
  const [sections, setSections] = useState<Section[]>([]);
  const [testId, setTestId] = useState('');
  const [loading, setLoading] = useState(true);

  // Attempt States
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [isSessionChecked, setIsSessionChecked] = useState(false);

  // Scorecard / Post-Test State
  const [submittedScorecard, setSubmittedScorecard] = useState<any | null>(null);

  const activeSection = sections[currentSectionIndex];
  const activeQuestions = activeSection ? activeSection.questions : [];
  const activeQuestion = activeQuestions[currentQuestionIndex];

  // 1. Fetch test questions on mount
  useEffect(() => {
    if (!token) return;

    const fetchQuestions = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        let url = `${API_BASE_URL}/tests/mock/1`; // default mock id

        if (testType === 'daily') {
          const todayStr = new Date().toISOString().split('T')[0];
          url = `${API_BASE_URL}/tests/daily?date=${todayStr}`;
        } else if (testType === 'interval') {
          url = `${API_BASE_URL}/tests/interval`;
        } else if (testIdParam) {
          url = `${API_BASE_URL}/tests/mock/${testIdParam}`;
        }

        const res = await fetch(url, { headers });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch test questions.');
        }

        if (testType === 'daily') {
          setSections([{
            sectionName: 'QA', // Daily questions default
            timeLimitMinutes: data.timeLimitMinutes || 20,
            questions: data.questions
          }]);
          setTestId(data.testId);
          setSecondsLeft(20 * 60);
        } else if (testType === 'interval') {
          setSections([{
            sectionName: 'QA',
            timeLimitMinutes: data.timeLimitMinutes || 12,
            questions: data.questions
          }]);
          setTestId(data.windowKey);
          setSecondsLeft(12 * 60);
        } else {
          setSections(data.sections);
          setTestId(data.testId);
          if (data.sections && data.sections[0]) {
            setSecondsLeft(data.sections[0].timeLimitMinutes * 60);
          }
        }
      } catch (err) {
        console.error('Failed to load questions:', err);
        alert('Failed to load test. Returning to dashboard.');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [token, testType, testIdParam]);

  // 2. Check for local storage unsubmitted session on load
  useEffect(() => {
    if (loading || !testId || isSessionChecked) return;

    const savedSession = localStorage.getItem(`UNSUBMITTED_WEB_TEST_${testId}`);
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      const confirmResume = window.confirm(
        `You have an unfinished test attempt from ${new Date(parsed.timestamp).toLocaleTimeString()}. Would you like to resume?`
      );

      if (confirmResume) {
        setAnswers(parsed.answers || {});
        setTimeSpent(parsed.timeSpent || {});
        setCurrentSectionIndex(parsed.currentSectionIndex || 0);
        setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
        setSecondsLeft(parsed.secondsLeft || 0);
      } else {
        localStorage.removeItem(`UNSUBMITTED_WEB_TEST_${testId}`);
      }
    }
    setIsSessionChecked(true);
  }, [loading, testId, isSessionChecked]);

  // 3. Auto-save every 10 seconds
  useEffect(() => {
    if (!isSessionChecked || !testId || submittedScorecard) return;

    const autoSaveInterval = setInterval(() => {
      const state = {
        answers,
        timeSpent,
        currentSectionIndex,
        currentQuestionIndex,
        secondsLeft,
        timestamp: Date.now(),
      };
      localStorage.setItem(`UNSUBMITTED_WEB_TEST_${testId}`, JSON.stringify(state));
      console.log('Progress auto-saved locally.');
    }, 10000);

    return () => clearInterval(autoSaveInterval);
  }, [answers, timeSpent, currentSectionIndex, currentQuestionIndex, secondsLeft, testId, isSessionChecked, submittedScorecard]);

  // 4. Timer decrement loop (every second)
  useEffect(() => {
    if (loading || !isSessionChecked || submittedScorecard || !activeSection) return;

    if (secondsLeft <= 0) {
      handleTimeExpired();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
      // Also increment active question duration
      if (activeQuestion) {
        setTimeSpent((prev) => ({
          ...prev,
          [activeQuestion._id]: (prev[activeQuestion._id] || 0) + 1,
        }));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, loading, isSessionChecked, activeQuestion, submittedScorecard]);

  const handleTimeExpired = () => {
    const isLastSection = currentSectionIndex === sections.length - 1;
    alert(`Time is up for the ${activeSection.sectionName} section!`);
    
    if (isLastSection) {
      handleFinalSubmit();
    } else {
      handleSectionComplete(currentSectionIndex + 1);
    }
  };

  const handleSectionComplete = (nextSectionIndex: number) => {
    setCurrentSectionIndex(nextSectionIndex);
    setCurrentQuestionIndex(0);
    if (sections[nextSectionIndex]) {
      setSecondsLeft(sections[nextSectionIndex].timeLimitMinutes * 60);
    }
  };

  const handleManualSubmitSection = () => {
    const isLastSection = currentSectionIndex === sections.length - 1;
    const sectionName = activeSection.sectionName;

    const confirmSubmit = window.confirm(
      isLastSection
        ? `Are you sure you want to finish the ${sectionName} section? This will submit your entire test.`
        : `Are you sure you want to lock the ${sectionName} section and move to the next? You CANNOT go back to this section later.`
    );

    if (confirmSubmit) {
      if (isLastSection) {
        handleFinalSubmit();
      } else {
        handleSectionComplete(currentSectionIndex + 1);
      }
    }
  };

  const handleFinalSubmit = async () => {
    try {
      // 1. Clear local auto-save
      localStorage.removeItem(`UNSUBMITTED_WEB_TEST_${testId}`);

      // 2. Package answers
      const submissionAnswers = [];
      let totalDurationSpent = 0;
      for (const section of sections) {
        for (const q of section.questions) {
          const duration = timeSpent[q._id] || 0;
          totalDurationSpent += duration;
          submissionAnswers.push({
            questionId: q._id,
            selectedAnswer: answers[q._id] || '',
            timeSpent: duration,
          });
        }
      }

      // 3. Post to backend scoring engine
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetch(`${API_BASE_URL}/tests/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          testType,
          testId,
          answers: submissionAnswers,
          durationSpent: totalDurationSpent,
          clientDateStr: todayStr,
        }),
      });

      const scorecardData = await res.json();
      if (!res.ok) {
        throw new Error(scorecardData.error || 'Failed to submit test.');
      }

      setSubmittedScorecard(scorecardData);
    } catch (err: any) {
      console.error(err);
      alert('Error submitting answers: ' + err.message);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div style={styles.loading}>Loading test session...</div>;
  }

  if (submittedScorecard) {
    return (
      <Scorecard
        score={submittedScorecard.score}
        analytics={submittedScorecard.analytics}
        gradedAnswers={submittedScorecard.gradedAnswers}
        onClose={() => navigate('/dashboard')}
      />
    );
  }

  const optionLetters = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div style={styles.container}>
      {/* Test Control Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.sectionTitle}>{activeSection.sectionName} Section</span>
          <span style={styles.questionNum}>Question {currentQuestionIndex + 1} of {activeQuestions.length}</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.timerLabel}>Time Left:</span>
          <span style={{ ...styles.timerValue, ...(secondsLeft < 120 ? styles.warningText : {}) }}>
            {formatTime(secondsLeft)}
          </span>
        </div>
      </header>

      {/* Workspace */}
      <div style={styles.workspace}>
        {activeQuestion.passageText ? (
          /* Split Screen Layout for RC/DILR */
          <div style={styles.splitScreen}>
            <div style={styles.leftPanel}>
              <h3 style={styles.panelTitle}>Reference Passage</h3>
              <p style={styles.passageContent}>{activeQuestion.passageText}</p>
            </div>
            
            <div style={styles.rightPanel}>
              <div style={styles.questionBox} className="glass-card">
                <TextContent text={activeQuestion.questionText} />
                {activeQuestion.type === 'MCQ' ? (
                  <div style={styles.optionsList}>
                    {activeQuestion.options.map((opt, idx) => {
                      const isSelected = answers[activeQuestion._id] === opt;
                      return (
                        <button
                          key={opt}
                          style={isSelected ? styles.optionBtnSelected : styles.optionBtn}
                          onClick={() => setAnswers({ ...answers, [activeQuestion._id]: opt })}
                        >
                          <span style={styles.optLetter}>{optionLetters[idx]}</span>
                          <span style={styles.optText}>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={styles.titaContainer}>
                    <label style={styles.titaLabel}>Type In Answer (TITA):</label>
                    <input
                      type="text"
                      style={styles.titaInput}
                      placeholder="Enter numerical value"
                      value={answers[activeQuestion._id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [activeQuestion._id]: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Centered Layout for Single Questions */
          <div style={styles.centeredLayout}>
            <div style={styles.centeredQuestionBox} className="glass-card">
              <TextContent text={activeQuestion.questionText} />
              
              {activeQuestion.type === 'MCQ' ? (
                <div style={styles.optionsList}>
                  {activeQuestion.options.map((opt, idx) => {
                    const isSelected = answers[activeQuestion._id] === opt;
                    return (
                      <button
                        key={opt}
                        style={isSelected ? styles.optionBtnSelected : styles.optionBtn}
                        onClick={() => setAnswers({ ...answers, [activeQuestion._id]: opt })}
                      >
                        <span style={styles.optLetter}>{optionLetters[idx]}</span>
                        <span style={styles.optText}>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={styles.titaContainer}>
                  <label style={styles.titaLabel}>Type In Answer (TITA):</label>
                  <input
                    type="text"
                    style={styles.titaInput}
                    placeholder="Enter numerical value"
                    value={answers[activeQuestion._id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [activeQuestion._id]: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <footer style={styles.footer}>
        <button
          style={currentQuestionIndex === 0 ? styles.navBtnDisabled : styles.navBtn}
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
        >
          Previous
        </button>

        <div style={styles.footerCenter}>
          <button style={styles.submitSectionBtn} onClick={handleManualSubmitSection}>
            {currentSectionIndex === sections.length - 1 ? 'Submit Test' : 'Submit Section'}
          </button>
        </div>

        <button
          style={currentQuestionIndex === activeQuestions.length - 1 ? styles.navBtnDisabled : styles.navBtn}
          disabled={currentQuestionIndex === activeQuestions.length - 1}
          onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
        >
          Next
        </button>
      </footer>
    </div>
  );
}

// LaTeX and Markdown Text Parser Mock Component
function TextContent({ text }: { text: string }) {
  // Regex to identify markdown tables in questions
  const isTable = text.includes('|');
  if (isTable) {
    const lines = text.split('\n');
    return (
      <div style={styles.textWrap}>
        {lines.map((l, idx) => {
          if (l.trim().startsWith('|')) {
            const cells = l.split('|').filter(c => c.trim().length > 0);
            return (
              <div key={idx} style={styles.tableRow}>
                {cells.map((c, i) => (
                  <span key={i} style={styles.tableCell}>{c.trim()}</span>
                ))}
              </div>
            );
          }
          return <p key={idx} style={styles.questionParagraph}>{l}</p>;
        })}
      </div>
    );
  }
  return <p style={styles.questionText}>{text}</p>;
}

const styles = {
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    color: '#8E8E9F',
  },
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    backgroundColor: '#0A0A0C',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: '#131317',
    borderBottom: '1px solid #26262E',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: '18px',
  },
  questionNum: {
    color: '#8E8E9F',
    fontSize: '13px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  timerLabel: {
    color: '#8E8E9F',
    fontSize: '13px',
  },
  timerValue: {
    color: '#FFFFFF',
    fontSize: '22px',
    fontWeight: '700',
  },
  warningText: {
    color: '#EF4444',
  },
  workspace: {
    flex: 1,
    overflowY: 'auto' as const,
  },
  splitScreen: {
    display: 'flex',
    height: '100%',
  },
  leftPanel: {
    flex: 1,
    padding: '24px',
    backgroundColor: '#0F0F12',
    borderRight: '1px solid #26262E',
    overflowY: 'auto' as const,
  },
  panelTitle: {
    fontSize: '13px',
    color: '#3B82F6',
    textTransform: 'uppercase' as const,
    fontWeight: '600',
    marginBottom: '16px',
    letterSpacing: '0.5px',
  },
  passageContent: {
    color: '#E1E1E6',
    fontSize: '15px',
    lineHeight: '26px',
  },
  rightPanel: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto' as const,
  },
  questionBox: {
    marginBottom: '20px',
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: '16px',
    lineHeight: '24px',
    marginBottom: '24px',
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  optionBtn: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'left' as const,
    backgroundColor: '#1C1C22',
    border: '1px solid #26262E',
    borderRadius: '8px',
    padding: '14px 18px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  optionBtnSelected: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'left' as const,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    border: '1px solid #3B82F6',
    borderRadius: '8px',
    padding: '14px 18px',
    cursor: 'pointer',
  },
  optLetter: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: '#0A0A0C',
    color: '#8E8E9F',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '12px',
    fontWeight: '700',
    marginRight: '14px',
  },
  optText: {
    color: '#E1E1E6',
    fontSize: '14px',
    flex: 1,
  },
  titaContainer: {
    marginTop: '20px',
  },
  titaLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: '10px',
  },
  titaInput: {
    backgroundColor: '#0A0A0C',
    border: '1px solid #26262E',
    borderRadius: '8px',
    width: '100%',
    height: '44px',
    padding: '0 16px',
    color: '#FFFFFF',
    fontSize: '15px',
    outline: 'none',
  },
  centeredLayout: {
    maxWidth: '800px',
    margin: '40px auto',
    padding: '0 20px',
  },
  centeredQuestionBox: {
    width: '100%',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: '#131317',
    borderTop: '1px solid #26262E',
  },
  navBtn: {
    backgroundColor: '#1C1C22',
    color: '#FFFFFF',
    border: '1px solid #26262E',
    height: '40px',
    borderRadius: '6px',
    padding: '0 20px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  navBtnDisabled: {
    backgroundColor: '#131317',
    color: '#535362',
    border: '1px solid #1C1C22',
    height: '40px',
    borderRadius: '6px',
    padding: '0 20px',
    fontWeight: '600',
    cursor: 'default',
    opacity: 0.5,
  },
  footerCenter: {},
  submitSectionBtn: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    height: '40px',
    borderRadius: '6px',
    padding: '0 24px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  textWrap: {
    marginBottom: '20px',
  },
  questionParagraph: {
    color: '#FFFFFF',
    fontSize: '15px',
    lineHeight: '22px',
    marginBottom: '12px',
  },
  tableRow: {
    display: 'flex',
    borderBottom: '1px solid #26262E',
    backgroundColor: '#1C1C22',
    padding: '8px 12px',
  },
  tableCell: {
    flex: 1,
    color: '#E1E1E6',
    fontSize: '13px',
  },
};
