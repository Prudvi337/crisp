import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Dynamically import pdf-parse and mammoth for ES modules
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let pdfParse: any;
let mammoth: any;

try {
  pdfParse = require('pdf-parse');
  console.log('PDF parsing available');
} catch (error) {
  console.warn('PDF parsing not available:', (error as Error).message);
  pdfParse = null;
}

try {
  mammoth = require('mammoth');
  console.log('DOCX parsing available');
} catch (error) {
  console.warn('DOCX parsing not available:', (error as Error).message);
  mammoth = null;
}

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// Use a working model name
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Utility function to extract text from PDF or DOCX
async function extractTextFromFile(buffer: Buffer, mimetype: string): Promise<string> {
  try {
    if (mimetype === 'application/pdf') {
      if (!pdfParse) {
        throw new Error('PDF parsing not available');
      }
      const data = await pdfParse(buffer);
      return data.text;
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      if (!mammoth) {
        throw new Error('DOCX parsing not available');
      }
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } else {
      throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error('Failed to extract text from file');
  }
}

// API Routes

// Parse resume endpoint
app.post('/api/parse-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const resumeText = await extractTextFromFile(req.file.buffer, req.file.mimetype);
    
    // Extract basic info using regex patterns
    const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = resumeText.match(/[\+]?[1-9]?[\d\s\-\(\)]{7,15}/);
    
    // Try to extract name from first line or using OpenAI
    const lines = resumeText.split('\n').map(line => line.trim()).filter(Boolean);
    let name = '';
    
    if (lines.length > 0) {
      const firstLine = lines[0];
      // Simple heuristic: if first line looks like a name
      if (firstLine.length < 50 && /^[A-Za-z\s]+$/.test(firstLine)) {
        name = firstLine;
      }
    }

    const extractedData = {
      text: resumeText,
      name: name || null,
      email: emailMatch ? emailMatch[0] : null,
      phone: phoneMatch ? phoneMatch[0] : null,
    };

    res.json(extractedData);
  } catch (error) {
    console.error('Error parsing resume:', error);
    res.status(500).json({ error: 'Failed to parse resume' });
  }
});

// Generate questions endpoint
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { difficulty, previousQuestions = [] } = req.body;

    // Define time limits for each difficulty level
    const timeLimits = {
      easy: 30,    // 30 seconds for basic questions
      medium: 90,  // 90 seconds for implementation questions
      hard: 180    // 180 seconds for complex design questions
    };

    const timeLimit = timeLimits[difficulty] || 60;

    const systemPrompt = `You are an expert Full Stack React/Node.js interviewer. Generate a single ${difficulty} technical interview question.

    Time Limit: ${timeLimit} seconds
    Question Complexity: ${difficulty} level
    
    Requirements:
    - Question should test practical Full Stack React/Node.js knowledge
    - Difficulty: ${difficulty} (easy=basic concepts, medium=practical implementation, hard=advanced/complex scenarios)
    - Avoid questions similar to: ${previousQuestions.join(', ')}
    - Return ONLY a valid JSON object with "question" field
    - Keep questions concise but comprehensive
    - IMPORTANT: Your entire response must be a valid JSON object like {"question": "your question here"}
    
    Examples:
    Easy: {"question": "Explain the difference between props and state in React"}
    Medium: {"question": "How would you implement user authentication in a React/Node.js app?"}
    Hard: {"question": "Design a real-time chat system using React and Node.js with proper error handling"}`;

    const prompt = `${systemPrompt}\n\nGenerate a ${difficulty} Full Stack React/Node question that can be answered within ${timeLimit} seconds. Respond ONLY with valid JSON.`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Extract JSON from response if it contains additional text
    let response;
    try {
      response = JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/\{[^}]+\}/);
      if (jsonMatch) {
        response = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback to creating a basic response
        response = { question: responseText.replace(/```json|```/g, '').trim() };
      }
    }
    
    res.json({
      question: response.question,
      difficulty,
      timeLimit
    });
  } catch (error) {
    console.error('Error generating question:', error);
    res.status(500).json({ error: 'Failed to generate question', details: (error as Error).message });
  }
});

// Score answer endpoint
app.post('/api/score-answer', async (req, res) => {
  try {
    const { question, answer, difficulty } = req.body;

    const systemPrompt = `You are an expert Full Stack React/Node.js interviewer evaluating candidate answers.

    Scoring Guidelines:
    - Score from 0-10 based on correctness, completeness, and understanding
    - ${difficulty} level expectations: ${
      difficulty === 'easy' ? 'Basic understanding and correct terminology' :
      difficulty === 'medium' ? 'Practical knowledge and implementation details' :
      'Advanced concepts, edge cases, and best practices'
    }
    - Provide constructive feedback (2-3 sentences)
    - Return ONLY a valid JSON object with "score" (number) and "feedback" (string) fields
    - IMPORTANT: Your entire response must be a valid JSON object like {"score": 8, "feedback": "Good answer with some minor issues."}

Example response:
{"score": 8, "feedback": "Good explanation of the concept. However, you missed mentioning the importance of error handling in production code."}`;

    const prompt = `${systemPrompt}

Question: ${question}

Answer: ${answer}

Evaluate this ${difficulty} level answer. Respond ONLY with valid JSON.`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Extract JSON from response if it contains additional text
    let response;
    try {
      response = JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/\{[^}]+\}/);
      if (jsonMatch) {
        response = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback to creating a basic response
        response = { 
          score: 5, 
          feedback: responseText.replace(/```json|```/g, '').trim() || 'No specific feedback provided.' 
        };
      }
    }
    
    res.json({
      score: response.score || 0,
      feedback: response.feedback || 'No feedback available'
    });
  } catch (error) {
    console.error('Error scoring answer:', error);
    res.status(500).json({ error: 'Failed to score answer', details: (error as Error).message });
  }
});

// Generate final summary endpoint
app.post('/api/final-summary', async (req, res) => {
  try {
    const { questions } = req.body;

    const systemPrompt = `You are an expert Full Stack React/Node.js interviewer providing final candidate evaluation.

    Based on the interview performance:
    - Calculate overall score (0-100) based on individual question scores
    - Provide comprehensive summary (3-4 sentences) covering:
      * Overall technical competency
      * Strengths and areas for improvement
      * Recommendation for hiring decision
    - Return ONLY a valid JSON object with "finalScore" (number) and "summary" (string) fields
    - IMPORTANT: Your entire response must be a valid JSON object like {"finalScore": 85, "summary": "Candidate performed well overall..."}

Example response:
{"finalScore": 85, "summary": "The candidate demonstrated strong knowledge of React and Node.js concepts. They excelled in explaining state management and RESTful API design. However, they struggled with advanced topics like real-time communication and error handling strategies. Recommended for further technical interviews."}`;

    const questionsText = questions.map((q: any, idx: number) => 
      `Q${idx + 1} (${q.difficulty}): ${q.question}\nAnswer: ${q.answer}\nScore: ${q.score}/10`
    ).join('\n\n');

    const prompt = `${systemPrompt}

Interview Results:

${questionsText}

Provide final evaluation. Respond ONLY with valid JSON.`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Extract JSON from response if it contains additional text
    let response;
    try {
      response = JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/\{[^}]+\}/);
      if (jsonMatch) {
        response = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback to creating a basic response
        response = { 
          finalScore: 50, 
          summary: responseText.replace(/```json|```/g, '').trim() || 'No summary available.' 
        };
      }
    }
    
    res.json({
      finalScore: response.finalScore || 0,
      summary: response.summary || 'No summary available'
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: 'Failed to generate summary', details: (error as Error).message });
  }
});

// Get all candidates
app.get('/api/candidates', async (req, res) => {
  try {
    const candidates = await prisma.candidate.findMany({
      include: {
        questions: true
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    });
    res.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// Get candidate by ID
app.get('/api/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        questions: true
      }
    });
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    res.json(candidate);
  } catch (error) {
    console.error('Error fetching candidate:', error);
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
});

// Create new candidate
app.post('/api/candidates', async (req, res) => {
  try {
    const candidateData = req.body;
    const candidate = await prisma.candidate.create({
      data: {
        ...candidateData,
        uploadedAt: new Date(),
        lastActiveAt: new Date()
      },
      include: {
        questions: true
      }
    });
    res.json(candidate);
  } catch (error) {
    console.error('Error creating candidate:', error);
    res.status(500).json({ error: 'Failed to create candidate' });
  }
});

// Update candidate
app.patch('/api/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const candidate = await prisma.candidate.update({
      where: { id },
      data: {
        ...updates,
        lastActiveAt: new Date()
      },
      include: {
        questions: true
      }
    });
    res.json(candidate);
  } catch (error) {
    console.error('Error updating candidate:', error);
    res.status(500).json({ error: 'Failed to update candidate' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
const server = app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 API documentation available at http://localhost:${port}/api`);
});

// Handle port in use error
server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${port} is already in use, trying ${Number(port) + 1}...`);
    setTimeout(() => {
      server.close();
      app.listen(Number(port) + 1, () => {
        console.log(`🚀 Server running on http://localhost:${Number(port) + 1}`);
        console.log(`📚 API documentation available at http://localhost:${Number(port) + 1}/api`);
      });
    }, 1000);
  } else {
    console.error(err);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});