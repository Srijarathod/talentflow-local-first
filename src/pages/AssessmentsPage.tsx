import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { assessmentsApi, jobsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Clock, Eye, Edit } from 'lucide-react';
import { format } from 'date-fns';

export default function AssessmentsPage() {
  const navigate = useNavigate();
  const { data: jobsData } = useQuery({
    queryKey: ['jobs', 'active'],
    queryFn: () => jobsApi.getAll({ status: 'active' }),
  });

  const jobs = jobsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage job-specific assessments
          </p>
        </div>
        <Button 
          className="gap-2"
          onClick={() => navigate('/assessments/builder/new' + (jobs[0] ? `?jobId=${jobs[0].id}` : ''))}
        >
          <Plus className="h-4 w-4" />
          Create Assessment
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.slice(0, 6).map((job: any) => (
          <AssessmentCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

function AssessmentCard({ job }: { job: any }) {
  const navigate = useNavigate();
  const { data: assessmentsData } = useQuery({
    queryKey: ['assessments', job.id],
    queryFn: () => assessmentsApi.getByJobId(job.id),
  });

  const assessments = assessmentsData?.data || [];
  const hasAssessment = assessments.length > 0;
  const assessment = assessments[0];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{job.title}</CardTitle>
        <CardDescription>
          {hasAssessment ? `${assessment.sections.length} sections` : 'No assessment yet'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasAssessment ? (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>
                {assessment.sections.reduce((acc: number, s: any) => acc + s.questions.length, 0)} questions
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Updated {format(new Date(assessment.updatedAt), 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate(`/assessments/builder/${assessment.id}`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                className="flex-1"
                onClick={() => navigate(`/assessments/${assessment.id}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Take
              </Button>
            </div>
          </>
        ) : (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate(`/assessments/builder/new?jobId=${job.id}`)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Assessment
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
