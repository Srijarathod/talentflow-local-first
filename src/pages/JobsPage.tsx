import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Archive, ArchiveRestore, Edit, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import type { Job } from '@/types';
import { JobFormDialog } from '@/components/jobs/JobFormDialog';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | undefined>();
  const queryClient = useQueryClient();

  const sensors = useSensors(useSensor(PointerSensor));

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['jobs', activeTab],
    queryFn: () => jobsApi.getAll({ status: activeTab }),
  });

  const createJobMutation = useMutation({
    mutationFn: (data: any) => jobsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: 'Success',
        description: 'Job created successfully',
      });
      setDialogOpen(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create job. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => jobsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: 'Success',
        description: 'Job updated successfully',
      });
      setDialogOpen(false);
      setEditingJob(undefined);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update job. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'archived' }) => {
      return jobsApi.update(id, { status });
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['jobs'] });
      
      const previousJobs = queryClient.getQueryData(['jobs', activeTab]);
      
      queryClient.setQueryData(['jobs', activeTab], (old: any) => ({
        ...old,
        data: old?.data?.filter((job: Job) => job.id !== id) || [],
      }));
      
      return { previousJobs };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['jobs', activeTab], context?.previousJobs);
      toast({
        title: 'Error',
        description: 'Failed to update job status. Please try again.',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: 'Success',
        description: `Job ${activeTab === 'active' ? 'archived' : 'restored'} successfully`,
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({ fromOrder, toOrder }: { fromOrder: number; toOrder: number }) =>
      jobsApi.reorder(fromOrder, toOrder),
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: 'Error',
        description: 'Failed to reorder jobs. Please try again.',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const jobs = jobsData?.data || [];
  const filteredJobs = jobs.filter((job: Job) =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const maxOrder = Math.max(...jobs.map((j: Job) => j.order), 0);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = filteredJobs.findIndex((j: Job) => j.id === active.id);
      const newIndex = filteredJobs.findIndex((j: Job) => j.id === over.id);
      
      const reordered = arrayMove(filteredJobs, oldIndex, newIndex);
      
      queryClient.setQueryData(['jobs', activeTab], (old: any) => ({
        ...old,
        data: reordered,
      }));

      const fromOrder = filteredJobs[oldIndex].order;
      const toOrder = filteredJobs[newIndex].order;
      reorderMutation.mutate({ fromOrder, toOrder });
    }
  };

  const handleCreateOrUpdate = (data: any) => {
    if (editingJob) {
      updateJobMutation.mutate({ id: editingJob.id, data });
    } else {
      createJobMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground mt-1">
            Manage your open positions and archived jobs
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditingJob(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Create Job
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search jobs by title or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="active">Active Jobs</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? 'No jobs found matching your search' : 'No jobs yet. Create your first job to get started!'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredJobs.map((j: Job) => j.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredJobs.map((job: Job) => (
                    <SortableJobCard
                      key={job.id}
                      job={job}
                      onArchive={() => archiveMutation.mutate({
                        id: job.id,
                        status: job.status === 'active' ? 'archived' : 'active'
                      })}
                      onEdit={() => {
                        setEditingJob(job);
                        setDialogOpen(true);
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </TabsContent>
      </Tabs>

      <JobFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingJob(undefined);
        }}
        onSubmit={handleCreateOrUpdate}
        job={editingJob}
        maxOrder={maxOrder}
      />
    </div>
  );
}

function SortableJobCard({
  job,
  onArchive,
  onEdit,
}: {
  job: Job;
  onArchive: () => void;
  onEdit: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="hover:shadow-md transition-shadow cursor-move">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <Link to={`/jobs/${job.id}`} className="flex-1 min-w-0">
              <CardTitle className="text-lg hover:text-primary transition-colors">
                {job.title}
              </CardTitle>
              <CardDescription className="mt-1">
                {job.slug}
              </CardDescription>
            </Link>
            <div className="flex gap-1 shrink-0">
              <Link to={`/jobs/${job.id}`}>
                <Button variant="ghost" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive();
                }}
              >
                {job.status === 'active' ? (
                  <Archive className="h-4 w-4" />
                ) : (
                  <ArchiveRestore className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {job.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {job.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
