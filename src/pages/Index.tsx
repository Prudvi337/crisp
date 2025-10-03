import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setShowWelcomeBack } from '@/store/slices/uiSlice';
import { setCurrentCandidate } from '@/store/slices/candidatesSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WelcomeBackModal } from '@/components/WelcomeBackModal';
import { InterviewerAccessModal } from '@/components/InterviewerAccessModal';
import { Users, UserCircle, ArrowRight, CheckCircle, Clock, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const candidates = useAppSelector(state => state.candidates.candidates);
  const currentCandidateId = useAppSelector(state => state.candidates.currentCandidateId);
  const currentCandidate = useAppSelector(state => 
    state.candidates.candidates.find(c => c.id === currentCandidateId)
  );
  
  const [showInterviewerAccess, setShowInterviewerAccess] = useState(false);

  const handleAccessGranted = () => {
    setShowInterviewerAccess(false);
    navigate('/interviewer');
  };

  useEffect(() => {
    // Check if there's an unfinished interview on mount
    if (currentCandidate && currentCandidate.status !== 'completed') {
      dispatch(setShowWelcomeBack(true));
    } else {
      // If there's no current candidate but we have candidates, set the most recent one
      const inProgressCandidate = candidates.find(c => c.status !== 'completed');
      if (inProgressCandidate) {
        dispatch(setCurrentCandidate(inProgressCandidate.id));
        dispatch(setShowWelcomeBack(true));
      }
    }
  }, [candidates]);

  const handleStartInterview = () => {
    // Clear any existing candidate if starting fresh
    if (currentCandidate && currentCandidate.status !== 'completed') {
      dispatch(setShowWelcomeBack(true));
    } else {
      navigate('/interviewee');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <WelcomeBackModal />
      <InterviewerAccessModal 
        open={showInterviewerAccess} 
        onOpenChange={setShowInterviewerAccess} 
        onAccessGranted={handleAccessGranted} 
      />
      
      <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Crisp Interview Assistant
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Experience the future of technical interviews. Our AI-powered platform conducts comprehensive Full Stack React/Node.js assessments with real-time feedback and intelligent scoring.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-4 sm:mt-6">
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
              AI-Powered
            </div>
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
              Real-time Feedback
            </div>
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-violet-500" />
              Secure Platform
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          <Card 
            className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-2 hover:border-primary/20 bg-gradient-to-b from-background to-muted/5"
            onClick={handleStartInterview}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-lg">
                <UserCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <CardTitle className="text-xl sm:text-2xl bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Start Your Interview
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Take your technical interview with our AI assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 space-y-1 sm:space-y-2">
                <li>• Upload PDF or DOCX resume</li>
                <li>• Answer 6 technical questions</li>
                <li>• Real-time AI scoring and feedback</li>
                <li>• Comprehensive final evaluation</li>
              </ul>
              <Button className="w-full group-hover:bg-primary/90" size="lg">
                Start Interview
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="group hover:shadow-lg transition-all duration-300 cursor-pointer" 
            onClick={() => setShowInterviewerAccess(true)}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-green-500 to-green-600 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <CardTitle className="text-xl sm:text-2xl">Interviewer Dashboard</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Review candidate interviews and manage hiring decisions
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 space-y-1 sm:space-y-2">
                <li>• View all candidate interviews</li>
                <li>• Detailed performance analytics</li>
                <li>• AI-generated summaries</li>
                <li>• Export candidate reports</li>
              </ul>
              <Button className="w-full group-hover:bg-primary/90" size="lg">
                View Dashboard
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 sm:mt-16 text-center">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <span className="text-primary font-bold text-base sm:text-lg">1</span>
              </div>
              <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Upload Resume</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Upload your PDF or DOCX resume for AI analysis</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <span className="text-primary font-bold text-base sm:text-lg">2</span>
              </div>
              <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Take Interview</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Answer 6 questions with AI-powered real-time scoring</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <span className="text-primary font-bold text-base sm:text-lg">3</span>
              </div>
              <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Get Results</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Receive detailed feedback and final evaluation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;