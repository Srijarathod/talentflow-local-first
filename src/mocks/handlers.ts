import { http, HttpResponse, delay } from 'msw';
import { db } from '@/lib/db';
import type { CandidateStage } from '@/types';

// Simulate realistic network latency
const simulateLatency = () => delay(Math.random() * (1200 - 200) + 200);

// Simulate 5-10% error rate on write operations
const shouldSimulateError = () => Math.random() < 0.075; // 7.5% error rate

export const handlers = [
  // Jobs endpoints
  http.get('/api/jobs', async ({ request }) => {
    await simulateLatency();
    
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const tags = url.searchParams.get('tags');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    
    let jobs = await db.jobs.orderBy('order').toArray();
    
    if (status) {
      jobs = jobs.filter(j => j.status === status);
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim().toLowerCase());
      jobs = jobs.filter(j => 
        j.tags.some(tag => tagArray.includes(tag.toLowerCase()))
      );
    }
    
    const start = (page - 1) * pageSize;
    const paginatedJobs = jobs.slice(start, start + pageSize);
    
    return HttpResponse.json({
      data: paginatedJobs,
      total: jobs.length,
      page,
      pageSize,
    });
  }),
  
  http.get('/api/jobs/:id', async ({ params }) => {
    await simulateLatency();
    const job = await db.jobs.get(params.id as string);
    
    if (!job) {
      return HttpResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    return HttpResponse.json({ data: job });
  }),
  
  http.post('/api/jobs', async ({ request }) => {
    await simulateLatency();
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Failed to create job. Please try again.' },
        { status: 500 }
      );
    }
    
    const body = await request.json() as any;
    const job = {
      ...body,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.jobs.add(job);
    return HttpResponse.json({ data: job });
  }),
  
  http.patch('/api/jobs/:id', async ({ params, request }) => {
    await simulateLatency();
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Failed to update job. Please try again.' },
        { status: 500 }
      );
    }
    
    const updates = await request.json() as any;
    const id = params.id as string;
    
    await db.jobs.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    
    const job = await db.jobs.get(id);
    return HttpResponse.json({ data: job });
  }),
  
  http.patch('/api/jobs/reorder', async ({ request }) => {
    await simulateLatency();
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Failed to reorder jobs. Please try again.' },
        { status: 500 }
      );
    }
    
    const { fromOrder, toOrder } = await request.json() as any;
    
    const jobs = await db.jobs.orderBy('order').toArray();
    const job = jobs.find(j => j.order === fromOrder);
    
    if (!job) {
      return HttpResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Reorder logic
    if (fromOrder < toOrder) {
      for (const j of jobs) {
        if (j.order > fromOrder && j.order <= toOrder) {
          await db.jobs.update(j.id, { order: j.order - 1 });
        }
      }
    } else {
      for (const j of jobs) {
        if (j.order >= toOrder && j.order < fromOrder) {
          await db.jobs.update(j.id, { order: j.order + 1 });
        }
      }
    }
    
    await db.jobs.update(job.id, { order: toOrder });
    
    return HttpResponse.json({ success: true });
  }),
  
  // Candidates endpoints
  http.get('/api/candidates/search', async ({ request }) => {
    await simulateLatency();
    
    const url = new URL(request.url);
    const stage = url.searchParams.get('stage');
    const page = parseInt(url.searchParams.get('page') || '1');
    
    let candidates = await db.candidates.toArray();
    
    if (stage) {
      candidates = candidates.filter(c => c.stage === stage);
    }
    
    // Sort by most recent first
    candidates.sort((a, b) => 
      new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    );
    
    return HttpResponse.json({
      data: candidates,
      total: candidates.length,
    });
  }),
  
  http.get('/api/candidates/:id', async ({ params }) => {
    await simulateLatency();
    const candidate = await db.candidates.get(params.id as string);
    
    if (!candidate) {
      return HttpResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }
    
    return HttpResponse.json({ data: candidate });
  }),
  
  http.get('/api/candidates/:id/timeline', async ({ params }) => {
    await simulateLatency();
    const events = await db.timeline
      .where('candidateId')
      .equals(params.id as string)
      .reverse()
      .sortBy('createdAt');
    
    return HttpResponse.json({ data: events });
  }),
  
  http.patch('/api/candidates/:id', async ({ params, request }) => {
    await simulateLatency();
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Failed to update candidate. Please try again.' },
        { status: 500 }
      );
    }
    
    const updates = await request.json() as any;
    const id = params.id as string;
    const candidate = await db.candidates.get(id);
    
    if (!candidate) {
      return HttpResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }
    
    // If stage changed, add timeline event
    if (updates.stage && updates.stage !== candidate.stage) {
      await db.timeline.add({
        id: crypto.randomUUID(),
        candidateId: id,
        type: 'stage_change',
        content: `Moved from ${candidate.stage} to ${updates.stage}`,
        fromStage: candidate.stage,
        toStage: updates.stage as CandidateStage,
        createdAt: new Date().toISOString(),
      });
    }
    
    await db.candidates.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    
    const updatedCandidate = await db.candidates.get(id);
    return HttpResponse.json({ data: updatedCandidate });
  }),
  
  http.post('/api/candidates', async ({ request }) => {
    await simulateLatency();
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Failed to create candidate. Please try again.' },
        { status: 500 }
      );
    }
    
    const body = await request.json() as any;
    const candidate = {
      ...body,
      id: crypto.randomUUID(),
      stage: 'applied' as CandidateStage,
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.candidates.add(candidate);
    
    // Add timeline event
    await db.timeline.add({
      id: crypto.randomUUID(),
      candidateId: candidate.id,
      type: 'stage_change',
      content: 'Application submitted',
      toStage: 'applied',
      createdAt: new Date().toISOString(),
    });
    
    return HttpResponse.json({ data: candidate });
  }),
  
  // Assessments endpoints
  http.get('/api/assessments/job/:jobId', async ({ params }) => {
    await simulateLatency();
    const assessments = await db.assessments
      .where('jobId')
      .equals(params.jobId as string)
      .toArray();
    
    return HttpResponse.json({ data: assessments });
  }),
  
  http.get('/api/assessments/:id', async ({ params }) => {
    await simulateLatency();
    const assessment = await db.assessments.get(params.id as string);
    
    if (!assessment) {
      return HttpResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }
    
    return HttpResponse.json({ data: assessment });
  }),
  
  http.post('/api/assessments', async ({ request }) => {
    await simulateLatency();
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Failed to create assessment. Please try again.' },
        { status: 500 }
      );
    }
    
    const body = await request.json() as any;
    const assessment = {
      ...body,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.assessments.add(assessment);
    return HttpResponse.json({ data: assessment });
  }),
  
  http.put('/api/assessments/:id', async ({ params, request }) => {
    await simulateLatency();
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Failed to update assessment. Please try again.' },
        { status: 500 }
      );
    }
    
    const updates = await request.json() as any;
    const id = params.id as string;
    
    await db.assessments.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    
    const assessment = await db.assessments.get(id);
    return HttpResponse.json({ data: assessment });
  }),
  
  http.post('/api/assessments/job/:jobId/submit', async ({ params, request }) => {
    await simulateLatency();
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Failed to submit assessment. Please try again.' },
        { status: 500 }
      );
    }
    
    const body = await request.json() as any;
    const response = {
      id: crypto.randomUUID(),
      assessmentId: body.assessmentId,
      candidateId: body.candidateId,
      answers: body.answers,
      submittedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    
    await db.assessmentResponses.add(response);
    return HttpResponse.json({ data: response });
  }),

  // Notes endpoints
  http.post('/api/notes', async ({ request }) => {
    await simulateLatency();
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Failed to create note. Please try again.' },
        { status: 500 }
      );
    }
    
    const body = await request.json() as any;
    const note = {
      ...body,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    
    await db.notes.add(note);
    
    // Add timeline event
    await db.timeline.add({
      id: crypto.randomUUID(),
      candidateId: body.candidateId,
      type: 'note',
      content: body.content.substring(0, 100) + (body.content.length > 100 ? '...' : ''),
      createdAt: new Date().toISOString(),
    });
    
    return HttpResponse.json({ data: note });
  }),

  http.get('/api/notes/:candidateId', async ({ params }) => {
    await simulateLatency();
    const notes = await db.notes
      .where('candidateId')
      .equals(params.candidateId as string)
      .reverse()
      .sortBy('createdAt');
    
    return HttpResponse.json({ data: notes });
  }),
];
