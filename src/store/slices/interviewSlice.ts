import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface InterviewState {
  isActive: boolean;
  currentQuestionIndex: number;
  timeRemaining: number;
  isPaused: boolean;
  isTimerRunning: boolean;
}

const initialState: InterviewState = {
  isActive: false,
  currentQuestionIndex: 0,
  timeRemaining: 0,
  isPaused: false,
  isTimerRunning: false,
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    startInterview: (state) => {
      state.isActive = true;
      state.currentQuestionIndex = 0;
      state.isPaused = false;
      state.isTimerRunning = false;
      state.timeRemaining = 0;
    },
    endInterview: (state) => {
      state.isActive = false;
      state.isTimerRunning = false;
      state.timeRemaining = 0;
    },
    nextQuestion: (state) => {
      state.currentQuestionIndex += 1;
      state.isTimerRunning = false;
      state.timeRemaining = 0;
    },
    setTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    startTimer: (state, action: PayloadAction<number>) => {
      state.isTimerRunning = true;
      state.timeRemaining = action.payload;
    },
    stopTimer: (state) => {
      state.isTimerRunning = false;
    },
    pauseInterview: (state) => {
      state.isPaused = true;
      state.isTimerRunning = false;
    },
    resumeInterview: (state) => {
      // When resuming, we need to ensure the interview is active
      state.isActive = true;
      state.isPaused = false;
      // Note: Timer state should be managed by the component when resuming
    },
    resetInterview: (state) => {
      return initialState;
    },
  },
});

export const {
  startInterview,
  endInterview,
  nextQuestion,
  setTimeRemaining,
  startTimer,
  stopTimer,
  pauseInterview,
  resumeInterview,
  resetInterview,
} = interviewSlice.actions;

export default interviewSlice.reducer;