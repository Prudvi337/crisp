import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  showWelcomeBack: boolean;
  selectedCandidateId: string | null;
  searchQuery: string;
  sortBy: 'score' | 'date' | 'name';
  sortOrder: 'asc' | 'desc';
}

const initialState: UIState = {
  showWelcomeBack: false,
  selectedCandidateId: null,
  searchQuery: '',
  sortBy: 'score',
  sortOrder: 'desc',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setShowWelcomeBack: (state, action: PayloadAction<boolean>) => {
      state.showWelcomeBack = action.payload;
    },
    setSelectedCandidateId: (state, action: PayloadAction<string | null>) => {
      state.selectedCandidateId = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSortBy: (state, action: PayloadAction<'score' | 'date' | 'name'>) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload;
    },
  },
});

export const {
  setShowWelcomeBack,
  setSelectedCandidateId,
  setSearchQuery,
  setSortBy,
  setSortOrder,
} = uiSlice.actions;

export default uiSlice.reducer;
