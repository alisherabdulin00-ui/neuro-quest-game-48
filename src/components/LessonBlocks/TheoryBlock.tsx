import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import { LessonBlock } from "./BlockRenderer";

interface TheoryBlockProps {
  block: LessonBlock;
  onNext: () => void;
  isLastBlock: boolean;
  onComplete: () => void;
}

interface TheoryData {
  title: string;
  content: string;
  points?: string[];
  image?: string;
  imageAlt?: string;
  layout?: 'text-only' | 'image-only' | 'text-image' | 'image-text';
}

export const TheoryBlock = ({ block, onNext, isLastBlock, onComplete }: TheoryBlockProps) => {
  const data: TheoryData = block.content;
  const layout = data.layout || 'text-only';

  const renderContent = () => {
    switch (layout) {
      case 'image-only':
        return (
          <div className="flex flex-col items-center justify-center space-y-6 h-full">
            <h2 className="text-4xl font-bold text-foreground text-center mb-6">
              {data.title}
            </h2>
            {data.image && (
              <div className="relative max-w-3xl w-full">
                <img
                  src={data.image}
                  alt={data.imageAlt || data.title}
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
                {data.title}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {data.content}
              </p>
              {data.points && data.points.length > 0 && (
                <ul className="space-y-3">
                  {data.points.map((point, idx) => (
                    <li key={idx} className="flex items-start text-base text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-primary mr-3 mt-2 flex-shrink-0"></div>
                      {point}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {data.image && (
              <div className="relative">
                <img
                  src={data.image}
                  alt={data.imageAlt || data.title}
                  className="w-full h-auto rounded-lg shadow-lg object-cover max-h-[50vh]"
                />
              </div>
            )}
          </div>
        );
        
      case 'image-text':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full">
            {data.image && (
              <div className="relative">
                <img
                  src={data.image}
                  alt={data.imageAlt || data.title}
                  className="w-full h-auto rounded-lg shadow-lg object-cover max-h-[50vh]"
                />
              </div>
            )}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-foreground">
                {data.title}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {data.content}
              </p>
              {data.points && data.points.length > 0 && (
                <ul className="space-y-3">
                  {data.points.map((point, idx) => (
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
              {data.title}
            </h2>
            
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              {data.content}
            </p>
            
            {data.points && data.points.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-foreground">
                  Основные пункты:
                </h3>
                <ul className="space-y-3">
                  {data.points.map((point, idx) => (
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
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <Card className="border-none shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="p-8 min-h-[70vh] flex items-center justify-center">
          {renderContent()}
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        {isLastBlock ? (
          <Button onClick={onComplete} size="lg">
            <CheckCircle className="w-4 h-4 mr-2" />
            Завершить урок
          </Button>
        ) : (
          <Button onClick={onNext} size="lg">
            Далее
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};