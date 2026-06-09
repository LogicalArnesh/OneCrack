export type ClassLevel = '10' | '11' | '12' | 'Dropper';
export type Subject = 'Biology' | 'Mathematics' | 'Both' | 'Physics' | 'Chemistry' | 'General';
export type ExamStream = 'JEE' | 'NEET' | 'General';
export type QuestionType = 'MCQ' | 'AssertionReason' | 'ImageMCQ' | 'ShortAnswer' | 'LongAnswer';

export interface User {
  id: string;
  name: string;
  loginUid: string;
  classLevel: ClassLevel;
  subjectPreference?: Subject;
  examStream?: ExamStream;
  email?: string;
  registrationDate: string;
  isAdmin?: boolean;
}

export interface Question {
  id: string;
  questionText: string;
  questionType: QuestionType;
  options?: string[];
  optionCodes?: string[]; // Unique 4-digit numeric identifiers for each option (JEE-Adv Style)
  correctAnswer: string;
  subject: string;
  classLevel: ClassLevel;
  imageIncluded?: boolean;
  explanation?: string;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  subject: string;
  examStream: ExamStream;
  classLevel: ClassLevel;
  questions: Question[];
  totalTimeMinutes: number;
  createdAt: string;
  marksPerQuestion: number;
  negativeMarks: number;
  skippedMarks: number;
  isReleased: boolean;
  adminId: string;
  answerKeyUrl?: string; // Link to the official solution/answer key
}

export interface Attempt {
  questionId: string;
  selectedOption?: string;
  selectedOptionCode?: string; // The specific 4-digit code selected by the student
  isCorrect?: boolean;
  timeSpentSeconds: number;
  status: 'attempted' | 'visited' | 'marked-for-review' | 'not-visited';
}

export interface SubjectStats {
  subject: string;
  score: number;
  maxScore: number;
  timeTakenSeconds: number;
  avgTimePerQuestionSeconds: number;
}

export interface TestResult {
  id: string;
  testId: string;
  userId: string;
  submissionId: string; // Used as Response ID
  timestamp: string;
  attempts: Attempt[];
  totalScore: number;
  maxScore: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  timeTakenSeconds: number;
  subjectBreakdown: SubjectStats[];
}
