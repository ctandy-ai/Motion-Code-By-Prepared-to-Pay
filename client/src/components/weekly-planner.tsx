import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, GripVertical, Edit, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import type { TrainingBlock } from "@shared/schema";

interface WeeklyPlannerProps {
  programId: string;
  weekNumber: number;
  blocks: (TrainingBlock & { exercises?: any[] })[];
  onCreateBlock: (dayNumber: number) => void;
  onEditBlock: (block: TrainingBlock) => void;
  onDeleteBlock: (blockId: string) => void;
}

const DAYS = [
  { number: 1, name: "Monday" },
  { number: 2, name: "Tuesday" },
  { number: 3, name: "Wednesday" },
  { number: 4, name: "Thursday" },
  { number: 5, name: "Friday" },
  { number: 6, name: "Saturday" },
  { number: 7, name: "Sunday" },
];

interface DroppableDayProps {
  dayNumber: number;
  dayName: string;
  blocks: (TrainingBlock & { exercises?: any[] })[];
  onCreateBlock: () => void;
  onEditBlock: (block: TrainingBlock) => void;
  onDeleteBlock: (blockId: string) => void;
}

function DroppableDay({
  dayNumber,
  dayName,
  blocks,
  onCreateBlock,
  onEditBlock,
  onDeleteBlock,
}: DroppableDayProps) {
  const dayId = `day-${dayNumber}`;
  const { setNodeRef } = useDroppable({ id: dayId });

  return (
    <div
      key={dayNumber}
      data-testid={`day-column-${dayNumber}`}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200" data-testid={`text-day-${dayNumber}`}>
          {dayName}
        </h3>
        <Button
          size="icon"
          variant="ghost"
          data-testid={`button-add-block-day-${dayNumber}`}
          onClick={onCreateBlock}
          className="h-6 w-6"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <SortableContext
        id={dayId}
        items={blocks.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          data-testid={`droppable-day-${dayNumber}`}
          className="min-h-[200px] space-y-2 p-2 rounded-lg border border-dashed border-ink-3 bg-ink-1/20"
        >
          {blocks.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-xs text-slate-500">
              No blocks
            </div>
          ) : (
            blocks.map((block) => (
              <SortableBlock
                key={block.id}
                block={block}
                onEdit={() => onEditBlock(block)}
                onDelete={() => onDeleteBlock(block.id)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

interface SortableBlockProps {
  block: TrainingBlock & { exercises?: any[] };
  onEdit: () => void;
  onDelete: () => void;
}

function SortableBlock({ block, onEdit, onDelete }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      data-testid={`block-card-${block.id}`}
      className="p-3 space-y-2 hover-elevate"
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          data-testid={`drag-handle-${block.id}`}
          className="mt-1 cursor-grab active:cursor-grabbing hover-elevate active-elevate-2 p-1 rounded"
        >
          <GripVertical className="h-4 w-4 text-slate-400" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h4 className="text-sm font-semibold text-slate-100 truncate">{block.title}</h4>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                data-testid={`button-edit-block-${block.id}`}
                onClick={onEdit}
                className="h-6 w-6"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                data-testid={`button-delete-block-${block.id}`}
                onClick={onDelete}
                className="h-6 w-6"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            <Badge variant="outline" className="text-xs" data-testid={`badge-belt-${block.id}`}>
              {block.belt}
            </Badge>
            {block.focus?.map((f) => (
              <Badge
                key={f}
                variant="secondary"
                className="text-xs"
                data-testid={`badge-focus-${block.id}-${f}`}
              >
                {f}
              </Badge>
            ))}
          </div>

          {block.scheme && (
            <div className="text-xs text-slate-400 mb-2" data-testid={`text-scheme-${block.id}`}>
              {block.scheme}
            </div>
          )}

          {block.exercises && block.exercises.length > 0 && (
            <div className="text-xs text-slate-400" data-testid={`text-exercises-${block.id}`}>
              {block.exercises.length} exercise{block.exercises.length !== 1 ? "s" : ""}
            </div>
          )}

          {block.notes && (
            <div className="text-xs text-slate-500 italic line-clamp-2" data-testid={`text-notes-${block.id}`}>
              {block.notes}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function WeeklyPlanner({
  programId,
  weekNumber,
  blocks,
  onCreateBlock,
  onEditBlock,
  onDeleteBlock,
}: WeeklyPlannerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const moveBlockMutation = useMutation({
    mutationFn: async ({
      blockId,
      weekNumber,
      dayNumber,
      orderIndex,
    }: {
      blockId: string;
      weekNumber: number;
      dayNumber: number;
      orderIndex: number;
    }) => {
      const res = await apiRequest("POST", `/api/blocks/${blockId}/move`, { weekNumber, dayNumber, orderIndex });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs", programId, "weeks", weekNumber] });
    },
  });

  const reorderBlocksMutation = useMutation({
    mutationFn: async ({
      weekNumber,
      dayNumber,
      blockIds,
    }: {
      weekNumber: number;
      dayNumber: number;
      blockIds: string[];
    }) => {
      const res = await apiRequest("POST", `/api/programs/${programId}/blocks/reorder`, { weekNumber, dayNumber, blockIds });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs", programId, "weeks", weekNumber] });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeBlock = blocks.find((b) => b.id === active.id);
    if (!activeBlock) return;

    // Get the container ID (day column) from sortable context
    const containerId = (over.data.current?.sortable?.containerId ?? over.id) as string;
    
    // Extract day number from container ID (e.g., "day-3" -> 3)
    const targetDay = containerId.startsWith("day-") 
      ? parseInt(containerId.split("-")[1]) 
      : null;

    if (!targetDay) {
      console.error("Could not determine target day from container:", containerId);
      return;
    }

    // If dropped on empty day or different day
    if (activeBlock.dayNumber !== targetDay) {
      const blocksInTargetDay = blocks.filter((b) => b.dayNumber === targetDay);
      
      moveBlockMutation.mutate({
        blockId: activeBlock.id,
        weekNumber,
        dayNumber: targetDay,
        orderIndex: blocksInTargetDay.length,
      });
    } else {
      // Reorder within same day
      const overId = over.id as string;
      const overBlock = blocks.find((b) => b.id === overId);
      
      if (overBlock && activeBlock.id !== overBlock.id) {
        const dayBlocks = blocks
          .filter((b) => b.dayNumber === activeBlock.dayNumber)
          .sort((a, b) => a.orderIndex - b.orderIndex);

        const oldIndex = dayBlocks.findIndex((b) => b.id === activeBlock.id);
        const newIndex = dayBlocks.findIndex((b) => b.id === overBlock.id);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reorderedIds = [...dayBlocks];
          const [moved] = reorderedIds.splice(oldIndex, 1);
          reorderedIds.splice(newIndex, 0, moved);

          reorderBlocksMutation.mutate({
            weekNumber,
            dayNumber: activeBlock.dayNumber,
            blockIds: reorderedIds.map((b) => b.id),
          });
        }
      }
    }
  };

  const getBlocksForDay = (dayNumber: number) => {
    return blocks
      .filter((b) => b.dayNumber === dayNumber)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  };

  const activeBlock = activeId ? blocks.find((b) => b.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-7 gap-4" data-testid="weekly-planner-grid">
        {DAYS.map((day) => {
          const dayBlocks = getBlocksForDay(day.number);

          return (
            <DroppableDay
              key={day.number}
              dayNumber={day.number}
              dayName={day.name}
              blocks={dayBlocks}
              onCreateBlock={() => onCreateBlock(day.number)}
              onEditBlock={onEditBlock}
              onDeleteBlock={onDeleteBlock}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeBlock && (
          <Card className="p-3 opacity-90 cursor-grabbing" data-testid="drag-overlay-block">
            <h4 className="text-sm font-semibold text-slate-100">{activeBlock.title}</h4>
            <Badge variant="outline" className="text-xs mt-2">
              {activeBlock.belt}
            </Badge>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}
