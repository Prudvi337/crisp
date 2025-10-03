import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Question {
  id: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  userAnswer: string;
  score: number;
  feedback: string;
  timeLimit: number;
  timeTaken: number;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeText: string;
  messages: Message[];
  questions: Question[];
  currentQuestionIndex: number;
  finalScore: number;
  summary: string;
  status: 'info-collection' | 'in-progress' | 'completed';
  createdAt: number;
  completedAt?: number;
}

interface CandidatesState {
  candidates: Candidate[];
  currentCandidateId: string | null;
}

const initialState: CandidatesState = {
  candidates: [],
  currentCandidateId: null,
};

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    addCandidate: (state, action: PayloadAction<Candidate>) => {
      state.candidates.push(action.payload);
      state.currentCandidateId = action.payload.id;
    },
    updateCandidate: (state, action: PayloadAction<{ id: string; updates: Partial<Candidate> }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.id);
      if (candidate) {
        Object.assign(candidate, action.payload.updates);
      }
    },
    addMessage: (state, action: PayloadAction<{ candidateId: string; message: Message }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.candidateId);
      if (candidate) {
        candidate.messages.push(action.payload.message);
      }
    },
    addQuestion: (state, action: PayloadAction<{ candidateId: string; question: Question }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.candidateId);
      if (candidate) {
        candidate.questions.push(action.payload.question);
      }
    },
    updateQuestion: (state, action: PayloadAction<{ candidateId: string; questionId: string; updates: Partial<Question> }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.candidateId);
      if (candidate) {
        const question = candidate.questions.find(q => q.id === action.payload.questionId);
        if (question) {
          Object.assign(question, action.payload.updates);
        }
      }
    },
    setCurrentCandidate: (state, action: PayloadAction<string | null>) => {
      state.currentCandidateId = action.payload;
    },
    completeInterview: (state, action: PayloadAction<{ candidateId: string; finalScore: number; summary: string }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.candidateId);
      if (candidate) {
        candidate.status = 'completed';
        candidate.finalScore = action.payload.finalScore;
        candidate.summary = action.payload.summary;
        candidate.completedAt = Date.now();
      }
    },
  },
});

export const {
  addCandidate,
  updateCandidate,
  addMessage,
  addQuestion,
  updateQuestion,
  setCurrentCandidate,
  completeInterview,
} = candidatesSlice.actions;

export default candidatesSlice.reducer;
