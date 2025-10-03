import { cn } from '@/lib/utils';
import { Bot, User, Shield } from 'lucide-react';
import { useEffect } from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === 'user';
  const isSystem = role === 'system';

  // Prevent text selection and copying for assistant messages (questions)
  const preventCopy = (e: React.MouseEvent) => {
    if (!isUser) { // For AI/system messages (questions)
      e.preventDefault();
      return false;
    }
  };

  const preventClipboard = (e: React.ClipboardEvent) => {
    if (!isUser) { // For AI/system messages (questions)
      e.preventDefault();
      return false;
    }
  };

  // Disable right-click context menu for assistant messages
  const disableContextMenu = (e: React.MouseEvent) => {
    if (!isUser) { // For AI/system messages (questions)
      e.preventDefault();
      return false;
    }
  };

  // Add watermark effect for assistant messages
  useEffect(() => {
    if (!isUser && !isSystem) {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent Ctrl+C, Ctrl+X, Ctrl+A, Ctrl+U
        if ((e.ctrlKey || e.metaKey) && 
            (e.key === 'c' || e.key === 'x' || e.key === 'a' || e.key === 'u')) {
          e.preventDefault();
          return false;
        }
        // Prevent Print Screen
        if (e.key === 'PrintScreen') {
          e.preventDefault();
          // Optionally show a message about screenshot restrictions
          return false;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isUser, isSystem]);

  if (isSystem) {
    return (
      <div className="flex justify-center my-3 sm:my-4">
        <div 
          className="bg-muted px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm text-muted-foreground select-none"
          onContextMenu={disableContextMenu}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2 sm:gap-3 mb-3 sm:mb-4', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isUser ? 'bg-primary' : 'bg-gradient-primary'
        )}
      >
        {isUser ? (
          <User className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
        ) : (
          <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        )}
      </div>

      <div
        className={cn(
          'max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm relative overflow-hidden',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-none'
            : 'bg-card border border-border rounded-tl-none question-watermark'
        )}
        onMouseDown={preventCopy}
        onContextMenu={disableContextMenu}
        onCopy={preventClipboard}
        onCut={preventClipboard}
      >
        {!isUser && (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(#00000010_1px,transparent_1px)] [background-size:12px_12px] sm:[background-size:16px_16px] opacity-20 pointer-events-none rounded-2xl"></div>
            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 text-muted-foreground/30">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </>
        )}
        <div 
          className={cn(
            "text-sm leading-relaxed whitespace-pre-wrap relative z-10",
            !isUser && "select-none"
          )}
        >
          {content}
        </div>
        <div
          className={cn(
            'text-xs mt-1.5 sm:mt-2 opacity-70 relative z-10',
            isUser ? 'text-primary-foreground' : 'text-muted-foreground'
          )}
        >
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}