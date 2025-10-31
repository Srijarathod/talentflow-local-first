import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatesApi } from '@/lib/api';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Mail, LayoutList, LayoutGrid } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import type { Candidate, CandidateStage } from '@/types';
import { toast } from '@/hooks/use-toast';
import { CandidateKanbanBoard } from '@/components/candidates/CandidateKanbanBoard';

const STAGES: { value: CandidateStage | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'applied', label: 'Applied' },
  { value: 'screen', label: 'Screening' },
  { value: 'tech', label: 'Technical' },
  { value: 'offer', label: 'Offer' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
];

export default function CandidatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStage, setActiveStage] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  const { data: candidatesData, isLoading } = useQuery({
    queryKey: ['candidates', 'all'],
    queryFn: () => candidatesApi.search({}),
  });

  const candidates = candidatesData?.data || [];

  const filteredCandidates = useMemo(() => {
    let filtered = candidates;

    if (activeStage !== 'all') {
      filtered = filtered.filter((c: Candidate) => c.stage === activeStage);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c: Candidate) =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [candidates, activeStage, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
        <p className="text-muted-foreground mt-1">
          Browse and manage {candidates.length.toLocaleString()} candidates in your pipeline
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'board' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('board')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeStage} onValueChange={setActiveStage}>
        <TabsList className="grid w-full grid-cols-7">
          {STAGES.map((stage) => (
            <TabsTrigger key={stage.value} value={stage.value}>
              {stage.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeStage} className="mt-6">
          {viewMode === 'board' ? (
            isLoading ? (
              <div>Loading...</div>
            ) : (
              <CandidateKanbanBoard candidates={filteredCandidates} />
            )
          ) : isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-muted" />
                      <div className="flex-1">
                        <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                        <div className="h-4 bg-muted rounded w-1/4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCandidates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery
                    ? 'No candidates found matching your search'
                    : `No candidates in ${activeStage === 'all' ? 'the pipeline' : `"${STAGES.find(s => s.value === activeStage)?.label}"`} yet`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <VirtualizedCandidateList candidates={filteredCandidates} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VirtualizedCandidateList({ candidates }: { candidates: Candidate[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: candidates.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 10,
  });

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-24rem)] overflow-auto space-y-3"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const candidate = candidates[virtualItem.index];
          return (
            <Link
              key={candidate.id}
              to={`/candidates/${candidate.id}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <Card className="hover:shadow-md transition-shadow mb-3">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={candidate.avatar} alt={candidate.name} />
                      <AvatarFallback>
                        {candidate.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{candidate.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{candidate.email}</span>
                      </div>
                    </div>
                    <Badge className={`status-${candidate.stage} shrink-0`}>
                      {candidate.stage}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
