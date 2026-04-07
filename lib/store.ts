// ============================================================
// SMARTNOTE — Global State (Zustand)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIConfig, AIMode, ThemeMode, Project, KnowledgeTree, Quiz, Flashcard, QuizAttempt } from '@/lib/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface UploadedDoc {
  name: string;
  size: number;
  text: string;
  uploadedAt: string;
}

interface AppState {
  // Theme
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;

  // AI Config
  aiConfig: AIConfig;
  setAIConfig: (config: Partial<AIConfig>) => void;

  // Current project
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;

  // Processing state
  isProcessing: boolean;
  processingStatus: string;
  setProcessing: (isProcessing: boolean, status?: string) => void;

  // Extracted text (for current session) — combined from all docs
  extractedText: string;
  setExtractedText: (text: string) => void;

  // Multi-document uploads
  uploadedDocs: UploadedDoc[];
  addUploadedDoc: (doc: UploadedDoc) => void;
  removeUploadedDoc: (name: string) => void;
  clearUploadedDocs: () => void;

  // Knowledge tree
  knowledgeTree: KnowledgeTree | null;
  setKnowledgeTree: (tree: KnowledgeTree | null) => void;

  // Generated study document HTML
  studyDocument: string;
  setStudyDocument: (html: string) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;

  // Quizzes & Flashcards
  quizzes: Quiz[];
  setQuizzes: (quizzes: Quiz[]) => void;
  addQuiz: (quiz: Quiz) => void;
  flashcards: Flashcard[];
  setFlashcards: (flashcards: Flashcard[]) => void;
  updateFlashcard: (id: string, updates: Partial<Flashcard>) => void;

  // Quiz history
  quizAttempts: QuizAttempt[];
  addQuizAttempt: (attempt: QuizAttempt) => void;

  // Focus mode
  focusMode: boolean;
  setFocusMode: (on: boolean) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      // AI Config
      aiConfig: {
        mode: 'auto' as AIMode,
        geminiApiKey: '',
        ollamaBaseUrl: 'http://localhost:11434',
        ollamaModel: 'qwen3:4b',
        temperature: 0.7,
        maxTokens: 4096,
      },
      setAIConfig: (config) =>
        set((s) => ({ aiConfig: { ...s.aiConfig, ...config } })),

      // Current project
      currentProject: null,
      setCurrentProject: (project) => set({ currentProject: project }),

      // Processing
      isProcessing: false,
      processingStatus: '',
      setProcessing: (isProcessing, status = '') =>
        set({ isProcessing, processingStatus: status }),

      // Text
      extractedText: '',
      setExtractedText: (text) => set({ extractedText: text }),

      // Multi-document
      uploadedDocs: [],
      addUploadedDoc: (doc) =>
        set((s) => {
          const docs = [...s.uploadedDocs, doc];
          const combinedText = docs.map((d) => d.text).join('\n\n---\n\n');
          return { uploadedDocs: docs, extractedText: combinedText };
        }),
      removeUploadedDoc: (name) =>
        set((s) => {
          const docs = s.uploadedDocs.filter((d) => d.name !== name);
          const combinedText = docs.map((d) => d.text).join('\n\n---\n\n');
          return { uploadedDocs: docs, extractedText: combinedText };
        }),
      clearUploadedDocs: () => set({ uploadedDocs: [], extractedText: '' }),

      // Knowledge tree
      knowledgeTree: null,
      setKnowledgeTree: (tree) => set({ knowledgeTree: tree }),

      // Study document
      studyDocument: '',
      setStudyDocument: (html) => set({ studyDocument: html }),

      // Chat
      chatMessages: [],
      addChatMessage: (msg) =>
        set((s) => ({
          chatMessages: [
            ...s.chatMessages,
            {
              ...msg,
              id: Date.now().toString(36) + Math.random().toString(36).slice(2),
              timestamp: new Date().toISOString(),
            },
          ],
        })),
      clearChat: () => set({ chatMessages: [] }),

      // Quizzes & Flashcards
      quizzes: [],
      setQuizzes: (quizzes) => set({ quizzes }),
      addQuiz: (quiz) => set((s) => ({ quizzes: [...s.quizzes, quiz] })),
      flashcards: [],
      setFlashcards: (flashcards) => set({ flashcards }),
      updateFlashcard: (id, updates) =>
        set((s) => ({
          flashcards: s.flashcards.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        })),

      // Quiz history
      quizAttempts: [],
      addQuizAttempt: (attempt) =>
        set((s) => ({ quizAttempts: [...s.quizAttempts, attempt] })),

      // Focus
      focusMode: false,
      setFocusMode: (on) => set({ focusMode: on }),

      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      searchOpen: false,
      setSearchOpen: (open) => set({ searchOpen: open }),
    }),
    {
      name: 'smartnote-storage',
      partialize: (state) => ({
        theme: state.theme,
        aiConfig: state.aiConfig,
        uploadedDocs: state.uploadedDocs,
        extractedText: state.extractedText,
        knowledgeTree: state.knowledgeTree,
        studyDocument: state.studyDocument,
        quizzes: state.quizzes,
        flashcards: state.flashcards,
        quizAttempts: state.quizAttempts,
        chatMessages: state.chatMessages,
      }),
    }
  )
);
