import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import CATSectionTimer from '../../components/CATSectionTimer';

// Mock Test Schema Interfaces
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

interface MockTestScreenProps {
  testId: string;
  sections: Section[];
  onSubmitTest: (answers: Array<{ questionId: string; selectedAnswer: string; timeSpent: number }>) => void;
}

export default function MockTestScreen({ testId, sections, onSubmitTest }: MockTestScreenProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Maps questionId -> selectedAnswer
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Maps questionId -> timeSpent (seconds)
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({});

  const activeSection = sections[currentSectionIndex];
  const activeQuestions = activeSection ? activeSection.questions : [];
  const activeQuestion = activeQuestions[currentQuestionIndex];

  // Increment timer every second for the active question
  React.useEffect(() => {
    if (!activeQuestion) return;
    
    const interval = setInterval(() => {
      setTimeSpent((prev) => ({
        ...prev,
        [activeQuestion._id]: (prev[activeQuestion._id] || 0) + 1,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuestion?._id]);

  const handleSelectOption = (option: string) => {
    if (!activeQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [activeQuestion._id]: option,
    }));
  };

  const handleTITAChange = (text: string) => {
    if (!activeQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [activeQuestion._id]: text,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSectionComplete = (nextSectionIndex: number) => {
    // Lock logic: move forward to next section index and reset question index
    setCurrentSectionIndex(nextSectionIndex);
    setCurrentQuestionIndex(0);
  };

  const handleManualSubmitSection = () => {
    const isLastSection = currentSectionIndex === sections.length - 1;
    const sectionName = activeSection.sectionName;

    Alert.alert(
      'Confirm Section Submission',
      isLastSection
        ? `Are you sure you want to finish the ${sectionName} section? This will submit your entire mock test.`
        : `Are you sure you want to lock the ${sectionName} section and move to the next? You CANNOT go back to this section later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            if (isLastSection) {
              handleFinalSubmit();
            } else {
              handleSectionComplete(currentSectionIndex + 1);
            }
          },
        },
      ]
    );
  };

  const handleFinalSubmit = () => {
    // Package answers
    const submissionAnswers = [];
    for (const section of sections) {
      for (const q of section.questions) {
        submissionAnswers.push({
          questionId: q._id,
          selectedAnswer: answers[q._id] || '',
          timeSpent: timeSpent[q._id] || 0,
        });
      }
    }
    onSubmitTest(submissionAnswers);
  };

  if (!activeSection || !activeQuestion) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No sections loaded.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Strict Sectional Timer Header */}
      <CATSectionTimer
        sections={sections}
        currentSectionIndex={currentSectionIndex}
        onSectionComplete={handleSectionComplete}
        onTestComplete={handleFinalSubmit}
      />

      <View style={styles.questionMetaRow}>
        <Text style={styles.questionNumberText}>
          Question {currentQuestionIndex + 1} of {activeQuestions.length}
        </Text>
        <View style={styles.sectionTypeBadge}>
          <Text style={styles.sectionTypeBadgeText}>{activeQuestion.type}</Text>
        </View>
      </View>

      <ScrollView style={styles.workspace} contentContainerStyle={styles.workspaceContent}>
        {/* Render passage text if it is grouped, like Reading Comprehension or DILR Caselets */}
        {activeQuestion.passageText ? (
          <View style={styles.passageCard}>
            <Text style={styles.passageLabel}>Reference Passage / Caselet Context:</Text>
            <Text style={styles.passageText}>{activeQuestion.passageText}</Text>
          </View>
        ) : null}

        {/* Question Panel */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{activeQuestion.questionText}</Text>
        </View>

        {/* Answer Input Panel */}
        <View style={styles.answerSection}>
          {activeQuestion.type === 'MCQ' ? (
            activeQuestion.options.map((option, idx) => {
              const isSelected = answers[activeQuestion._id] === option;
              const optionLetters = ['A', 'B', 'C', 'D', 'E'];
              
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, isSelected && styles.selectedOptionButton]}
                  onPress={() => handleSelectOption(option)}
                >
                  <View style={[styles.optionCircle, isSelected && styles.selectedOptionCircle]}>
                    <Text style={[styles.optionCircleText, isSelected && styles.selectedOptionCircleText]}>
                      {optionLetters[idx] || (idx + 1)}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.titaContainer}>
              <Text style={styles.titaLabel}>Type In Your Answer (TITA):</Text>
              <TextInput
                style={styles.titaInput}
                placeholder="Enter numerical values or exact text"
                placeholderTextColor="#535362"
                value={answers[activeQuestion._id] || ''}
                onChangeText={handleTITAChange}
                keyboardType="numeric" // CAT TITAs are mostly numeric values
              />
              <Text style={styles.titaHelpText}>
                No negative markings apply for incorrect TITA responses.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Nav Controls */}
      <View style={styles.footerNav}>
        <TouchableOpacity
          style={[styles.navButton, currentQuestionIndex === 0 && styles.disabledNavButton]}
          onPress={handlePrevQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <Text style={[styles.navButtonText, currentQuestionIndex === 0 && styles.disabledNavButtonText]}>
            Previous
          </Text>
        </TouchableOpacity>

        {currentQuestionIndex < activeQuestions.length - 1 ? (
          <TouchableOpacity style={styles.navButton} onPress={handleNextQuestion}>
            <Text style={styles.navButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.submitSectionButton} onPress={handleManualSubmitSection}>
            <Text style={styles.submitSectionButtonText}>
              {currentSectionIndex === sections.length - 1 ? 'Submit Mock' : 'Submit Section'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121214',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
  },
  questionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  questionNumberText: {
    color: '#8E8E9F',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTypeBadge: {
    backgroundColor: '#1E1E24',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#2F2F37',
  },
  sectionTypeBadgeText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
  },
  workspace: {
    flex: 1,
  },
  workspaceContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  passageCard: {
    backgroundColor: '#16161B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#25252B',
    marginBottom: 16,
  },
  passageLabel: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  passageText: {
    color: '#E1E1E6',
    fontSize: 14,
    lineHeight: 22,
  },
  questionCard: {
    backgroundColor: '#1E1E24',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2F2F37',
    marginBottom: 16,
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  answerSection: {
    marginTop: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2F2F37',
  },
  selectedOptionButton: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderColor: '#2563EB',
  },
  optionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16161B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#2F2F37',
  },
  selectedOptionCircle: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  optionCircleText: {
    color: '#8E8E9F',
    fontWeight: '600',
    fontSize: 12,
  },
  selectedOptionCircleText: {
    color: '#FFFFFF',
  },
  optionText: {
    color: '#E1E1E6',
    fontSize: 14,
    flex: 1,
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  titaContainer: {
    backgroundColor: '#1E1E24',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2F2F37',
  },
  titaLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  titaInput: {
    backgroundColor: '#16161B',
    color: '#FFFFFF',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2F2F37',
    fontSize: 15,
  },
  titaHelpText: {
    color: '#8E8E9F',
    fontSize: 11,
    marginTop: 8,
  },
  footerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1E1E24',
    borderTopWidth: 1,
    borderColor: '#2F2F37',
  },
  navButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#16161B',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#2F2F37',
  },
  disabledNavButton: {
    backgroundColor: '#121214',
    borderColor: '#18181F',
    opacity: 0.5,
  },
  navButtonText: {
    color: '#E1E1E6',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledNavButtonText: {
    color: '#535362',
  },
  submitSectionButton: {
    flex: 1.2,
    height: 48,
    backgroundColor: '#10B981',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  submitSectionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
