import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Modal states
  isJobModalOpen: boolean;
  isAssessmentBuilderOpen: boolean;
  editingJobId: string | null;
  editingAssessmentId: string | null;
  
  // Filter states
  jobsFilter: {
    status: 'all' | 'active' | 'archived';
    search: string;
  };
  candidatesFilter: {
    stage: string;
    search: string;
  };
  
  // Actions
  openJobModal: (jobId?: string) => void;
  closeJobModal: () => void;
  openAssessmentBuilder: (assessmentId?: string) => void;
  closeAssessmentBuilder: () => void;
  setJobsFilter: (filter: Partial<UIState['jobsFilter']>) => void;
  setCandidatesFilter: (filter: Partial<UIState['candidatesFilter']>) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isJobModalOpen: false,
      isAssessmentBuilderOpen: false,
      editingJobId: null,
      editingAssessmentId: null,
      
      jobsFilter: {
        status: 'active',
        search: '',
      },
      
      candidatesFilter: {
        stage: 'all',
        search: '',
      },
      
      openJobModal: (jobId) => set({ isJobModalOpen: true, editingJobId: jobId || null }),
      closeJobModal: () => set({ isJobModalOpen: false, editingJobId: null }),
      
      openAssessmentBuilder: (assessmentId) => 
        set({ isAssessmentBuilderOpen: true, editingAssessmentId: assessmentId || null }),
      closeAssessmentBuilder: () => 
        set({ isAssessmentBuilderOpen: false, editingAssessmentId: null }),
      
      setJobsFilter: (filter) => 
        set((state) => ({ jobsFilter: { ...state.jobsFilter, ...filter } })),
      
      setCandidatesFilter: (filter) => 
        set((state) => ({ candidatesFilter: { ...state.candidatesFilter, ...filter } })),
    }),
    {
      name: 'talentflow-ui-state',
      partialize: (state) => ({
        jobsFilter: state.jobsFilter,
        candidatesFilter: state.candidatesFilter,
      }),
    }
  )
);
