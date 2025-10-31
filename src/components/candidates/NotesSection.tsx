import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import type { Note } from '@/types';

const API_BASE = '/api';

interface NotesSectionProps {
  candidateId: string;
}

export function NotesSection({ candidateId }: NotesSectionProps) {
  const [noteContent, setNoteContent] = useState('');
  const queryClient = useQueryClient();

  const { data: notesData, isLoading } = useQuery({
    queryKey: ['notes', candidateId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/notes/${candidateId}`);
      return response.json();
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const mentions = extractMentions(content);
      const response = await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, content, mentions }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', candidateId] });
      queryClient.invalidateQueries({ queryKey: ['timeline', candidateId] });
      setNoteContent('');
      toast({
        title: 'Note added',
        description: 'Your note has been saved successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add note. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const highlightMentions = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="text-primary font-medium bg-primary/10 px-1 rounded">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const handleSubmit = () => {
    if (noteContent.trim()) {
      addNoteMutation.mutate(noteContent);
    }
  };

  const notes = notesData?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Add a note... Use @ to mention team members"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Tip: Use @username to mention team members
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!noteContent.trim() || addNoteMutation.isPending}
              size="sm"
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Add Note
            </Button>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          {isLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </>
          ) : notes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No notes yet. Add the first note to start tracking feedback.
            </p>
          ) : (
            notes.map((note: Note) => (
              <div key={note.id} className="flex gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {note.createdBy ? note.createdBy[0].toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">
                      {note.createdBy || 'Unknown User'}
                    </span>
                    <span className="text-muted-foreground">
                      {format(new Date(note.createdAt), 'PPp')}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {highlightMentions(note.content)}
                  </p>
                  {note.mentions.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {note.mentions.map((mention, i) => (
                        <span
                          key={i}
                          className="text-xs bg-muted px-2 py-1 rounded"
                        >
                          @{mention}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
