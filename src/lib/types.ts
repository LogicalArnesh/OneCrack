export type ClassLevel = '10' | '11' | '12' | 'Dropper';
export type Subject = 'Biology' | 'Mathematics' | 'Both';
export type QuestionType = 'MCQ' | 'AssertionReason' | 'ImageMCQ' | 'ShortAnswer' | 'LongAnswer';

export interface User {
  id: string;
  name: string;
  uid: string;
  passcode: string;
  classLevel: ClassLevel;
  subjectPreference?: Subject;
  email?: string;
  isAdmin?: boolean;
}

export interface Question {
  id: string;
  questionText: string;
  questionType: QuestionType;
  options?: string[];
  correctAnswer?: string | string[];
  subject: string;
  classLevel: ClassLevel;
  imageIncluded?: boolean;
  explanation?: string;
  marksCorrect?: number;
  marksWrong?: number;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  subject: string;
  classLevel: ClassLevel;
  questions: Question[];
  totalTimeMinutes: number;
  createdAt: string;
  marksPerQuestion?: number;
  negativeMarks?: number;
  isReleased?: boolean;
}

export interface Attempt {
  questionId: string;
  selectedOption?: string;
  answerText?: string;
  isCorrect?: boolean;
  timeTakenSeconds: number;
  status: 'attempted' | 'visited' | 'marked-for-review' | 'not-visited';
}

export interface TestResult {
  id: string;
  testId: string;
  userId: string;
  submissionId: string;
  timestamp: string;
  attempts: Attempt[];
  totalScore: number;
  maxScore: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  timeTakenSeconds: number;
  subjectBreakdown: {
    subject: string;
    score: number;
    maxScore: number;
    timeTakenSeconds: number;
    avgTimePerQuestionSeconds: number;
  }[];
}
