# Crisp AI Interview Assistant

AI-powered technical interviews for companies. Run comprehensive Full Stack React/Node.js interviews with intelligent scoring and detailed feedback.

## Features

- **Interviewee Portal**: Upload resume and take AI-powered interviews
- **Interviewer Dashboard**: Review candidate interviews and manage hiring decisions
- **AI-Powered Questions**: Generate 6 role-specific questions (2 Easy, 2 Medium, 2 Hard)
- **Delayed Scoring**: AI evaluates answers but only shows scores at the end of the interview
- **Persistent Storage**: All data stored in SQLite database with Prisma ORM
- **Resume Parsing**: Extract information from PDF and DOCX files
- **Anti-Copy Protection**: Prevents copying of questions during the interview

## Tech Stack

### Frontend
- React + TypeScript
- Redux Toolkit for state management
- Redux Persist with IndexedDB/localForage for persistence
- Tailwind CSS + shadcn/ui components
- React Router for navigation

### Backend
- Node.js + Express
- SQLite database with Prisma ORM
- Google Gemini API for AI capabilities
- Multer for file uploads

## Security Features

### Anti-Copy Protection
The system implements multiple layers of protection to prevent candidates from copying questions and answers:

- **Text Selection Prevention**: Questions are marked as non-selectable
- **Clipboard Protection**: Copy/paste operations are blocked for questions
- **Right-click Context Menu**: Disabled on question elements
- **Keyboard Shortcuts**: Common copy shortcuts (Ctrl+C, Ctrl+X, Ctrl+A) are intercepted
- **Screenshot Prevention**: Print Screen key is disabled
- **Watermark Overlay**: Visual deterrent on question elements
- **Developer Tools**: F12 and other developer shortcuts are blocked

### Scoring Privacy
To maintain interview integrity:
- Scores and feedback are hidden during the interview process
- Only a generic "Answer recorded" message is shown after each response
- Detailed scoring and feedback are revealed only after the complete interview

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd chrono-interviewer-pro
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your Google Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Initialize the database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

   This will start both the frontend (port 5173) and backend (port 3001) servers.

## API Endpoints

### Resume Parsing
- `POST /api/parse-resume` - Extract text and fields from uploaded PDF/DOCX

### AI Operations
- `POST /api/generate-questions` - Generate 6 role-specific questions
- `POST /api/score-answer` - Evaluate candidate answer (score + feedback)
- `POST /api/final-summary` - Generate final score + summary

### Candidate Management
- `GET /api/candidates` - List all candidates
- `GET /api/candidates/:id` - Get candidate details
- `POST /api/candidates` - Create candidate entry
- `PATCH /api/candidates/:id` - Update candidate progress/status

## Project Structure

```
├── prisma/                 # Prisma schema and migrations
├── server/                 # Node.js + Express backend
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and services
│   ├── pages/              # Page components
│   ├── store/              # Redux store and slices
│   └── App.tsx             # Main application component
├── .env.example            # Environment variables template
├── package.json            # Project dependencies and scripts
└── README.md               # This file
```

## Development

### Available Scripts

- `npm run dev` - Start development servers for both frontend and backend
- `npm run dev:client` - Start only the frontend development server
- `npm run dev:server` - Start only the backend server
- `npm run build` - Build the frontend for production
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push Prisma schema to database
- `npm run db:studio` - Open Prisma Studio for database management

## License

This project is licensed under the MIT License.
