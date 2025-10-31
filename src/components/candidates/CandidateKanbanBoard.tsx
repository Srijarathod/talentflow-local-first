import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatesApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Candidate, CandidateStage } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

const STAGES: { value: CandidateStage; label: string; color: string }[] = [
  { value: 'applied', label: 'Applied', color: 'bg-blue-500/10 text-blue-500' },
  { value: 'screen', label: 'Screening', color: 'bg-purple-500/10 text-purple-500' },
  { value: 'tech', label: 'Technical', color: 'bg-amber-500/10 text-amber-500' },
  { value: 'offer', label: 'Offer', color: 'bg-green-500/10 text-green-500' },
  { value: 'hired', label: 'Hired', color: 'bg-emerald-500/10 text-emerald-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500/10 text-red-500' },
];

interface CandidateKanbanBoardProps {
  candidates: Candidate[];
}

export function CandidateKanbanBoard({ candidates }: CandidateKanbanBoardProps) {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const candidatesByStage = useMemo(() => {
    const grouped: Record<CandidateStage, Candidate[]> = {
      applied: [],
      screen: [],
      tech: [],
      offer: [],
      hired: [],
      rejected: [],
    };

    candidates.forEach(candidate => {
      grouped[candidate.stage].push(candidate);
    });

    return grouped;
  }, [candidates]);

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: CandidateStage }) =>
      candidatesApi.updateStage(id, stage),
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: ['candidates'] });
      
      const previousCandidates = queryClient.getQueryData(['candidates', 'all']);
      
      queryClient.setQueryData(['candidates', 'all'], (old: any) => ({
        ...old,
        data: old?.data?.map((c: Candidate) =>
          c.id === id ? { ...c, stage, updatedAt: new Date().toISOString() } : c
        ) || [],
      }));
      
      return { previousCandidates };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['candidates', 'all'], context?.previousCandidates);
      toast({
        title: 'Error',
        description: 'Failed to update candidate stage. Please try again.',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const candidateId = active.id as string;
    const newStage = over.id as CandidateStage;

    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate && candidate.stage !== newStage) {
      updateStageMutation.mutate({ id: candidateId, stage: newStage });
    }
  };

  const activeCandidate = activeId ? candidates.find(c => c.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setActiveId(active.id as string)}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-6 gap-4 h-[calc(100vh-16rem)] overflow-x-auto pb-4">
        {STAGES.map(stage => (
          <KanbanColumn
            key={stage.value}
            stage={stage}
            candidates={candidatesByStage[stage.value]}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCandidate && (
          <div className="opacity-80">
            <CandidateCardContent candidate={activeCandidate} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

interface KanbanColumnProps {
  stage: { value: CandidateStage; label: string; color: string };
  candidates: Candidate[];
}

function KanbanColumn({ stage, candidates }: KanbanColumnProps) {
  return (
    <Card className="flex flex-col min-w-[280px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>{stage.label}</span>
          <Badge variant="secondary" className={stage.color}>
            {candidates.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-2 p-3">
        <SortableContext
          items={[stage.value]}
          strategy={verticalListSortingStrategy}
          id={stage.value}
        >
          <div
            data-stage={stage.value}
            className="space-y-2 min-h-[200px] p-2 rounded-md border-2 border-dashed border-transparent hover:border-muted transition-colors"
          >
            {candidates.map(candidate => (
              <DraggableCandidate key={candidate.id} candidate={candidate} />
            ))}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  );
}

function DraggableCandidate({ candidate }: { candidate: Candidate }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link to={`/candidates/${candidate.id}`}>
        <CandidateCardContent candidate={candidate} />
      </Link>
    </div>
  );
}

function CandidateCardContent({ candidate }: { candidate: Candidate }) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-move">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={candidate.avatar} alt={candidate.name} />
            <AvatarFallback className="text-xs">
              {candidate.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{candidate.name}</h4>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{candidate.email}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
