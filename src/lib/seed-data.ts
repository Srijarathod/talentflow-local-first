import { faker } from '@faker-js/faker';
import { db } from './db';
import type {
  Job,
  Candidate,
  CandidateStage,
  Assessment,
  AssessmentSection,
  TimelineEvent,
} from '@/types';

const JOB_TITLES = [
  'Senior Frontend Engineer',
  'Backend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Product Designer',
  'UX Researcher',
  'Data Scientist',
  'Machine Learning Engineer',
  'Product Manager',
  'Engineering Manager',
  'QA Engineer',
  'Security Engineer',
  'Mobile Developer',
  'Technical Writer',
  'Solutions Architect',
  'Cloud Architect',
  'Data Engineer',
  'Site Reliability Engineer',
  'Platform Engineer',
  'Engineering Director',
  'Principal Engineer',
  'Staff Engineer',
  'Tech Lead',
  'Growth Engineer',
  'Infrastructure Engineer',
];

const TAGS = [
  'Remote',
  'Hybrid',
  'Onsite',
  'Senior',
  'Mid-Level',
  'Junior',
  'Full-Time',
  'Contract',
  'Urgent',
  'Flexible Hours',
];

const STAGES: CandidateStage[] = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];

export async function seedDatabase() {
  // Generate 25 jobs
  const jobs: Job[] = [];
  const now = new Date();
  
  for (let i = 0; i < 25; i++) {
    const title = JOB_TITLES[i] || faker.person.jobTitle();
    const slug = title.toLowerCase().replace(/\s+/g, '-') + '-' + faker.string.alphanumeric(6);
    const status = Math.random() > 0.3 ? 'active' : 'archived';
    const createdAt = faker.date.past({ years: 1 });
    
    jobs.push({
      id: faker.string.uuid(),
      title,
      slug,
      status,
      tags: faker.helpers.arrayElements(TAGS, { min: 2, max: 4 }),
      description: faker.lorem.paragraphs(2),
      order: i,
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    });
  }
  
  await db.jobs.bulkAdd(jobs);
  
  // Generate 1000 candidates
  const candidates: Candidate[] = [];
  const timelineEvents: TimelineEvent[] = [];
  const activeJobs = jobs.filter(j => j.status === 'active');
  
  for (let i = 0; i < 1000; i++) {
    const job = faker.helpers.arrayElement(activeJobs);
    const stage = faker.helpers.arrayElement(STAGES);
    const appliedAt = faker.date.past({ years: 0.5 });
    const candidateId = faker.string.uuid();
    
    candidates.push({
      id: candidateId,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      stage,
      jobId: job.id,
      appliedAt: appliedAt.toISOString(),
      updatedAt: appliedAt.toISOString(),
      avatar: faker.image.avatar(),
    });
    
    // Add initial timeline event
    timelineEvents.push({
      id: faker.string.uuid(),
      candidateId,
      type: 'stage_change',
      content: `Application submitted for ${job.title}`,
      toStage: 'applied',
      createdAt: appliedAt.toISOString(),
    });
    
    // Add random stage changes
    if (stage !== 'applied') {
      const stages = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];
      const currentIndex = stages.indexOf(stage);
      
      for (let j = 1; j <= currentIndex; j++) {
        const stageDate = new Date(appliedAt.getTime() + j * 3 * 24 * 60 * 60 * 1000);
        timelineEvents.push({
          id: faker.string.uuid(),
          candidateId,
          type: 'stage_change',
          content: `Moved to ${stages[j]}`,
          fromStage: stages[j - 1] as CandidateStage,
          toStage: stages[j] as CandidateStage,
          createdAt: stageDate.toISOString(),
        });
      }
    }
  }
  
  await db.candidates.bulkAdd(candidates);
  await db.timeline.bulkAdd(timelineEvents);
  
  // Generate 3 assessments with 10+ questions each
  const assessments: Assessment[] = [];
  
  for (let i = 0; i < 3; i++) {
    const job = faker.helpers.arrayElement(jobs);
    const sections: AssessmentSection[] = [];
    
    // Create 2-3 sections per assessment
    const sectionCount = faker.number.int({ min: 2, max: 3 });
    
    for (let j = 0; j < sectionCount; j++) {
      const questionCount = faker.number.int({ min: 4, max: 6 });
      const questions = [];
      
      for (let k = 0; k < questionCount; k++) {
        const questionTypes = ['single-choice', 'multi-choice', 'short-text', 'long-text', 'numeric'];
        const type = faker.helpers.arrayElement(questionTypes) as any;
        
        const question: any = {
          id: faker.string.uuid(),
          type,
          text: faker.lorem.sentence() + '?',
          required: Math.random() > 0.3,
        };
        
        if (type === 'single-choice' || type === 'multi-choice') {
          question.options = Array.from({ length: 4 }, () => faker.lorem.words(3));
        }
        
        if (type === 'numeric') {
          question.validation = {
            min: 0,
            max: 100,
          };
        }
        
        if (type === 'short-text') {
          question.validation = {
            maxLength: 200,
          };
        }
        
        questions.push(question);
      }
      
      sections.push({
        id: faker.string.uuid(),
        title: `Section ${j + 1}: ${faker.lorem.words(3)}`,
        description: faker.lorem.sentence(),
        questions,
        order: j,
      });
    }
    
    assessments.push({
      id: faker.string.uuid(),
      jobId: job.id,
      title: `${job.title} Assessment`,
      description: faker.lorem.paragraph(),
      sections,
      createdAt: faker.date.past({ years: 0.5 }).toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  await db.assessments.bulkAdd(assessments);
}
