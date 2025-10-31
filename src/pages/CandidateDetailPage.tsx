import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatesApi, jobsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Mail, Calendar, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import type { CandidateStage } from '@/types';
import { toast } from '@/hooks/use-toast';
import { NotesSection } from '@/components/candidates/NotesSection';

const STAGES: CandidateStage[] = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: candidateData, isLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => candidatesApi.getById(id!),
    enabled: !!id,
  });

  const { data: timelineData } = useQuery({
    queryKey: ['candidate-timeline', id],
    queryFn: () => candidatesApi.getTimeline(id!),
    enabled: !!id,
  });

  const { data: jobData } = useQuery({
    queryKey: ['job', candidateData?.data?.jobId],
    queryFn: () => jobsApi.getById(candidateData.data.jobId),
    enabled: !!candidateData?.data?.jobId,
  });

  const stageMutation = useMutation({
    mutationFn: (stage: CandidateStage) => candidatesApi.updateStage(id!, stage),
    onMutate: async (newStage) => {
      await queryClient.cancelQueries({ queryKey: ['candidate', id] });
      const previousData = queryClient.getQueryData(['candidate', id]);
      
      queryClient.setQueryData(['candidate', id], (old: any) => ({
        ...old,
        data: { ...old?.data, stage: newStage },
      }));
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['candidate', id], context?.previousData);
      toast({
        title: 'Error',
        description: 'Failed to update candidate stage. Please try again.',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate', id] });
      queryClient.invalidateQueries({ queryKey: ['candidate-timeline', id] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast({
        title: 'Success',
        description: 'Candidate stage updated successfully',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  if (!candidateData?.data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Candidate not found</p>
        <Link to="/candidates">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Candidates
          </Button>
        </Link>
      </div>
    );
  }

  const candidate = candidateData.data;
  const timeline = timelineData?.data || [];
  const job = jobData?.data;

  return (
    <div className="space-y-6">
      <Link to="/candidates">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Candidates
        </Button>
      </Link>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={candidate.avatar} alt={candidate.name} />
                <AvatarFallback className="text-2xl">
                  {candidate.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-center mt-4">{candidate.name}</CardTitle>
            <CardDescription className="text-center flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              {candidate.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Current Stage</p>
              <Badge className={`status-${candidate.stage} w-full justify-center`}>
                {candidate.stage}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Applied</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(new Date(candidate.appliedAt), 'MMM dd, yyyy')}
              </div>
            </div>
            {job && (
              <div>
                <p className="text-sm font-medium mb-1">Position</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  {job.title}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stage Management */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stage Management</CardTitle>
              <CardDescription>Move candidate through the hiring pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {STAGES.map((stage) => (
                  <Button
                    key={stage}
                    variant={candidate.stage === stage ? 'default' : 'outline'}
                    onClick={() => stageMutation.mutate(stage)}
                    disabled={stageMutation.isPending}
                    className="w-full"
                  >
                    {stage}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>History of status changes</CardDescription>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No timeline events yet
                </p>
              ) : (
                <div className="space-y-4">
                  {timeline.map((event: any) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`h-3 w-3 rounded-full ${
                          event.toStage ? `bg-[hsl(var(--stage-${event.toStage}))]` : 'bg-muted'
                        }`} />
                        <div className="flex-1 w-px bg-border mt-2" />
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">{event.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(event.createdAt), 'MMM dd, yyyy · HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <NotesSection candidateId={candidate.id} />
        </div>
      </div>
    </div>
  );
}
