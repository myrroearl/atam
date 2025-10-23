export interface LearningResource {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'book' | 'article' | 'course' | 'document' | 'other';
  source: string;
  url: string;
  author?: string;
  topics: string[];
  tags: string[];
  likes: number;
  dislikes: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateLearningResourceRequest {
  title: string;
  description?: string;
  type: 'video' | 'book' | 'article' | 'course' | 'document' | 'other';
  source: string;
  url: string;
  author?: string;
  topics: string[];
  tags: string[];
}

export interface UpdateLearningResourceRequest extends Partial<CreateLearningResourceRequest> {
  is_active?: boolean;
}

export interface LearningResourceFilters {
  search?: string;
  type?: string;
  source?: string;
  is_active?: boolean;
}

export const LEARNING_RESOURCE_TYPES = [
  { value: 'video', label: 'Video' },
  { value: 'book', label: 'Book' },
  { value: 'article', label: 'Article' },
  { value: 'course', label: 'Course' },
  { value: 'document', label: 'Document' },
  { value: 'other', label: 'Other' }
] as const;

export const LEARNING_RESOURCE_SOURCES = [
  { value: 'YouTube', label: 'YouTube' },
  { value: 'Google Books', label: 'Google Books' },
  { value: 'Wikipedia', label: 'Wikipedia' },
  { value: 'Khan Academy', label: 'Khan Academy' },
  { value: 'Coursera', label: 'Coursera' },
  { value: 'edX', label: 'edX' },
  { value: 'Udemy', label: 'Udemy' },
  { value: 'TED', label: 'TED' },
  { value: 'Other', label: 'Other' }
] as const;
