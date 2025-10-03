import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSearchQuery, setSortBy, setSortOrder, setSelectedCandidateId } from '@/store/slices/uiSlice';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InterviewerAccessModal } from '@/components/InterviewerAccessModal';
import { Search, ArrowUpDown, Mail, Phone, Calendar, Trophy, Eye, Home, UserCircle } from 'lucide-react';
import { ChatMessage } from '@/components/ChatMessage';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function InterviewerPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const candidates = useAppSelector(state => state.candidates.candidates);
  const { searchQuery, sortBy, sortOrder, selectedCandidateId } = useAppSelector(state => state.ui);
  
  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);
  const [showInterviewerAccess, setShowInterviewerAccess] = useState(false);

  const handleAccessGranted = () => {
    setShowInterviewerAccess(false);
    navigate('/interviewee');
  };

  // Filter and sort candidates
  const filteredCandidates = candidates.filter(c => {
    if (c.status !== 'completed') return false;
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.phone.toLowerCase().includes(query)
    );
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'score') {
      comparison = b.finalScore - a.finalScore;
    } else if (sortBy === 'date') {
      comparison = (b.completedAt || 0) - (a.completedAt || 0);
    } else if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    }
    
    return sortOrder === 'asc' ? -comparison : comparison;
  });

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      dispatch(setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'));
    } else {
      dispatch(setSortBy(field));
      dispatch(setSortOrder('desc'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-6">
      <InterviewerAccessModal 
        open={showInterviewerAccess} 
        onOpenChange={setShowInterviewerAccess} 
        onAccessGranted={handleAccessGranted} 
      />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">Interviewer Dashboard</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                View and manage all candidate interviews
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => navigate('/')}>
                <Home className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Home
              </Button>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => setShowInterviewerAccess(true)}>
                <UserCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Interview
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs sm:text-sm">Total Candidates</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl">{candidates.length}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs sm:text-sm">Completed</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl">
                {candidates.filter(c => c.status === 'completed').length}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs sm:text-sm">Average Score</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl">
                {candidates.filter(c => c.status === 'completed').length > 0
                  ? Math.round(
                      candidates
                        .filter(c => c.status === 'completed')
                        .reduce((sum, c) => sum + c.finalScore, 0) /
                        candidates.filter(c => c.status === 'completed').length
                    )
                  : 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                  className="pl-10 text-sm sm:text-base"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort('score')}
                  className={cn("text-xs sm:text-sm", sortBy === 'score' && 'bg-primary text-primary-foreground')}
                >
                  Score
                  <ArrowUpDown className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort('date')}
                  className={cn("text-xs sm:text-sm", sortBy === 'date' && 'bg-primary text-primary-foreground')}
                >
                  Date
                  <ArrowUpDown className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort('name')}
                  className={cn("text-xs sm:text-sm", sortBy === 'name' && 'bg-primary text-primary-foreground')}
                >
                  Name
                  <ArrowUpDown className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidates Table */}
        <Card>
          <CardContent className="p-0">
            {sortedCandidates.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-muted-foreground">No completed interviews found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Name</TableHead>
                      <TableHead className="text-xs sm:text-sm">Email</TableHead>
                      <TableHead className="text-xs sm:text-sm">Phone</TableHead>
                      <TableHead className="text-xs sm:text-sm">Score</TableHead>
                      <TableHead className="text-xs sm:text-sm">Date</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCandidates.map((candidate) => (
                      <TableRow key={candidate.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium text-xs sm:text-sm">{candidate.name}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{candidate.email}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{candidate.phone}</TableCell>
                        <TableCell>
                          <Badge variant={getScoreBadgeVariant(candidate.finalScore)} className="text-xs">
                            {candidate.finalScore}/100
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {new Date(candidate.completedAt || 0).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs sm:text-sm"
                            onClick={() => dispatch(setSelectedCandidateId(candidate.id))}
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Candidate Detail Dialog */}
      <Dialog
        open={!!selectedCandidateId}
        onOpenChange={(open) => !open && dispatch(setSelectedCandidateId(null))}
      >
        <DialogContent className="max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedCandidate && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl md:text-2xl">{selectedCandidate.name}</DialogTitle>
              </DialogHeader>

              {/* Candidate Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <Card>
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Email</p>
                        <p className="font-medium text-sm sm:text-base">{selectedCandidate.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium text-sm sm:text-base">{selectedCandidate.phone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Final Score</p>
                        <p className="font-medium text-lg sm:text-xl md:text-2xl">{selectedCandidate.finalScore}/100</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary */}
              <Card className="mb-4 sm:mb-6">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">AI Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap text-sm sm:text-base">{selectedCandidate.summary}</p>
                </CardContent>
              </Card>

              {/* Questions & Answers */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Questions & Answers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  {selectedCandidate.questions.map((q, idx) => (
                    <div key={q.id} className="border-l-2 sm:border-l-4 border-primary pl-2 sm:pl-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-sm sm:text-base">Question {idx + 1}</h4>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Badge variant="outline" className="text-xs">{q.difficulty}</Badge>
                          <Badge variant={getScoreBadgeVariant(q.score * 10)} className="text-xs">
                            {q.score}/10
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-xs sm:text-sm mb-2 sm:mb-3">{q.question}</p>
                      
                      <div className="bg-muted rounded-lg p-2 sm:p-3 mb-2">
                        <p className="text-xs sm:text-sm font-medium mb-1">Answer:</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{q.userAnswer}</p>
                      </div>
                      
                      <div className="bg-gradient-card rounded-lg p-2 sm:p-3">
                        <p className="text-xs sm:text-sm font-medium mb-1">Feedback:</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{q.feedback}</p>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
                        Time: {q.timeTaken}s / {q.timeLimit}s
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Chat History */}
              <Card className="mt-4 sm:mt-6">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Chat History</CardTitle>
                </CardHeader>
                <CardContent className="max-h-64 sm:max-h-96 overflow-y-auto">
                  {selectedCandidate.messages.map((msg) => (
                    <ChatMessage key={msg.id} {...msg} />
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}