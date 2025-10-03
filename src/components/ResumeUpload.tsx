import { useCallback, useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseResume } from '@/lib/aiService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ResumeUploadProps {
  onUpload: (resumeText: string, extractedData: { name?: string; email?: string; phone?: string }) => void;
}

export function ResumeUpload({ onUpload }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.match(/^application\/(pdf|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/)) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Please upload a PDF or DOCX file.',
        });
        return;
      }

      setIsProcessing(true);
      try {
        const result = await parseResume(file);
        onUpload(result.text, { name: result.name, email: result.email, phone: result.phone });
        toast({
          title: 'Resume uploaded successfully',
          description: 'Processing your information...',
        });
      } catch (error) {
        console.error('Error parsing resume:', error);
        toast({
          variant: 'destructive',
          title: 'Upload failed',
          description: error instanceof Error ? error.message : 'Failed to parse resume',
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [onUpload, toast]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div
        className={cn(
          'border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200',
          isDragging ? 'border-primary bg-primary/5 scale-105' : 'border-border',
          isProcessing && 'opacity-50 pointer-events-none'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <p className="text-lg font-medium">Processing your resume...</p>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-primary flex items-center justify-center">
              <FileText className="w-10 h-10 text-white" />
            </div>
            
            <h3 className="text-2xl font-bold mb-2">Upload Your Resume</h3>
            <p className="text-muted-foreground mb-6">
              Drop your resume here or click to browse
            </p>
            
            <div className="space-y-3">
              <label htmlFor="resume-upload">
                <Button asChild className="cursor-pointer">
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </span>
                </Button>
              </label>
              <input
                id="resume-upload"
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={onFileChange}
              />
              
              <p className="text-sm text-muted-foreground">
                Supports PDF and DOCX (Max 10MB)
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
