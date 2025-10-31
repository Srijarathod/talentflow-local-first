import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Upload } from 'lucide-react';
import type { AssessmentSection, AssessmentQuestion } from '@/types';

interface InteractiveAssessmentFormProps {
  title: string;
  description?: string;
  sections: AssessmentSection[];
  onSubmit?: (answers: Record<string, any>) => void;
  isPreview?: boolean;
}

export function InteractiveAssessmentForm({
  title,
  description,
  sections,
  onSubmit,
  isPreview = false,
}: InteractiveAssessmentFormProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [visibleQuestions, setVisibleQuestions] = useState<Set<string>>(new Set());

  // Initialize visible questions and compute conditional visibility
  useEffect(() => {
    const visible = new Set<string>();
    
    sections.forEach(section => {
      section.questions.forEach(question => {
        // Check if this question should be visible based on conditional logic
        if (!question.conditionalLogic) {
          visible.add(question.id);
        } else {
          const { questionId, answer } = question.conditionalLogic.showIf;
          const dependentAnswer = answers[questionId];
          
          // Show if the dependent question's answer matches
          if (Array.isArray(answer)) {
            // For multi-choice dependencies
            if (Array.isArray(dependentAnswer) && answer.some(a => dependentAnswer.includes(a))) {
              visible.add(question.id);
            }
          } else {
            // For single value dependencies
            if (dependentAnswer === answer) {
              visible.add(question.id);
            }
          }
        }
      });
    });
    
    setVisibleQuestions(visible);
  }, [sections, answers]);

  const updateAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    // Clear error for this question when user starts typing
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateQuestion = (question: AssessmentQuestion): string | null => {
    const answer = answers[question.id];
    
    // Check required
    if (question.required) {
      if (answer === undefined || answer === null || answer === '' || 
          (Array.isArray(answer) && answer.length === 0)) {
        return 'This field is required';
      }
    }

    // Type-specific validation
    if (question.type === 'numeric' && answer !== undefined && answer !== '') {
      const numValue = Number(answer);
      if (isNaN(numValue)) {
        return 'Must be a valid number';
      }
      if (question.validation?.min !== undefined && numValue < question.validation.min) {
        return `Must be at least ${question.validation.min}`;
      }
      if (question.validation?.max !== undefined && numValue > question.validation.max) {
        return `Must be at most ${question.validation.max}`;
      }
    }

    if (question.type === 'short-text' && answer && question.validation?.maxLength) {
      if (answer.length > question.validation.maxLength) {
        return `Must be at most ${question.validation.maxLength} characters`;
      }
    }

    return null;
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate all visible questions
    sections.forEach(section => {
      section.questions.forEach(question => {
        if (visibleQuestions.has(question.id)) {
          const error = validateQuestion(question);
          if (error) {
            newErrors[question.id] = error;
          }
        }
      });
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit?.(answers);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{title || 'Untitled Assessment'}</CardTitle>
        {description && <p className="text-muted-foreground">{description}</p>}
        {isPreview && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This is a live preview. Fill out the form to test validation and conditional logic.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent className="space-y-8">
        {sections.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No sections added yet. Switch to Builder tab to start creating your assessment.
          </p>
        ) : (
          <>
            {sections.map((section) => (
              <div key={section.id} className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                  {section.description && (
                    <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                  )}
                </div>
                <Separator />
                <div className="space-y-6">
                  {section.questions.map((question, qIdx) => {
                    if (!visibleQuestions.has(question.id)) return null;
                    
                    return (
                      <div key={question.id} className="space-y-2">
                        <Label className="text-base">
                          {qIdx + 1}. {question.text || 'Untitled Question'}
                          {question.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <QuestionInput
                          question={question}
                          value={answers[question.id]}
                          onChange={(value) => updateAnswer(question.id, value)}
                          error={errors[question.id]}
                        />
                        {errors[question.id] && (
                          <p className="text-sm text-destructive">{errors[question.id]}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {onSubmit && (
              <div className="flex justify-end pt-4">
                <Button onClick={handleSubmit} size="lg">
                  Submit Assessment
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
  error,
}: {
  question: AssessmentQuestion;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}) {
  switch (question.type) {
    case 'single-choice':
      return (
        <RadioGroup value={value || ''} onValueChange={onChange}>
          <div className="space-y-2">
            {question.options?.map((option, i) => (
              <div key={i} className="flex items-center gap-2">
                <RadioGroupItem value={option} id={`${question.id}-${i}`} />
                <Label htmlFor={`${question.id}-${i}`} className="font-normal cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      );

    case 'multi-choice':
      return (
        <div className="space-y-2">
          {question.options?.map((option, i) => (
            <div key={i} className="flex items-center gap-2">
              <Checkbox
                checked={Array.isArray(value) && value.includes(option)}
                onCheckedChange={(checked) => {
                  const current = Array.isArray(value) ? value : [];
                  if (checked) {
                    onChange([...current, option]);
                  } else {
                    onChange(current.filter((v: string) => v !== option));
                  }
                }}
                id={`${question.id}-${i}`}
              />
              <Label htmlFor={`${question.id}-${i}`} className="font-normal cursor-pointer">
                {option}
              </Label>
            </div>
          ))}
        </div>
      );

    case 'short-text':
      return (
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer"
          maxLength={question.validation?.maxLength}
          className={error ? 'border-destructive' : ''}
        />
      );

    case 'long-text':
      return (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer"
          rows={4}
          className={error ? 'border-destructive' : ''}
        />
      );

    case 'numeric':
      return (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Numeric answer"
          min={question.validation?.min}
          max={question.validation?.max}
          className={error ? 'border-destructive' : ''}
        />
      );

    case 'file-upload':
      return (
        <div className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors ${error ? 'border-destructive' : ''}`}>
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {value ? `File selected: ${value}` : 'Click to upload or drag and drop'}
          </p>
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onChange(file.name);
            }}
          />
        </div>
      );

    default:
      return null;
  }
}
