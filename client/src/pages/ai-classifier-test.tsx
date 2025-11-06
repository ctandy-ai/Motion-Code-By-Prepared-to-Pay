import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wand2, Check, X, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AIClassification {
  exerciseName: string;
  recommendedBeltLevel: "White" | "Blue" | "Black";
  beltReasoning: string;
  recommendedIntensity: string;
  intensityReasoning: string;
  suggestedSets: string;
  suggestedReps: string;
  suggestedRPE: string;
  movementComplexity: "Low" | "Moderate" | "High";
  techniqueRequirements: string;
  injuryRiskFactors: string[];
  confidence: number;
}

interface ClassificationResult {
  original: any;
  aiClassification?: AIClassification;
  error?: string;
}

export default function AIClassifierTest() {
  const [results, setResults] = useState<ClassificationResult[]>([]);
  const { toast } = useToast();

  const classifyMutation = useMutation({
    mutationFn: async () => {
      // Sample exercises from TeamBuildr database
      const sampleExercises = [
        {
          id: "1",
          name: "Barbell Back Squat",
          tracking: "1RM",
          tags: ["Squat", "Lower Body", "Barbell"],
          attributes: ["Bilateral", "Compound"],
          variables_default: { sets: "4", reps: "5", intensity: "80% 1RM" },
          belt_min: "White",
          belt_max: "Black",
        },
        {
          id: "2",
          name: "Box Jump",
          tracking: "Highest Weight",
          tags: ["Plyometric", "Power"],
          attributes: ["Explosive", "Lower Body"],
          variables_default: { sets: "3", reps: "6", intensity: "Bodyweight" },
          belt_min: "Blue",
          belt_max: "Black",
        },
        {
          id: "3",
          name: "Bird Dog",
          tracking: null,
          tags: ["Core", "Stability"],
          attributes: ["Unilateral", "Bodyweight"],
          variables_default: { sets: "3", reps: "10", intensity: "Bodyweight/RPE 6" },
          belt_min: "White",
          belt_max: "Blue",
        },
        {
          id: "4",
          name: "Clean and Jerk",
          tracking: "1RM",
          tags: ["Olympic", "Power", "Full Body"],
          attributes: ["Explosive", "Complex"],
          variables_default: { sets: "5", reps: "2", intensity: "85% 1RM" },
          belt_min: "Black",
          belt_max: "Black",
        },
        {
          id: "5",
          name: "Goblet Squat",
          tracking: "Highest Weight",
          tags: ["Squat", "Beginner"],
          attributes: ["Bilateral", "Dumbbell"],
          variables_default: { sets: "3", reps: "12", intensity: "Moderate" },
          belt_min: "White",
          belt_max: "White",
        },
      ];

      const response = await apiRequest("POST", "/api/ai/classify-sample", {
        exercises: sampleExercises,
      });

      return response;
    },
    onSuccess: (data: any) => {
      setResults(data.results);
      toast({
        title: "AI Classification Complete!",
        description: `Successfully classified ${data.results.length} exercises`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Classification Failed",
        description: error.message || "Failed to classify exercises",
        variant: "destructive",
      });
    },
  });

  const getBeltColor = (belt: string) => {
    if (belt === "White") return "bg-slate-100 text-slate-900";
    if (belt === "Blue") return "bg-blue-500 text-white";
    if (belt === "Black") return "bg-slate-900 text-white";
    return "bg-slate-400 text-white";
  };

  return (
    <div className="space-y-8">
      <div className="bglass rounded-2xl shadow-glass p-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading text-2xl text-slate-100 mb-2">
              AI Exercise Classification Test
            </h2>
            <p className="text-sm text-slate-400">
              Test GPT-4.1 classification on 5 sample exercises from your TeamBuildr database
            </p>
          </div>
          <Badge variant="outline" className="text-cyan-400 border-cyan-400">
            <Wand2 className="h-3 w-3 mr-1" />
            Powered by GPT-4.1
          </Badge>
        </div>

        <div className="flex items-center gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-6">
          <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <div className="text-sm text-slate-300">
            <strong>Testing Mode:</strong> This will classify 5 sample exercises to show you how the AI works.
            Review the results before running on all 1,769 exercises. Uses Replit AI Integrations (billed to your credits).
          </div>
        </div>

        <Button
          onClick={() => classifyMutation.mutate()}
          disabled={classifyMutation.isPending}
          className="btn btn-pri"
          data-testid="button-classify-sample"
        >
          <Wand2 className="h-4 w-4 mr-2" />
          {classifyMutation.isPending
            ? "Classifying... (this may take 10-20 seconds)"
            : "Run AI Classification Test"}
        </Button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-6">
          <h3 className="font-heading text-xl text-slate-100">
            Classification Results ({results.length} exercises)
          </h3>

          {results.map((result, idx) => (
            <Card key={idx} className="bglass border-0 shadow-glass">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-slate-100">
                      {result.original.name}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        Current: {result.original.belt_min} - {result.original.belt_max}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {result.original.tracking || "No Tracking"}
                      </Badge>
                    </div>
                  </div>
                  {result.error ? (
                    <Badge variant="destructive">
                      <X className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  ) : (
                    <Badge className="bg-green-500">
                      <Check className="h-3 w-3 mr-1" />
                      Success
                    </Badge>
                  )}
                </div>
              </CardHeader>

              {result.aiClassification && (
                <CardContent className="space-y-4">
                  {/* Belt Level Recommendation */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-200">
                          AI Recommended Belt Level
                        </h4>
                        <Badge className={getBeltColor(result.aiClassification.recommendedBeltLevel)}>
                          {result.aiClassification.recommendedBeltLevel}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">
                        {result.aiClassification.beltReasoning}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-200">Movement Complexity</h4>
                      <Badge variant="outline">
                        {result.aiClassification.movementComplexity}
                      </Badge>
                    </div>
                  </div>

                  {/* Intensity Recommendation */}
                  <div className="space-y-2 border-t border-slate-700 pt-4">
                    <h4 className="text-sm font-semibold text-slate-200">
                      Recommended Programming
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400">Sets:</span>{" "}
                        <span className="text-slate-200">{result.aiClassification.suggestedSets}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Reps:</span>{" "}
                        <span className="text-slate-200">{result.aiClassification.suggestedReps}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">RPE:</span>{" "}
                        <span className="text-slate-200">{result.aiClassification.suggestedRPE}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      <strong>Intensity: </strong>
                      {result.aiClassification.recommendedIntensity}
                    </p>
                    <p className="text-xs text-slate-400">
                      {result.aiClassification.intensityReasoning}
                    </p>
                  </div>

                  {/* Technique Requirements */}
                  <div className="space-y-2 border-t border-slate-700 pt-4">
                    <h4 className="text-sm font-semibold text-slate-200">
                      Technique Requirements
                    </h4>
                    <p className="text-xs text-slate-400">
                      {result.aiClassification.techniqueRequirements}
                    </p>
                  </div>

                  {/* Injury Risk Factors */}
                  {result.aiClassification.injuryRiskFactors.length > 0 && (
                    <div className="space-y-2 border-t border-slate-700 pt-4">
                      <h4 className="text-sm font-semibold text-slate-200">
                        Injury Risk Factors
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.aiClassification.injuryRiskFactors.map((factor, i) => (
                          <Badge key={i} variant="outline" className="text-xs text-red-400 border-red-400/30">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confidence Score */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                    <span className="text-xs text-slate-400">AI Confidence</span>
                    <Badge variant="outline" className="text-xs">
                      {result.aiClassification.confidence}%
                    </Badge>
                  </div>
                </CardContent>
              )}

              {result.error && (
                <CardContent>
                  <p className="text-sm text-red-400">Error: {result.error}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
