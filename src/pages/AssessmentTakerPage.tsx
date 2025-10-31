import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { InteractiveAssessmentForm } from '@/components/assessments/InteractiveAssessmentForm';
import { Card, CardContent } from '@/components/ui/card';

export default function AssessmentTakerPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: assessmentData, isLoading } = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => assessmentsApi.getById(id!),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: async (answers: Record<string, any>) => {
      if (!assessmentData?.data?.jobId) {
        throw new Error('Job ID not found');
      }
      
      return assessmentsApi.submitResponse(assessmentData.data.jobId, {
        assessmentId: id,
        candidateId: 'candidate-' + Date.now(), // Simulated candidate ID
        answers,
        submittedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast({
        title: 'Success!',
        description: 'Your assessment has been submitted successfully.',
      });
      // Navigate to a success page or back
      navigate('/assessments');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit assessment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (answers: Record<string, any>) => {
    submitMutation.mutate(answers);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Loading assessment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assessmentData?.data) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Assessment not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const assessment = assessmentData.data;

  if (submitMutation.isSuccess) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-semibold">Assessment Submitted!</h2>
            <p className="text-muted-foreground">
              Thank you for completing the assessment. Your responses have been recorded.
            </p>
            <Button onClick={() => navigate('/assessments')}>
              Back to Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <InteractiveAssessmentForm
        title={assessment.title}
        description={assessment.description}
        sections={assessment.sections}
        onSubmit={handleSubmit}
      />

      {submitMutation.isPending && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <Card>
            <CardContent className="py-6 px-8">
              <p className="text-muted-foreground">Submitting your assessment...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
