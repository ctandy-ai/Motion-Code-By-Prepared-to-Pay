import { Button } from "./button";

export default function EmptyState({ 
  title, 
  action, 
  onAction 
}: { 
  title: string; 
  action?: string; 
  onAction?: () => void; 
}) {
  return (
    <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
      <h3 className="font-heading text-xl mb-2 text-gray-200">{title}</h3>
      {action && (
        <Button onClick={onAction} className="mt-4 rounded-2xl" data-testid="button-empty-state-action">
          {action}
        </Button>
      )}
    </div>
  );
}
