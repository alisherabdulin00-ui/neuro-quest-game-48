import { useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SlideData {
  title: string;
  content: string;
  points?: string[];
  image?: string;
  imageAlt?: string;
  layout?: 'text-only' | 'image-only' | 'text-image' | 'image-text';
}

interface SlidesContentProps {
  slides: { title: string; content: string; order_index: number }[];
}

export const SlidesContent = ({ slides }: SlidesContentProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slideData: SlideData[] = slides.map(slide => {
    try {
      return JSON.parse(slide.content);
    } catch (error) {
      console.error('Failed to parse slide content:', error);
      return {
        title: slide.title,
        content: slide.content,
        points: []
      };
    }
  });

  const handlePrevious = () => {
    setCurrentSlide(prev => prev > 0 ? prev - 1 : slideData.length - 1);
  };

  const handleNext = () => {
    setCurrentSlide(prev => prev < slideData.length - 1 ? prev + 1 : 0);
  };

  const renderSlideContent = (slide: SlideData) => {
    const layout = slide.layout || 'text-only';
    
    switch (layout) {
      case 'image-only':
        return (
          <div className="flex flex-col items-center justify-center space-y-6 h-full">
            <h2 className="text-4xl font-bold text-foreground text-center mb-6">
              {slide.title}
            </h2>
            {slide.image && (
              <div className="relative max-w-3xl w-full">
                <img
                  src={slide.image}
                  alt={slide.imageAlt || slide.title}
                  className="w-full h-auto rounded-lg shadow-lg object-cover max-h-[70vh]"
                />
              </div>
            )}
          </div>
        );
        
      case 'text-image':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-foreground">
                {slide.title}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {slide.content}
              </p>
              {slide.points && slide.points.length > 0 && (
                <ul className="space-y-3">
                  {slide.points.map((point, idx) => (
                    <li key={idx} className="flex items-start text-base text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-primary mr-3 mt-2 flex-shrink-0"></div>
                      {point}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {slide.image && (
              <div className="relative">
                <img
                  src={slide.image}
                  alt={slide.imageAlt || slide.title}
                  className="w-full h-auto rounded-lg shadow-lg object-cover max-h-[50vh]"
                />
              </div>
            )}
          </div>
        );
        
      case 'image-text':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full">
            {slide.image && (
              <div className="relative">
                <img
                  src={slide.image}
                  alt={slide.imageAlt || slide.title}
                  className="w-full h-auto rounded-lg shadow-lg object-cover max-h-[50vh]"
                />
              </div>
            )}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-foreground">
                {slide.title}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {slide.content}
              </p>
              {slide.points && slide.points.length > 0 && (
                <ul className="space-y-3">
                  {slide.points.map((point, idx) => (
                    <li key={idx} className="flex items-start text-base text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-primary mr-3 mt-2 flex-shrink-0"></div>
                      {point}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
        
      default: // text-only
        return (
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-foreground mb-6">
              {slide.title}
            </h2>
            
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              {slide.content}
            </p>
            
            {slide.points && slide.points.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-foreground">
                  Основные пункты:
                </h3>
                <ul className="space-y-3">
                  {slide.points.map((point, idx) => (
                    <li key={idx} className="flex items-center text-lg text-muted-foreground justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary mr-4 flex-shrink-0"></div>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Carousel 
        className="w-full"
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent>
          {slideData.map((slide, index) => (
            <CarouselItem key={index}>
              <Card className="border-none shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardContent className="p-8 min-h-[70vh] flex items-center justify-center">
                  {renderSlideContent(slide)}
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <CarouselPrevious 
          className="left-4 w-12 h-12 hover:scale-110 transition-transform"
          onClick={handlePrevious}
        >
          <ChevronLeft className="w-6 h-6" />
        </CarouselPrevious>
        
        <CarouselNext 
          className="right-4 w-12 h-12 hover:scale-110 transition-transform"
          onClick={handleNext}
        >
          <ChevronRight className="w-6 h-6" />
        </CarouselNext>
      </Carousel>
      
      {/* Slide indicators */}
      <div className="flex justify-center mt-6 space-x-2">
        {slideData.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === currentSlide 
                ? 'bg-primary shadow-lg scale-125' 
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
          />
        ))}
      </div>
      
      {/* Slide counter */}
      <div className="text-center mt-4">
        <span className="text-sm text-muted-foreground">
          {currentSlide + 1} из {slideData.length}
        </span>
      </div>
    </div>
  );
};