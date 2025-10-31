// Core type definitions for TalentFlow

export type JobStatus = 'active' | 'archived';
export type CandidateStage = 'applied' | 'screen' | 'tech' | 'offer' | 'hired' | 'rejected';
export type QuestionType = 'single-choice' | 'multi-choice' | 'short-text' | 'long-text' | 'numeric' | 'file-upload';

export interface Job {
  id: string;
  title: string;
  slug: string;
  status: JobStatus;
  tags: string[];
  description?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  stage: CandidateStage;
  jobId: string;
  appliedAt: string;
  updatedAt: string;
  avatar?: string;
}

export interface TimelineEvent {
  id: string;
  candidateId: string;
  type: 'stage_change' | 'note' | 'assessment_completed';
  content: string;
  fromStage?: CandidateStage;
  toStage?: CandidateStage;
  createdAt: string;
  createdBy?: string;
}

export interface Note {
  id: string;
  candidateId: string;
  content: string;
  mentions: string[];
  createdAt: string;
  createdBy?: string;
}

export interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: string[]; // For choice questions
  validation?: {
    min?: number;
    max?: number;
    maxLength?: number;
  };
  conditionalLogic?: {
    showIf: {
      questionId: string;
      answer: string | string[];
    };
  };
}

export interface AssessmentSection {
  id: string;
  title: string;
  description?: string;
  questions: AssessmentQuestion[];
  order: number;
}

export interface Assessment {
  id: string;
  jobId: string;
  title: string;
  description?: string;
  sections: AssessmentSection[];
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentResponse {
  id: string;
  assessmentId: string;
  candidateId: string;
  answers: Record<string, any>;
  submittedAt: string;
  completedAt?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
