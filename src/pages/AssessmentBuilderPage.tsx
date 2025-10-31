import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Save, Eye, Trash2, GripVertical, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Assessment, AssessmentSection, AssessmentQuestion, QuestionType } from '@/types';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { InteractiveAssessmentForm } from '@/components/assessments/InteractiveAssessmentForm';

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'single-choice', label: 'Single Choice' },
  { value: 'multi-choice', label: 'Multiple Choice' },
  { value: 'short-text', label: 'Short Text' },
  { value: 'long-text', label: 'Long Text' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'file-upload', label: 'File Upload' },
];

export default function AssessmentBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const jobId = searchParams.get('jobId');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<AssessmentSection[]>([]);

  const { data: assessmentData, isLoading } = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => assessmentsApi.getById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (assessmentData?.data) {
      const assessment = assessmentData.data;
      setTitle(assessment.title);
      setDescription(assessment.description || '');
      setSections(assessment.sections);
    }
  }, [assessmentData]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Assessment>) => {
      if (id) {
        return assessmentsApi.update(id, data);
      } else {
        return assessmentsApi.create({ ...data, jobId: jobId || '' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast({
        title: 'Success',
        description: `Assessment ${id ? 'updated' : 'created'} successfully`,
      });
      navigate('/assessments');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save assessment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an assessment title',
        variant: 'destructive',
      });
      return;
    }

    if (!jobId && !id) {
      toast({
        title: 'Error',
        description: 'No job ID specified',
        variant: 'destructive',
      });
      return;
    }

    saveMutation.mutate({ title, description, sections });
  };

  const addSection = () => {
    const newSection: AssessmentSection = {
      id: crypto.randomUUID(),
      title: `Section ${sections.length + 1}`,
      description: '',
      questions: [],
      order: sections.length,
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (sectionId: string, updates: Partial<AssessmentSection>) => {
    setSections(sections.map(s => s.id === sectionId ? { ...s, ...updates } : s));
  };

  const deleteSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
  };

  const addQuestion = (sectionId: string) => {
    const newQuestion: AssessmentQuestion = {
      id: crypto.randomUUID(),
      type: 'short-text',
      text: '',
      required: false,
    };

    setSections(sections.map(s =>
      s.id === sectionId
        ? { ...s, questions: [...s.questions, newQuestion] }
        : s
    ));
  };

  const updateQuestion = (sectionId: string, questionId: string, updates: Partial<AssessmentQuestion>) => {
    setSections(sections.map(s =>
      s.id === sectionId
        ? {
            ...s,
            questions: s.questions.map(q =>
              q.id === questionId ? { ...q, ...updates } : q
            ),
          }
        : s
    ));
  };

  const deleteQuestion = (sectionId: string, questionId: string) => {
    setSections(sections.map(s =>
      s.id === sectionId
        ? { ...s, questions: s.questions.filter(q => q.id !== questionId) }
        : s
    ));
  };

  const sensors = useSensors(useSensor(PointerSensor));

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          order: index,
        }));
      });
    }
  };

  if (isLoading) {
    return <div className="space-y-6">Loading...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleSave}>
            <Save className="h-4 w-4" />
            Save Draft
          </Button>
          <Button className="gap-2" onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4" />
            {id ? 'Update' : 'Create'} Assessment
          </Button>
        </div>
      </div>

      <Tabs defaultValue="builder" className="space-y-6">
        <TabsList>
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Frontend Developer Skills Assessment"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this assessment..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Sections</h2>
              <Button onClick={addSection} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Section
              </Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
              <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                {sections.map((section) => (
                  <SortableSection
                    key={section.id}
                    section={section}
                    onUpdate={(updates) => updateSection(section.id, updates)}
                    onDelete={() => deleteSection(section.id)}
                    onAddQuestion={() => addQuestion(section.id)}
                    onUpdateQuestion={(qId, updates) => updateQuestion(section.id, qId, updates)}
                    onDeleteQuestion={(qId) => deleteQuestion(section.id, qId)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <InteractiveAssessmentForm
            title={title}
            description={description}
            sections={sections}
            isPreview={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SortableSection({
  section,
  onUpdate,
  onDelete,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
}: {
  section: AssessmentSection;
  onUpdate: (updates: Partial<AssessmentSection>) => void;
  onDelete: () => void;
  onAddQuestion: () => void;
  onUpdateQuestion: (questionId: string, updates: Partial<AssessmentQuestion>) => void;
  onDeleteQuestion: (questionId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <button {...attributes} {...listeners} className="mt-1 cursor-move">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="flex-1 space-y-3">
              <Input
                value={section.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Section title"
                className="font-semibold"
              />
              <Textarea
                value={section.description}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Section description (optional)"
                rows={2}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {section.questions.map((question, idx) => (
            <QuestionEditor
              key={question.id}
              question={question}
              index={idx}
              sectionQuestions={section.questions}
              onUpdate={(updates) => onUpdateQuestion(question.id, updates)}
              onDelete={() => onDeleteQuestion(question.id)}
            />
          ))}
          <Button variant="outline" onClick={onAddQuestion} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Add Question
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function QuestionEditor({
  question,
  index,
  sectionQuestions,
  onUpdate,
  onDelete,
}: {
  question: AssessmentQuestion;
  index: number;
  sectionQuestions: AssessmentQuestion[];
  onUpdate: (updates: Partial<AssessmentQuestion>) => void;
  onDelete: () => void;
}) {
  const [optionInput, setOptionInput] = useState('');

  const addOption = () => {
    if (optionInput.trim()) {
      onUpdate({ options: [...(question.options || []), optionInput.trim()] });
      setOptionInput('');
    }
  };

  const removeOption = (index: number) => {
    onUpdate({ options: question.options?.filter((_, i) => i !== index) });
  };

  return (
    <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
      <div className="flex items-start gap-3">
        <span className="text-sm font-medium text-muted-foreground mt-2">
          Q{index + 1}
        </span>
        <div className="flex-1 space-y-3">
          <div className="flex gap-3">
            <Input
              value={question.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              placeholder="Question text"
              className="flex-1"
            />
            <Select
              value={question.type}
              onValueChange={(value) => onUpdate({ type: value as QuestionType })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(question.type === 'single-choice' || question.type === 'multi-choice') && (
            <div className="space-y-2">
              <Label className="text-xs">Options</Label>
              <div className="flex gap-2">
                <Input
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  placeholder="Add an option..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                />
                <Button type="button" size="sm" onClick={addOption}>
                  Add
                </Button>
              </div>
              <div className="space-y-1">
                {question.options?.map((option, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="flex-1 justify-between">
                      {option}
                      <button onClick={() => removeOption(i)} className="ml-2">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {question.type === 'numeric' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Min Value</Label>
                <Input
                  type="number"
                  value={question.validation?.min || ''}
                  onChange={(e) => onUpdate({
                    validation: { ...question.validation, min: parseInt(e.target.value) }
                  })}
                  placeholder="Min"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max Value</Label>
                <Input
                  type="number"
                  value={question.validation?.max || ''}
                  onChange={(e) => onUpdate({
                    validation: { ...question.validation, max: parseInt(e.target.value) }
                  })}
                  placeholder="Max"
                />
              </div>
            </div>
          )}

          {question.type === 'short-text' && (
            <div className="space-y-1">
              <Label className="text-xs">Max Length</Label>
              <Input
                type="number"
                value={question.validation?.maxLength || ''}
                onChange={(e) => onUpdate({
                  validation: { ...question.validation, maxLength: parseInt(e.target.value) }
                })}
                placeholder="Maximum characters"
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={question.required}
                onCheckedChange={(checked) => onUpdate({ required: checked as boolean })}
                id={`required-${question.id}`}
              />
              <Label htmlFor={`required-${question.id}`} className="text-xs cursor-pointer">
                Required
              </Label>
            </div>

            {index > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <Label>Show if:</Label>
                <Select
                  value={question.conditionalLogic?.showIf?.questionId || 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      onUpdate({ conditionalLogic: undefined });
                    } else {
                      onUpdate({
                        conditionalLogic: {
                          showIf: { questionId: value, answer: '' }
                        }
                      });
                    }
                  }}
                >
                  <SelectTrigger className="w-[150px] h-8">
                    <SelectValue placeholder="No condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No condition</SelectItem>
                    {sectionQuestions.slice(0, index).map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        Q{sectionQuestions.indexOf(q) + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
