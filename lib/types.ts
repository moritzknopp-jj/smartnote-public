// ============================================================
// SMARTNOTE — Core Type Definitions
// ============================================================

export type AIMode = 'cloud' | 'local' | 'auto';
export type ThemeMode = 'dark' | 'light';
export type ChartIntensity = 'off' | 'low' | 'medium' | 'high';
export type LearningMode = 'study' | 'quiz' | 'exam' | 'weakness' | 'spaced';

// ----- Project & Document -----
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  documents: DocumentMeta[];
  knowledgeTree?: KnowledgeTree;
  quizzes: Quiz[];
  flashcards: Flashcard[];
  studyStats: StudyStats;
}

export interface DocumentMeta {
  id: string;
  name: string;
  type: FileType;
  size: number;
  uploadedAt: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  error?: string;
  chunkCount?: number;
}

export type FileType = 'pdf' | 'txt' | 'zip' | 'image' | 'url' | 'video' | 'docx' | 'unknown';

// ----- Knowledge Tree -----
export interface KnowledgeTree {
  title: string;
  summary: string;
  topics: Topic[];
}

export interface Topic {
  id: string;
  name: string;
  summary?: string;
  content?: string;
  subtopics: Topic[];
  keyConcepts?: string[];
}

// ----- Mindmap -----
export interface MindmapNode {
  id: string;
  type: 'root' | 'topic' | 'subtopic' | 'concept';
  label: string;
  data?: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface MindmapEdge {
  id: string;
  source: string;
  target: string;
}

// ----- Quiz -----
export interface Quiz {
  id: string;
  title: string;
  createdAt: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'short-answer' | 'true-false';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topicId?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  answers: Record<string, string>;
  score: number;
  totalQuestions: number;
  completedAt: string;
  timeSpentSeconds: number;
}

// ----- Flashcard -----
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topicId?: string;
  nextReview?: string;
  interval: number; // days
  easeFactor: number;
  repetitions: number;
}

// ----- Study Stats -----
export interface StudyStats {
  totalStudyTimeMinutes: number;
  quizAttempts: QuizAttempt[];
  weakTopics: string[];
  strongTopics: string[];
  streakDays: number;
  lastStudiedAt?: string;
}

// ----- AI -----
export interface AIConfig {
  mode: AIMode;
  geminiApiKey?: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  temperature: number;
  maxTokens: number;
}

export interface AIResponse {
  text: string;
  model: string;
  tokensUsed?: number;
}

// ----- Ingestion -----
export interface IngestionResult {
  documentId: string;
  text: string;
  chunks: TextChunk[];
  metadata: Record<string, unknown>;
}

export interface TextChunk {
  id: string;
  text: string;
  index: number;
  metadata: {
    documentId: string;
    source: string;
    page?: number;
  };
}

// ----- Settings -----
export interface AppSettings {
  theme: ThemeMode;
  aiConfig: AIConfig;
  chartIntensity: ChartIntensity;
  focusMode: boolean;
}
