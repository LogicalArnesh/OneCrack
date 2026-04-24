
export type ClassLevel = '10' | '11' | '12' | 'Dropper';
export type Subject = 'Biology' | 'Mathematics' | 'Both';
export type QuestionType = 'MCQ' | 'AssertionReason' | 'ImageMCQ' | 'ShortAnswer' | 'LongAnswer';

export interface User {
  id: string;
  name: string;
  loginUid: string;
  classLevel: ClassLevel;
  subjectPreference?: Subject;
  email?: string;
  registrationDate: string;
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
  marksPerQuestion: number;
  negativeMarks: number;
  skippedMarks: number;
  isReleased: boolean;
  adminId: string;
}

export interface Attempt {
  questionId: string;
  selectedOption?: string;
  answerText?: string;
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
  submissionId: string;
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

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'alert' | 'success';
  timestamp: string;
  senderId: string;
  targetClass?: ClassLevel;
}
