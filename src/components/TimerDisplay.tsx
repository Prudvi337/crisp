import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  timeRemaining: number;
  totalTime: number;
  isRunning: boolean;
  onTimeUp?: () => void;
}

export function TimerDisplay({ timeRemaining, totalTime, isRunning, onTimeUp }: TimerDisplayProps) {
  const [displayTime, setDisplayTime] = useState(timeRemaining);

  useEffect(() => {
    setDisplayTime(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setDisplayTime((prev) => {
        if (prev <= 1) {
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onTimeUp]);

  const percentage = (displayTime / totalTime) * 100;
  const minutes = Math.floor(displayTime / 60);
  const seconds = displayTime % 60;

  const getColorClass = () => {
    if (percentage > 50) return 'text-success';
    if (percentage > 25) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - percentage / 100)}`}
            className={cn('transition-all duration-1000', getColorClass())}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Clock className="w-6 h-6 text-muted-foreground" />
        </div>
      </div>
      
      <div>
        <div className={cn('text-3xl font-bold tabular-nums', getColorClass())}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        <div className="text-sm text-muted-foreground">
          {isRunning ? 'Time Remaining' : 'Paused'}
        </div>
      </div>
    </div>
  );
}
