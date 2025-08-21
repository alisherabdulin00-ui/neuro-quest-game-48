import { Button } from "@/components/ui/button";
import { Brain, Sparkles, Zap } from "lucide-react";
import heroImage from "@/assets/ai-brain-hero.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-glow opacity-50" />
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 animate-float">
        <Brain className="w-12 h-12 text-primary opacity-60" />
      </div>
      <div className="absolute top-40 right-20 animate-float" style={{ animationDelay: '2s' }}>
        <Sparkles className="w-8 h-8 text-accent opacity-60" />
      </div>
      <div className="absolute bottom-32 left-20 animate-float" style={{ animationDelay: '4s' }}>
        <Zap className="w-10 h-10 text-primary-glow opacity-60" />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/20">
            <Brain className="w-5 h-5 text-primary animate-pulse-glow" />
            <span className="text-sm font-medium text-muted-foreground">
              Изучи ИИ играючи
            </span>
          </div>
        </div>

        <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
          <span className="text-gradient-hero">Нейро-Квест</span>
          <br />
          <span className="text-2xl md:text-3xl text-muted-foreground font-normal">
            Игровое изучение ИИ
          </span>
        </h1>

        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          Погрузись в увлекательный мир искусственного интеллекта и нейросетей через 
          интерактивные уроки, игры и практические задания
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button variant="hero" size="lg" className="text-lg px-8 py-4">
            <Brain className="w-5 h-5 mr-2" />
            Начать обучение
          </Button>
          <Button variant="game" size="lg" className="text-lg px-8 py-4">
            <Sparkles className="w-5 h-5 mr-2" />
            Попробовать демо
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient mb-2">50+</div>
            <div className="text-sm text-muted-foreground">Интерактивных уроков</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient mb-2">15</div>
            <div className="text-sm text-muted-foreground">Игровых модулей</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient mb-2">1000+</div>
            <div className="text-sm text-muted-foreground">Активных учеников</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;