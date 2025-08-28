import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
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
    <div className="w-full space-y-12">
      {/* Video Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mb-6">
          🎬 ВИДЕО
        </div>
        {data.title && (
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {data.title}
          </h1>
        )}
        {data.description && (
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {data.description}
          </p>
        )}
      </div>

      {/* Video Container */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-lg overflow-hidden border-2 border-gray-100">
          <div className="aspect-video">
            <iframe
              src={data.videoUrl}
              title={data.title || block.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
      
      {/* Continue Button */}
      <div className="flex justify-center pt-8">
        {isLastBlock ? (
          <Button 
            onClick={handleContinue} 
            className="bg-green-500 hover:bg-green-600 text-white px-12 py-4 text-lg font-bold rounded-2xl border-none shadow-[0px_4px_0px_0px] shadow-green-600 hover:shadow-[0px_2px_0px_0px] hover:shadow-green-600 active:shadow-[0px_0px_0px_0px] active:shadow-green-600 transition-all duration-150 hover:translate-y-[2px] active:translate-y-[4px]"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Завершить урок
          </Button>
        ) : (
          <Button 
            onClick={handleContinue} 
            className="bg-green-500 hover:bg-green-600 text-white px-16 py-4 text-lg font-bold rounded-2xl border-none shadow-[0px_4px_0px_0px] shadow-green-600 hover:shadow-[0px_2px_0px_0px] hover:shadow-green-600 active:shadow-[0px_0px_0px_0px] active:shadow-green-600 transition-all duration-150 hover:translate-y-[2px] active:translate-y-[4px]"
          >
            Продолжить
          </Button>
        )}
      </div>
    </div>
  );
};