import Hero from "../components/Hero";
import MovementSection from "../components/MovementSection";
import MissionStatement from "../components/MissionStatement";
import StatisticsSection from "../components/StatisticsSection";
import PaymentProcess from "../components/PaymentProcess";
import ContactFooter from "../components/ContactFooter";

export default function Landing() {
  return (
    <main className="bg-p2p-dark min-h-screen text-white">
      <Hero />

      <MovementSection
        title="Acceleration (Starting)"
        description="Develop explosive starting power and reactive drive mechanics that translate directly to first-step speed."
        video="/attached_assets/Standing_Triple_Jump_black_compressed.mp4"
        showPhoneFrame={true}
      />

      <MovementSection
        title="Deceleration (Stopping)"
        description="Build control and braking strength to reduce injury risk and enhance change-of-direction performance."
        video="/attached_assets/SHH_Standing_Double_Hop_black_compressed.mp4"
        reverse
      />

      <MovementSection
        title="Change of Direction (Stepping)"
        description="Train agility, reactive power, and multi-planar control with precise footwork and body alignment."
        video="/attached_assets/Lateral_Hops_Speed_black_compressed.mp4"
        showPhoneFrame={true}
      />

      <MovementSection
        title="Top-Speed Running (Sprinting)"
        description="Enhance upright mechanics, stiffness, and elastic efficiency for maximal velocity sprinting."
        video="/attached_assets/Speed_Hops_black_compressed.mp4"
        reverse
      />

      <MissionStatement />

      <StatisticsSection />

      <PaymentProcess />

      <ContactFooter />
    </main>
  );
}
