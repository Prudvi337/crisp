import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setShowWelcomeBack } from '@/store/slices/uiSlice';
import { resetInterview, resumeInterview } from '@/store/slices/interviewSlice';
import { setCurrentCandidate } from '@/store/slices/candidatesSlice';
import { useNavigate } from 'react-router-dom';

export function WelcomeBackModal() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const showWelcomeBack = useAppSelector(state => state.ui.showWelcomeBack);
  const currentCandidate = useAppSelector(state => {
    const id = state.candidates.currentCandidateId;
    return state.candidates.candidates.find(c => c.id === id);
  });

  const handleResume = () => {
    // Resume the interview state
    dispatch(resumeInterview());
    dispatch(setShowWelcomeBack(false));
    navigate('/interviewee');
  };

  const handleStartNew = () => {
    // Reset interview state
    dispatch(resetInterview());
    // Clear current candidate
    dispatch(setCurrentCandidate(null));
    dispatch(setShowWelcomeBack(false));
    navigate('/interviewee');
  };

  if (!currentCandidate || currentCandidate.status === 'completed') {
    return null;
  }

  return (
    <Dialog open={showWelcomeBack} onOpenChange={(open) => dispatch(setShowWelcomeBack(open))}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome Back!</DialogTitle>
          <DialogDescription className="text-base pt-2">
            We found an unfinished interview session for{' '}
            <span className="font-semibold text-foreground">{currentCandidate.name || 'your account'}</span>.
            Would you like to continue where you left off?
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-gradient-card rounded-lg p-4 my-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-medium">
                Question {currentCandidate.currentQuestionIndex + 1} of 6
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium capitalize">{currentCandidate.status}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleStartNew} className="w-full sm:w-auto">
            Start New Interview
          </Button>
          <Button onClick={handleResume} className="w-full sm:w-auto">
            Continue Interview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}