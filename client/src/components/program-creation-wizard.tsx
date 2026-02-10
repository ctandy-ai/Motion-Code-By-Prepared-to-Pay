import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Calendar, Dumbbell, Zap, Target, ChevronRight, ChevronLeft, 
  Check, Layers, Clock, Users, FileText
} from "lucide-react";

interface ProgramTemplate {
  id: string;
  name: string;
  description: string;
  duration: number;
  trainingDays: number;
  phase: string;
  icon: React.ReactNode;
  recommended?: boolean;
}

const TEMPLATES: ProgramTemplate[] = [
  {
    id: "blank",
    name: "Start from Scratch",
    description: "Build your own custom program with full control over structure and exercises",
    duration: 4,
    trainingDays: 4,
    phase: "General",
    icon: <FileText className="h-6 w-6" />,
  },
  {
    id: "preseason-strength",
    name: "Preseason Strength Block",
    description: "4-week strength-focused block with progressive overload and deload week",
    duration: 4,
    trainingDays: 4,
    phase: "Preseason",
    icon: <Dumbbell className="h-6 w-6" />,
    recommended: true,
  },
  {
    id: "inseason-maintenance",
    name: "In-Season Maintenance",
    description: "Maintain strength and power during competitive season with reduced volume",
    duration: 8,
    trainingDays: 3,
    phase: "In-Season",
    icon: <Target className="h-6 w-6" />,
  },
  {
    id: "offseason-hypertrophy",
    name: "Off-Season Hypertrophy",
    description: "Build muscle mass and work capacity during the off-season",
    duration: 6,
    trainingDays: 4,
    phase: "Off-Season",
    icon: <Zap className="h-6 w-6" />,
  },
  {
    id: "speed-power",
    name: "Speed & Power Development",
    description: "Focus on explosive movements, plyometrics, and sprint work",
    duration: 4,
    trainingDays: 3,
    phase: "Preseason",
    icon: <Zap className="h-6 w-6" />,
  },
  {
    id: "52-week-annual",
    name: "52-Week Annual Plan",
    description: "Complete yearly periodization with all training phases",
    duration: 52,
    trainingDays: 4,
    phase: "Annual",
    icon: <Calendar className="h-6 w-6" />,
  },
];

interface ProgramCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProgram: (data: {
    name: string;
    description: string;
    duration: number;
    trainingDays: number;
    phase: string;
    templateId: string;
  }) => void;
  isPending?: boolean;
}

export function ProgramCreationWizard({
  open,
  onOpenChange,
  onCreateProgram,
  isPending,
}: ProgramCreationWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<ProgramTemplate | null>(null);
  const [programName, setProgramName] = useState("");
  const [programDescription, setProgramDescription] = useState("");
  const [duration, setDuration] = useState(4);
  const [trainingDays, setTrainingDays] = useState(4);

  const resetWizard = () => {
    setStep(1);
    setSelectedTemplate(null);
    setProgramName("");
    setProgramDescription("");
    setDuration(4);
    setTrainingDays(4);
  };

  const handleSelectTemplate = (template: ProgramTemplate) => {
    setSelectedTemplate(template);
    setDuration(template.duration);
    setTrainingDays(template.trainingDays);
    setStep(2);
  };

  const handleCreate = () => {
    onCreateProgram({
      name: programName,
      description: programDescription,
      duration,
      trainingDays,
      phase: selectedTemplate?.phase || "General",
      templateId: selectedTemplate?.id || "blank",
    });
    resetWizard();
  };

  const handleClose = () => {
    onOpenChange(false);
    resetWizard();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl bg-background border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-400" />
            Create Training Program
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {step === 1 && "Choose a template or start from scratch"}
            {step === 2 && "Configure your program details"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-amber-400" : "text-slate-600"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= 1 ? "bg-amber-500 text-slate-900" : "bg-muted text-muted-foreground"
            }`}>
              {step > 1 ? <Check className="h-4 w-4" /> : "1"}
            </div>
            <span className="text-sm font-medium">Template</span>
          </div>
          <div className="flex-1 h-px bg-muted" />
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-amber-400" : "text-slate-600"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= 2 ? "bg-amber-500 text-slate-900" : "bg-muted text-muted-foreground"
            }`}>
              2
            </div>
            <span className="text-sm font-medium">Configure</span>
          </div>
        </div>

        {/* Step 1: Template Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {TEMPLATES.map((template) => (
                <Card
                  key={template.id}
                  className={`p-4 cursor-pointer transition-all border-2 ${
                    selectedTemplate?.id === template.id
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-border bg-muted/50 hover:border-border"
                  }`}
                  onClick={() => handleSelectTemplate(template)}
                  data-testid={`template-${template.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedTemplate?.id === template.id 
                        ? "bg-amber-500/20 text-amber-400" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white text-sm">{template.name}</h3>
                        {template.recommended && (
                          <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {template.duration}w
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {template.trainingDays} days/wk
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Configuration */}
        {step === 2 && (
          <div className="space-y-6">
            {selectedTemplate && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                  {selectedTemplate.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-400">{selectedTemplate.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Program Name
                </label>
                <Input
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  placeholder="e.g., 2024 Spring Preseason"
                  className="bg-muted/50 border-border"
                  data-testid="input-program-name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Description (Optional)
                </label>
                <Textarea
                  value={programDescription}
                  onChange={(e) => setProgramDescription(e.target.value)}
                  placeholder="Describe the goals and focus of this program..."
                  className="bg-muted/50 border-border min-h-[80px]"
                  data-testid="textarea-program-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Duration (weeks)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={52}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 4)}
                    className="bg-muted/50 border-border"
                    data-testid="input-duration"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Training Days per Week
                  </label>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5, 6].map((days) => (
                      <button
                        key={days}
                        onClick={() => setTrainingDays(days)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          trainingDays === days
                            ? "bg-amber-500 text-slate-900"
                            : "bg-muted text-muted-foreground hover:bg-slate-600"
                        }`}
                        data-testid={`training-days-${days}`}
                      >
                        {days}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Program Preview</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-amber-400">{duration}</p>
                    <p className="text-xs text-muted-foreground">Weeks</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-400">{trainingDays}</p>
                    <p className="text-xs text-muted-foreground">Days/Week</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-400">{duration * trainingDays}</p>
                    <p className="text-xs text-muted-foreground">Total Sessions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            {step > 1 && (
              <Button
                variant="ghost"
                onClick={() => setStep(step - 1)}
                data-testid="button-back"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            {step === 2 && (
              <Button
                onClick={handleCreate}
                disabled={!programName.trim() || isPending}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                data-testid="button-create-program"
              >
                {isPending ? "Creating..." : "Create Program"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
