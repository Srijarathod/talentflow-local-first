// API client for TalentFlow
// This module provides the interface for all data operations
// All requests go through MSW handlers which simulate network latency and errors

const API_BASE = '/api';

interface FetchOptions extends RequestInit {
  params?: Record<string, any>;
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;
  
  let url = `${API_BASE}${endpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// Jobs API
export const jobsApi = {
  getAll: (params?: { status?: string; page?: number; pageSize?: number }) =>
    fetchApi<any>('/jobs', { params }),
  
  getById: (id: string) =>
    fetchApi<any>(`/jobs/${id}`),
  
  create: (data: any) =>
    fetchApi<any>('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: any) =>
    fetchApi<any>(`/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  reorder: (fromOrder: number, toOrder: number) =>
    fetchApi<any>('/jobs/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ fromOrder, toOrder }),
    }),
};

// Candidates API
export const candidatesApi = {
  search: (params: { stage?: string; page?: number }) =>
    fetchApi<any>('/candidates/search', { params }),
  
  getById: (id: string) =>
    fetchApi<any>(`/candidates/${id}`),
  
  getTimeline: (id: string) =>
    fetchApi<any>(`/candidates/${id}/timeline`),
  
  updateStage: (id: string, stage: string) =>
    fetchApi<any>(`/candidates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    }),
  
  create: (data: any) =>
    fetchApi<any>('/candidates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Assessments API
export const assessmentsApi = {
  getByJobId: (jobId: string) =>
    fetchApi<any>(`/assessments/job/${jobId}`),
  
  getById: (id: string) =>
    fetchApi<any>(`/assessments/${id}`),
  
  create: (data: any) =>
    fetchApi<any>('/assessments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: any) =>
    fetchApi<any>(`/assessments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  submitResponse: (jobId: string, data: any) =>
    fetchApi<any>(`/assessments/job/${jobId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
