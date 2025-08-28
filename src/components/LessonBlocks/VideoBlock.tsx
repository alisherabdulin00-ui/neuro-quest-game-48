import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import { LessonBlock } from "./BlockRenderer";

interface VideoBlockProps {
  block: LessonBlock;
  onNext: () => void;
  isLastBlock: boolean;
  onComplete: () => void;
}

interface VideoData {
  videoUrl: string;
  title?: string;
  description?: string;
}

export const VideoBlock = ({ block, onNext, isLastBlock, onComplete }: VideoBlockProps) => {
  const data: VideoData = block.content;

  const handleContinue = () => {
    if (isLastBlock) {
      onComplete();
    } else {
      onNext();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <Card className="border-none shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="p-8">
          {data.title && (
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {data.title}
              </h2>
              {data.description && (
                <p className="text-muted-foreground">
                  {data.description}
                </p>
              )}
            </div>
          )}
          
          <div className="aspect-[9/16] max-h-[70vh] mx-auto bg-background rounded-xl overflow-hidden shadow-lg">
            <iframe
              src={data.videoUrl}
              title={data.title || block.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        {isLastBlock ? (
          <Button onClick={handleContinue} size="lg">
            <CheckCircle className="w-4 h-4 mr-2" />
            Завершить урок
          </Button>
        ) : (
          <Button onClick={handleContinue} size="lg">
            Далее
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};