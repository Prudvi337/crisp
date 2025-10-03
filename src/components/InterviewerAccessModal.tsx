import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface InterviewerAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccessGranted: () => void;
}

export function InterviewerAccessModal({ open, onOpenChange, onAccessGranted }: InterviewerAccessModalProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate a small delay for better UX
    setTimeout(() => {
      if (password === 'Interviewer77') {
        onAccessGranted();
        setPassword('');
        toast({
          title: 'Access granted',
          description: 'Welcome to the Interviewer Dashboard',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Access denied',
          description: 'Invalid entry key. Please try again.',
        });
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Interviewer Access</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Please enter the entry key to access the Interviewer Dashboard
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="entry-key" className="text-sm font-medium">
                Entry Key
              </label>
              <Input
                id="entry-key"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter entry key"
                disabled={isLoading}
                className="text-lg font-mono"
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Verifying...' : 'Access Dashboard'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}