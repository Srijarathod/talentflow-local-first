import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { Job } from '@/types';

const jobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().optional(),
  tags: z.array(z.string()),
});

type JobFormValues = z.infer<typeof jobSchema>;

interface JobFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: JobFormValues & { slug: string; status: 'active'; order: number }) => void;
  job?: Job;
  maxOrder: number;
}

export function JobFormDialog({ open, onOpenChange, onSubmit, job, maxOrder }: JobFormDialogProps) {
  const [tagInput, setTagInput] = useState('');
  
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: job?.title || '',
      description: job?.description || '',
      tags: job?.tags || [],
    },
  });

  useEffect(() => {
    if (job) {
      form.reset({
        title: job.title,
        description: job.description || '',
        tags: job.tags,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        tags: [],
      });
    }
  }, [job, form]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = (data: JobFormValues) => {
    const slug = generateSlug(data.title);
    onSubmit({
      ...data,
      slug,
      status: 'active',
      order: job?.order ?? maxOrder + 1,
    });
    form.reset();
    setTagInput('');
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.getValues('tags').includes(tag)) {
      form.setValue('tags', [...form.getValues('tags'), tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue(
      'tags',
      form.getValues('tags').filter(tag => tag !== tagToRemove)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{job ? 'Edit Job' : 'Create New Job'}</DialogTitle>
          <DialogDescription>
            {job ? 'Update job details below' : 'Add a new job position to your hiring pipeline'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Senior Frontend Developer" {...field} />
                  </FormControl>
                  <FormDescription>
                    Slug: {generateSlug(field.value || '')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief job description..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={addTag}>
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {field.value.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  form.reset();
                  setTagInput('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {job ? 'Update Job' : 'Create Job'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
