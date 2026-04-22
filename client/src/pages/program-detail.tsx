import DashboardLayout from "@/layouts/DashboardLayout";
import VideoSmart from "@/components/VideoSmart";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useRoute } from "wouter";

const programsData: Record<string, any> = {
  "acceleration-for-field-sports": {
    title: "Acceleration for Field Sports",
    video: "/objects/Videos/Videos/Starting - blue belt/Pogo Split Jump_.MOV",
    overview:
      "This module focuses on developing horizontal force and efficient first-step acceleration through specific plyometrics and resisted drills.",
    guidance: [
      "Focus on low-contact plyometric series (pogos, skips, bounds).",
      "Integrate 1–2 resisted start sessions weekly (sleds, bands).",
      "Balance strength sessions around hip/knee extension synergy.",
    ],
    sample: [
      ["Session 1", "Resisted Sled Starts", "3 x 20m"],
      ["Session 2", "Bounding Progression", "3 x 30m"],
      ["Session 3", "Contrast Jumps (Depth + Sprint)", "3 sets"],
    ],
  },
  "deceleration-control": {
    title: "Deceleration Control",
    video: "/objects/Videos/Videos/Stopping - white belt/Depth Drop to Stick_.MOV",
    overview:
      "Master the ability to absorb and redirect momentum. This program emphasises eccentric strength and technique during braking.",
    guidance: [
      "Train eccentrics (split squats, Nordic hamstring, landings).",
      "Incorporate controlled tempo movements (3–4s lowering).",
      "Progress landing drills to reactive deceleration cuts.",
    ],
    sample: [
      ["Session 1", "Depth Drop to Stick", "3x5"],
      ["Session 2", "Tempo Split Squats", "3x8/side"],
      ["Session 3", "Multi-Directional Landings", "3x5 angles"],
    ],
  },
  "change-of-direction-mastery": {
    title: "Change of Direction Mastery",
    video: "/objects/Videos/Videos/Stepping - white belt/Lateral Bound & Stick_.MOV",
    overview:
      "Refine cutting, stepping and re-acceleration skills. Program multi-planar strength and reactive footwork to enhance agility without compromising stability.",
    guidance: [
      "Focus on lateral and rotational power development.",
      "Train reactive footwork with varied cutting angles.",
      "Combine strength, stability and speed work in each session.",
    ],
    sample: [
      ["Session 1", "Lateral Bounds", "3x8/side"],
      ["Session 2", "Reactive Cutting Drills", "4x10 reps"],
      ["Session 3", "Multi-Directional Plyos", "3 sets"],
    ],
  },
  "top-speed-mechanics": {
    title: "Top Speed Mechanics",
    video: "/objects/Videos/Videos/Sprinting - white belt/Fast skips_.MOV",
    overview:
      "Explore upright running mechanics and elastic efficiency. Learn to program flying sprints, wickets, and stiffness drills to improve maximum velocity safely.",
    guidance: [
      "Develop elastic stiffness through high-velocity plyometrics.",
      "Use technical sprint drills (A-skips, wickets, flying 10s).",
      "Ensure adequate recovery between max velocity sessions.",
    ],
    sample: [
      ["Session 1", "Fast Skips + Flying 10s", "4 sets"],
      ["Session 2", "Wicket Runs", "5x30m"],
      ["Session 3", "Maximum Velocity Sprints", "3x40m"],
    ],
  },
};

export default function ProgramDetail() {
  const [, params] = useRoute("/programs/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug || "acceleration-for-field-sports";
  const program = programsData[slug] || programsData["acceleration-for-field-sports"];

  return (
    <DashboardLayout>
      <div className="mb-12">
        <div className="aspect-video mb-6 rounded-xl overflow-hidden shadow-glow">
          <VideoSmart src={program.video} />
        </div>
        <h1 className="font-heading text-4xl mb-4 text-white">{program.title}</h1>
        <p className="text-gray-300 font-body text-lg mb-8">{program.overview}</p>

        <h2 className="font-heading text-2xl mb-3 text-p2p-electric">Programming Guidance</h2>
        <ul className="list-disc list-inside text-gray-300 mb-8 font-body">
          {program.guidance.map((g: string, i: number) => (
            <li key={i} className="mb-2">{g}</li>
          ))}
        </ul>

        <h2 className="font-heading text-2xl mb-3 text-p2p-electric">Example Microcycle</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-white/10">
            <thead>
              <tr className="bg-white/5">
                <th className="p-3 border border-white/10 font-heading text-white">Session</th>
                <th className="p-3 border border-white/10 font-heading text-white">Focus</th>
                <th className="p-3 border border-white/10 font-heading text-white">Prescription</th>
              </tr>
            </thead>
            <tbody>
              {program.sample.map((r: string[], i: number) => (
                <tr key={i} className="font-body">
                  {r.map((cell, j) => (
                    <td key={j} className="p-3 border border-white/10 text-gray-300">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8">
          <Button 
            onClick={() => navigate("/dashboard")}
            variant="outline"
            className="border-p2p-electric text-p2p-electric hover:bg-p2p-electric/10"
            data-testid="button-back-to-programs"
          >
            Back to Programs
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
