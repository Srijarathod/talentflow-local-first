import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { jobsApi, assessmentsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: jobData, isLoading: isLoadingJob } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.getById(id!),
    enabled: !!id,
  });

  const { data: assessmentsData, isLoading: isLoadingAssessments } = useQuery({
    queryKey: ['assessments', id],
    queryFn: () => assessmentsApi.getByJobId(id!),
    enabled: !!id,
  });

  if (isLoadingJob) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!jobData?.data) {
    return (
      <div className="space-y-6">
        <Link to="/jobs">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Job not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const job = jobData.data;
  const assessments = assessmentsData?.data || [];

  return (
    <div className="space-y-6">
      <Link to="/jobs">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl">{job.title}</CardTitle>
              <CardDescription className="text-base">
                {job.slug}
              </CardDescription>
            </div>
            <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
              {job.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {job.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {job.description}
              </p>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {job.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created {format(new Date(job.createdAt), 'PPP')}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assessments</CardTitle>
              <CardDescription>
                Evaluation forms for this position
              </CardDescription>
            </div>
            <Link to={`/assessments/builder/new?jobId=${job.id}`}>
              <Button className="gap-2">
                <FileText className="h-4 w-4" />
                Create Assessment
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingAssessments ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : assessments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No assessments created yet
            </div>
          ) : (
            <div className="space-y-3">
              {assessments.map((assessment) => (
                <Link key={assessment.id} to={`/assessments/${assessment.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{assessment.title}</CardTitle>
                          {assessment.description && (
                            <CardDescription className="mt-1">
                              {assessment.description}
                            </CardDescription>
                          )}
                        </div>
                        <Badge variant="outline">
                          {assessment.sections.reduce((acc, s) => acc + s.questions.length, 0)} questions
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
