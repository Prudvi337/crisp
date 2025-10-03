import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { store } from '@/store/store';
import { addCandidate, addMessage, addQuestion, updateCandidate, updateQuestion, completeInterview } from '@/store/slices/candidatesSlice';
import { startInterview, nextQuestion, startTimer, stopTimer, setTimeRemaining, resumeInterview } from '@/store/slices/interviewSlice';
import { ResumeUpload } from '@/components/ResumeUpload';
import { ChatMessage } from '@/components/ChatMessage';
import { TimerDisplay } from '@/components/TimerDisplay';
import { InterviewerAccessModal } from '@/components/InterviewerAccessModal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Send, CheckCircle, Home, Users } from 'lucide-react';
import { extractResumeInfo, generateQuestion, scoreAnswer, generateFinalSummary, getMissingFieldPrompt } from '@/lib/aiService';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from 'nanoid';
import { useNavigate } from 'react-router-dom';

const DIFFICULTY_TIME_LIMITS = {
  easy: 30,
  medium: 90,
  hard: 180,
};

export default function IntervieweePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentCandidateId = useAppSelector(state => state.candidates.currentCandidateId);
  const candidate = useAppSelector(state => 
    state.candidates.candidates.find(c => c.id === currentCandidateId)
  );
  const interviewState = useAppSelector(state => state.interview);
  
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [currentField, setCurrentField] = useState<string | null>(null);
  const [showInterviewerAccess, setShowInterviewerAccess] = useState(false);

  const handleAccessGranted = () => {
    setShowInterviewerAccess(false);
    navigate('/interviewer');
  };

  // Initialize the interview state when resuming
  useEffect(() => {
    if (candidate && candidate.status === 'in-progress' && !interviewState.isActive) {
      // If we have a candidate in progress but interview is not active, activate it
      dispatch(startInterview());
      
      // If there are questions, restart the timer for the current question
      if (candidate.questions.length > 0 && candidate.questions[candidate.currentQuestionIndex]) {
        const currentQuestion = candidate.questions[candidate.currentQuestionIndex];
        // Start timer for current question after a short delay
        setTimeout(() => {
          if (interviewState.timeRemaining === 0) {
            dispatch(startTimer(currentQuestion.timeLimit));
          }
        }, 100);
      } else if (candidate.questions.length === 0) {
        // If no questions exist, start the first one
        setTimeout(() => {
          askNextQuestion(candidate.id, 'easy');
        }, 100);
      }
    }
  }, [candidate, interviewState.isActive, interviewState.timeRemaining]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [candidate?.messages]);

  useEffect(() => {
    if (!interviewState.isTimerRunning || interviewState.timeRemaining <= 0) return;

    const interval = setInterval(() => {
      const newTime = interviewState.timeRemaining - 1;
      dispatch(setTimeRemaining(newTime));
      
      if (newTime <= 0) {
        handleTimeUp();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [interviewState.isTimerRunning]);

  useEffect(() => {
    // Add additional anti-copy protections when interview is in progress
    if (candidate?.status === 'in-progress') {
      const handleBeforePrint = (e: Event) => {
        e.preventDefault();
        return false;
      };
      
      const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent common screenshot/copy shortcuts
        if (
          (e.ctrlKey || e.metaKey) && 
          (e.key === 'p' || e.key === 's' || e.key === 'u') ||
          e.key === 'F12' ||
          e.key === 'PrintScreen'
        ) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        
        // Prevent Ctrl+A (select all)
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
          // Allow select all for user's own answers
          const activeElement = document.activeElement;
          if (activeElement && activeElement instanceof HTMLTextAreaElement) {
            // Allow in textarea (user input)
            return true;
          }
          e.preventDefault();
          return false;
        }
      };

      document.addEventListener('beforeprint', handleBeforePrint);
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('beforeprint', handleBeforePrint);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [candidate?.status]);

  const handleResumeUpload = async (resumeText: string, extractedData: { name?: string; email?: string; phone?: string }) => {
    try {
      setIsProcessing(true);
      
      // Use extracted data directly from the backend
      const newCandidate = {
        id: nanoid(),
        name: extractedData.name || '',
        email: extractedData.email || '',
        phone: extractedData.phone || '',
        resumeText,
        messages: [],
        questions: [],
        currentQuestionIndex: 0,
        finalScore: 0,
        summary: '',
        status: 'info-collection' as const,
        createdAt: Date.now(),
      };

      dispatch(addCandidate(newCandidate));

      // Check for missing fields
      const missing: string[] = [];
      if (!newCandidate.name) missing.push('name');
      if (!newCandidate.email) missing.push('email');
      if (!newCandidate.phone) missing.push('phone');

      if (missing.length > 0) {
        setMissingFields(missing);
        setCurrentField(missing[0]);
        
        const prompt = await getMissingFieldPrompt(missing);
        dispatch(addMessage({
          candidateId: newCandidate.id,
          message: {
            id: nanoid(),
            role: 'assistant',
            content: prompt,
            timestamp: Date.now(),
          },
        }));
      } else {
        startInterviewProcess(newCandidate.id);
      }
    } catch (error) {
      console.error('Error processing resume:', error);
      toast({
        variant: 'destructive',
        title: 'Processing failed',
        description: 'Failed to process resume information',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !candidate) return;

    const message = {
      id: nanoid(),
      role: 'user' as const,
      content: userInput.trim(),
      timestamp: Date.now(),
    };

    dispatch(addMessage({ candidateId: candidate.id, message }));
    const input = userInput;
    setUserInput('');
    setIsProcessing(true);

    try {
      if (candidate.status === 'info-collection' && currentField) {
        // Update missing field
        const updates: any = {};
        updates[currentField] = input;
        dispatch(updateCandidate({ id: candidate.id, updates }));

        const remainingFields = missingFields.filter(f => f !== currentField);
        setMissingFields(remainingFields);

        if (remainingFields.length > 0) {
          setCurrentField(remainingFields[0]);
          const prompt = await getMissingFieldPrompt(remainingFields);
          dispatch(addMessage({
            candidateId: candidate.id,
            message: {
              id: nanoid(),
              role: 'assistant',
              content: prompt,
              timestamp: Date.now(),
            },
          }));
        } else {
          setCurrentField(null);
          startInterviewProcess(candidate.id);
        }
      } else if (candidate.status === 'in-progress') {
        // Process answer
        await handleAnswer(input);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process your response',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const startInterviewProcess = async (candidateId: string) => {
    dispatch(updateCandidate({
      id: candidateId,
      updates: { status: 'in-progress' },
    }));

    dispatch(addMessage({
      candidateId,
      message: {
        id: nanoid(),
        role: 'assistant',
        content: "Great! Let's begin your Full Stack (React/Node) interview. You'll answer 6 questions: 2 Easy, 2 Medium, and 2 Hard. Each question has a time limit. Good luck!",
        timestamp: Date.now(),
      },
    }));

    dispatch(startInterview());
    await askNextQuestion(candidateId, 'easy');
  };

  const askNextQuestion = async (candidateId: string, difficulty: 'easy' | 'medium' | 'hard') => {
    try {
      const state = store.getState();
      const cand = state.candidates.candidates.find(c => c.id === candidateId);
      const previousQuestions = cand?.questions.map(q => q.question) || [];
      
      const questionData = await generateQuestion(difficulty, previousQuestions);
      const timeLimit = DIFFICULTY_TIME_LIMITS[difficulty];

      const question = {
        id: nanoid(),
        question: questionData.question,
        difficulty,
        userAnswer: '',
        score: 0,
        feedback: '',
        timeLimit,
        timeTaken: 0,
      };

      dispatch(addQuestion({ candidateId, question }));
      
      dispatch(addMessage({
        candidateId,
        message: {
          id: nanoid(),
          role: 'system',
          content: `Question ${(cand?.questions.length || 0) + 1}/6 - ${difficulty.toUpperCase()}`,
          timestamp: Date.now(),
        },
      }));

      dispatch(addMessage({
        candidateId,
        message: {
          id: nanoid(),
          role: 'assistant',
          content: questionData.question,
          timestamp: Date.now(),
        },
      }));

      dispatch(startTimer(timeLimit));
    } catch (error) {
      console.error('Error generating question:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate question',
      });
    }
  };

  const handleAnswer = async (answer: string) => {
    if (!candidate) return;

    dispatch(stopTimer());
    
    const currentQ = candidate.questions[candidate.currentQuestionIndex];
    const timeTaken = currentQ.timeLimit - interviewState.timeRemaining;

    try {
      // Still score the answer for internal tracking, but don't show feedback immediately
      const scored = await scoreAnswer(currentQ.question, answer, currentQ.difficulty);

      dispatch(updateQuestion({
        candidateId: candidate.id,
        questionId: currentQ.id,
        updates: {
          userAnswer: answer,
          score: scored.score,
          // Don't store feedback yet - it will be shown at the end
          timeTaken,
        },
      }));

      // Instead of showing score and feedback immediately, show a neutral message
      dispatch(addMessage({
        candidateId: candidate.id,
        message: {
          id: nanoid(),
          role: 'assistant',
          content: "Answer recorded. Moving to the next question...",
          timestamp: Date.now(),
        },
      }));

      // Move to next question
      const nextIndex = candidate.currentQuestionIndex + 1;
      dispatch(updateCandidate({
        id: candidate.id,
        updates: { currentQuestionIndex: nextIndex },
      }));

      if (nextIndex < 6) {
        dispatch(nextQuestion());
        
        let difficulty: 'easy' | 'medium' | 'hard';
        if (nextIndex < 2) difficulty = 'easy';
        else if (nextIndex < 4) difficulty = 'medium';
        else difficulty = 'hard';

        setTimeout(() => askNextQuestion(candidate.id, difficulty), 2000);
      } else {
        // Interview complete
        await finalizeInterview();
      }
    } catch (error) {
      console.error('Error scoring answer:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to score answer',
      });
    }
  };

  const handleTimeUp = async () => {
    if (!candidate || !interviewState.isTimerRunning) return;
    
    dispatch(stopTimer());
    
    dispatch(addMessage({
      candidateId: candidate.id,
      message: {
        id: nanoid(),
        role: 'system',
        content: "Time's up! Submitting your answer...",
        timestamp: Date.now(),
      },
    }));

    // Auto-submit with current input or empty answer
    await handleAnswer(userInput || '(No answer provided)');
    setUserInput('');
  };

  const finalizeInterview = async () => {
    if (!candidate) return;

    try {
      const questionsData = candidate.questions.map(q => ({
        question: q.question,
        answer: q.userAnswer,
        score: q.score,
        difficulty: q.difficulty,
      }));

      const summary = await generateFinalSummary(questionsData);

      dispatch(completeInterview({
        candidateId: candidate.id,
        finalScore: summary.finalScore,
        summary: summary.summary,
      }));

      // Show all scores and feedback at the end
      let detailedFeedback = "Interview Complete!\n\n";
      detailedFeedback += `Final Score: ${summary.finalScore}/100\n\n`;
      detailedFeedback += "Question-by-question breakdown:\n\n";
      
      candidate.questions.forEach((q, index) => {
        detailedFeedback += `Q${index + 1} (${q.difficulty}): ${q.score}/10\n`;
      });
      
      detailedFeedback += `\n${summary.summary}`;

      dispatch(addMessage({
        candidateId: candidate.id,
        message: {
          id: nanoid(),
          role: 'assistant',
          content: detailedFeedback,
          timestamp: Date.now(),
        },
      }));

      toast({
        title: 'Interview completed!',
        description: `Final score: ${summary.finalScore}/100`,
      });
    } catch (error) {
      console.error('Error finalizing interview:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate final summary',
      });
    }
  };

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-3 sm:mb-4">
              Crisp Interview Assistant
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              AI-Powered Full Stack Developer Interview
            </p>
          </div>
          <ResumeUpload onUpload={handleResumeUpload} />
        </div>
      </div>
    );
  }

  const currentQuestion = candidate.questions[candidate.currentQuestionIndex];
  const showTimer = candidate.status === 'in-progress' && currentQuestion && interviewState.isTimerRunning;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background to-muted/20">
      <InterviewerAccessModal 
        open={showInterviewerAccess} 
        onOpenChange={setShowInterviewerAccess} 
        onAccessGranted={handleAccessGranted} 
      />
      
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm" onClick={() => navigate('/')}>
                <Home className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Home
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs sm:text-sm"
                onClick={() => setShowInterviewerAccess(true)}
              >
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Dashboard
              </Button>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">Your Interview Session</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {candidate.name} • {candidate.status === 'completed' ? 'Completed' : 
                  <span className="inline-flex items-center gap-1 sm:gap-2">
                    Question {candidate.currentQuestionIndex + 1}/6
                    <div className="w-24 sm:w-32 h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-primary transition-all duration-300" 
                        style={{ width: `${(candidate.currentQuestionIndex + 1) * 16.67}%` }}
                      />
                    </div>
                  </span>
                }
              </p>
            </div>
            {showTimer && (
              <TimerDisplay
                timeRemaining={interviewState.timeRemaining}
                totalTime={currentQuestion.timeLimit}
                isRunning={interviewState.isTimerRunning}
                onTimeUp={handleTimeUp}
              />
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-3 sm:p-6">
          {candidate.messages.map((msg) => (
            <ChatMessage key={msg.id} {...msg} />
          ))}
          {isProcessing && (
            <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-none px-3 py-2 sm:px-4 sm:py-3">
                <p className="text-xs sm:text-sm text-muted-foreground">Thinking...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      {candidate.status !== 'completed' && (
        <div className="border-t bg-card/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto p-3 sm:p-4">
            <div className="flex gap-2 sm:gap-3">
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                onPaste={(e) => {
                  // Prevent pasting in the answer input
                  if (candidate.status === 'in-progress') {
                    e.preventDefault();
                    toast({
                      variant: 'destructive',
                      title: 'Paste not allowed',
                      description: 'You must type your answer manually.',
                    });
                  }
                }}
                placeholder={
                  candidate.status === 'info-collection'
                    ? `Enter your ${currentField}...`
                    : 'Type your answer...'
                }
                className="min-h-[50px] sm:min-h-[60px] resize-none text-sm sm:text-base"
                disabled={isProcessing}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!userInput.trim() || isProcessing}
                size="sm"
                className="px-3 sm:px-6 h-10 sm:h-12"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {candidate.status === 'completed' && (
        <div className="border-t bg-gradient-primary">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 text-center text-white">
            <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Interview Completed!</h3>
            <p className="text-base sm:text-lg">Final Score: {candidate.finalScore}/100</p>
          </div>
        </div>
      )}
    </div>
  );
}