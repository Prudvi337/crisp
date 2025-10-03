export interface ExtractedInfo {
  name?: string;
  email?: string;
  phone?: string;
}

export interface GeneratedQuestion {
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
}

export interface ScoredAnswer {
  score: number;
  feedback: string;
}

export interface FinalSummary {
  finalScore: number;
  summary: string;
}

const API_BASE = 'http://localhost:3001/api';

async function callAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(`${API_BASE}/${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'API request failed' }));
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

export async function parseResume(file: File): Promise<{ text: string; name?: string; email?: string; phone?: string }> {
  const formData = new FormData();
  formData.append('resume', file);

  const response = await fetch(`${API_BASE}/parse-resume`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Resume parsing failed' }));
    throw new Error(error.error || 'Resume parsing failed');
  }

  return response.json();
}

export async function extractResumeInfo(resumeText: string): Promise<ExtractedInfo> {
  // This function is kept for compatibility, but now we use parseResume for file processing
  // Extract basic info using regex patterns (fallback)
  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = resumeText.match(/[\+]?[1-9]?[\d\s\-\(\)]{7,15}/);
  
  const lines = resumeText.split('\n').map(line => line.trim()).filter(Boolean);
  let name = '';
  
  if (lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.length < 50 && /^[A-Za-z\s]+$/.test(firstLine)) {
      name = firstLine;
    }
  }

  return {
    name: name || undefined,
    email: emailMatch ? emailMatch[0] : undefined,
    phone: phoneMatch ? phoneMatch[0] : undefined,
  };
}

export async function generateQuestion(
  difficulty: 'easy' | 'medium' | 'hard',
  previousQuestions: string[]
): Promise<GeneratedQuestion> {
  const data = await callAPI('generate-questions', {
    method: 'POST',
    body: JSON.stringify({ difficulty, previousQuestions }),
  });
  return data;
}

export async function scoreAnswer(
  question: string,
  answer: string,
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<ScoredAnswer> {
  const data = await callAPI('score-answer', {
    method: 'POST',
    body: JSON.stringify({ question, answer, difficulty }),
  });
  return data;
}

export async function generateFinalSummary(
  questions: Array<{ question: string; answer: string; score: number; difficulty: string }>
): Promise<FinalSummary> {
  const data = await callAPI('final-summary', {
    method: 'POST',
    body: JSON.stringify({ questions }),
  });
  return data;
}

export async function getMissingFieldPrompt(missingFields: string[]): Promise<string> {
  const fieldNames = missingFields.map(field => {
    switch (field) {
      case 'name': return 'full name';
      case 'email': return 'email address';
      case 'phone': return 'phone number';
      default: return field;
    }
  });

  if (missingFields.length === 1) {
    return `I need your ${fieldNames[0]} to continue. Please provide it:`;
  } else if (missingFields.length === 2) {
    return `I need your ${fieldNames[0]} and ${fieldNames[1]} to continue. Let's start with your ${fieldNames[0]}:`;
  } else {
    return `I need a few more details: ${fieldNames.slice(0, -1).join(', ')}, and ${fieldNames[fieldNames.length - 1]}. Let's start with your ${fieldNames[0]}:`;
  }
}
