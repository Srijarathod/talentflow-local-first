import Dexie, { Table } from 'dexie';
import type {
  Job,
  Candidate,
  TimelineEvent,
  Assessment,
  AssessmentResponse,
  Note,
} from '@/types';

export class TalentFlowDB extends Dexie {
  jobs!: Table<Job, string>;
  candidates!: Table<Candidate, string>;
  timeline!: Table<TimelineEvent, string>;
  notes!: Table<Note, string>;
  assessments!: Table<Assessment, string>;
  assessmentResponses!: Table<AssessmentResponse, string>;

  constructor() {
    super('TalentFlowDB');
    
    this.version(1).stores({
      jobs: 'id, slug, status, order, createdAt',
      candidates: 'id, jobId, email, stage, appliedAt',
      timeline: 'id, candidateId, createdAt',
      notes: 'id, candidateId, createdAt',
      assessments: 'id, jobId, createdAt',
      assessmentResponses: 'id, assessmentId, candidateId, submittedAt',
    });
  }
}

// Singleton instance
export const db = new TalentFlowDB();

// Initialize database with seed data on first load
export async function initializeDatabase() {
  const jobCount = await db.jobs.count();
  
  if (jobCount === 0) {
    console.log('🌱 Seeding database with initial data...');
    const { seedDatabase } = await import('./seed-data');
    await seedDatabase();
    console.log('✅ Database seeded successfully');
  }
}
