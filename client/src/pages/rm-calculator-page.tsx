import { RMCalculator } from "@/components/rm-calculator";

export default function RMCalculatorPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100 mb-2">
          1RM Calculator
        </h1>
        <p className="text-sm text-slate-400">
          Calculate your one-rep max and training percentages using evidence-based formulas
        </p>
      </div>

      <div className="flex justify-center">
        <RMCalculator />
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        <div className="ringify p-6 rounded-lg">
          <h2 className="text-base font-semibold text-slate-100 mb-3">About the Formulas</h2>
          <div className="space-y-3 text-sm text-slate-300">
            <p>
              <span className="font-medium text-slate-200">Epley:</span> Most widely used formula, developed in 1985. Best for 1-10 reps.
            </p>
            <p>
              <span className="font-medium text-slate-200">Brzycki:</span> Popular among powerlifters, tends to be more conservative. Best for 2-10 reps.
            </p>
            <p>
              <span className="font-medium text-slate-200">Lander:</span> Developed from NCAA Division I football player data. Best for 2-10 reps.
            </p>
            <p>
              <span className="font-medium text-slate-200">Lombardi:</span> Simple power formula, tends to estimate higher. Best for 1-10 reps.
            </p>
            <p>
              <span className="font-medium text-slate-200">Mayhew:</span> Based on bench press research. Best for 1-10 reps.
            </p>
            <p>
              <span className="font-medium text-slate-200">O'Conner:</span> Modified Epley formula, slightly more conservative.
            </p>
            <p>
              <span className="font-medium text-slate-200">Wathan:</span> Developed from Olympic weightlifter data. Best for 1-10 reps.
            </p>
          </div>
        </div>

        <div className="ringify p-6 rounded-lg">
          <h2 className="text-base font-semibold text-slate-100 mb-3">How to Use</h2>
          <ol className="space-y-2 text-sm text-slate-300 list-decimal list-inside">
            <li>Select a weight you can lift for multiple reps (ideally 3-10 reps)</li>
            <li>Enter the weight and number of reps completed</li>
            <li>View your estimated 1RM calculated using 7 proven formulas</li>
            <li>Use the average 1RM for programming your training percentages</li>
            <li>Reference the training percentages table to determine loads for different training goals</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
