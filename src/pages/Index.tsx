import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import LearningModules from "@/components/LearningModules";
import GameFeatures from "@/components/GameFeatures";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <HeroSection />
        <LearningModules />
        <GameFeatures />
      </main>
    </div>
  );
};

export default Index;