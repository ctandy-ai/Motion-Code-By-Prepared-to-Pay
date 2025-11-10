import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Upload } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PhaseTimeline } from "@/components/phase-timeline";
import { WeeklyPlanner } from "@/components/weekly-planner";
import { BlockComposer } from "@/components/block-composer";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";
import type { Program, ProgramPhase, ProgramWeek, TrainingBlock, BlockExercise } from "@shared/schema";

export default function PlannerPage() {
  const { programId } = useParams();
  const [currentWeek, setCurrentWeek] = useState(1);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [editingBlock, setEditingBlock] = useState<TrainingBlock | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: program } = useQuery<Program>({
    queryKey: ["/api/programs", programId],
    enabled: !!programId,
  });

  const { data: structure } = useQuery<{
    phases: ProgramPhase[];
    weeks: ProgramWeek[];
    blocks: (TrainingBlock & { exercises: BlockExercise[] })[];
  }>({
    queryKey: ["/api/programs", programId, "structure"],
    enabled: !!programId,
    queryFn: async () => {
      const res = await apiRequest("POST", `/api/programs/${programId}/structure`, undefined);
      return await res.json();
    },
  });

  const { data: weekData } = useQuery<{
    week: ProgramWeek | undefined;
    blocks: (TrainingBlock & { exercises: BlockExercise[] })[];
  }>({
    queryKey: ["/api/programs", programId, "weeks", currentWeek],
    enabled: !!programId && !!currentWeek,
  });

  const createBlockMutation = useMutation({
    mutationFn: async (blockData: {
      title: string;
      belt: string;
      focus: string[];
      scheme?: string;
      notes?: string;
      weekNumber: number;
      dayNumber: number;
      orderIndex: number;
      exercises: Array<{ id: string; scheme?: string; notes?: string; orderIndex: number }>;
    }) => {
      const { exercises, ...blockFields } = blockData;
      
      const blockRes = await apiRequest("POST", `/api/programs/${programId}/blocks`, blockFields);
      const block = await blockRes.json();

      if (exercises.length > 0) {
        const exercisePromises = exercises.map((ex) =>
          apiRequest("POST", `/api/blocks/${block.id}/exercises`, {
            exerciseId: ex.id,
            scheme: ex.scheme,
            notes: ex.notes,
            orderIndex: ex.orderIndex,
          })
        );
        await Promise.all(exercisePromises);
      }

      return block;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs", programId, "structure"] });
      queryClient.invalidateQueries({ queryKey: ["/api/programs", programId, "weeks", currentWeek] });
      toast({
        title: "Success",
        description: "Training block created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create training block",
        variant: "destructive",
      });
    },
  });

  const updateBlockMutation = useMutation({
    mutationFn: async (blockData: {
      blockId: string;
      title: string;
      belt: string;
      focus: string[];
      scheme?: string;
      notes?: string;
    }) => {
      const { blockId, ...updateFields } = blockData;
      const res = await apiRequest("PATCH", `/api/blocks/${blockId}`, updateFields);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs", programId, "structure"] });
      queryClient.invalidateQueries({ queryKey: ["/api/programs", programId, "weeks", currentWeek] });
      toast({
        title: "Success",
        description: "Training block updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update training block",
        variant: "destructive",
      });
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      await apiRequest("DELETE", `/api/blocks/${blockId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs", programId, "structure"] });
      queryClient.invalidateQueries({ queryKey: ["/api/programs", programId, "weeks", currentWeek] });
      toast({
        title: "Success",
        description: "Training block deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete training block",
        variant: "destructive",
      });
    },
  });

  const handleCreateBlock = (dayNumber: number) => {
    setSelectedDay(dayNumber);
    setEditingBlock(null);
    setIsComposerOpen(true);
  };

  const handleEditBlock = (block: TrainingBlock) => {
    setEditingBlock(block);
    setIsComposerOpen(true);
  };

  const handleSaveBlock = (blockData: {
    title: string;
    belt: string;
    focus: string[];
    scheme?: string;
    notes?: string;
    exercises: Array<{ id: string; name: string; scheme?: string; notes?: string; orderIndex: number }>;
  }) => {
    if (editingBlock) {
      // Update existing block
      updateBlockMutation.mutate({
        blockId: editingBlock.id,
        title: blockData.title,
        belt: blockData.belt,
        focus: blockData.focus,
        scheme: blockData.scheme,
        notes: blockData.notes,
      });
    } else {
      // Create new block
      if (!selectedDay) return;

      const blocksInDay = weekData?.blocks.filter((b) => b.dayNumber === selectedDay) || [];
      const orderIndex = blocksInDay.length;

      createBlockMutation.mutate({
        ...blockData,
        weekNumber: currentWeek,
        dayNumber: selectedDay,
        orderIndex,
      });
    }
  };

  const handleDeleteBlock = (blockId: string) => {
    if (confirm("Are you sure you want to delete this block?")) {
      deleteBlockMutation.mutate(blockId);
    }
  };

  if (!programId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400">No program selected</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="planner-page">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-ink-3">
        <div className="flex items-center gap-4">
          <Link href="/programs" data-testid="link-back-programs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-100" data-testid="text-program-name">
              {program?.name || "Program Planner"}
            </h1>
            <p className="text-sm text-slate-400 mt-1" data-testid="text-week-indicator">
              Week {currentWeek} of 52
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" data-testid="button-export-program">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" data-testid="button-import-program">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Phase Timeline */}
        <PhaseTimeline
          phases={structure?.phases || []}
          weeks={structure?.weeks || []}
          currentWeek={currentWeek}
          onWeekSelect={setCurrentWeek}
        />

        {/* Weekly Planner */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-100" data-testid="text-weekly-planner-title">
              Week {currentWeek} Training Plan
            </h2>
            {weekData?.week && (
              <div className="flex items-center gap-2">
                {weekData.week.beltTarget && (
                  <span className="text-sm text-slate-400" data-testid="text-week-belt-target">
                    Target: <span className="text-slate-200">{weekData.week.beltTarget}</span>
                  </span>
                )}
                {weekData.week.intensityZone && (
                  <span className="text-sm text-slate-400" data-testid="text-week-intensity">
                    Intensity: <span className="text-slate-200">{weekData.week.intensityZone}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          <WeeklyPlanner
            programId={programId}
            weekNumber={currentWeek}
            blocks={weekData?.blocks || []}
            onCreateBlock={handleCreateBlock}
            onEditBlock={handleEditBlock}
            onDeleteBlock={handleDeleteBlock}
          />
        </Card>
      </div>

      {/* Block Composer Modal */}
      <BlockComposer
        open={isComposerOpen}
        onOpenChange={setIsComposerOpen}
        onSave={handleSaveBlock}
        initialData={editingBlock || undefined}
      />
    </div>
  );
}
