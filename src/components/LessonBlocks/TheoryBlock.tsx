import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
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
export const TheoryBlock = ({
  block,
  onNext,
  isLastBlock,
  onComplete
}: TheoryBlockProps) => {
  const data: TheoryData = block.content;
  const layout = data.layout || 'text-only';
  const renderContent = () => {
    switch (layout) {
      case 'image-only':
        return <div className="text-center space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
              {data.title}
            </h1>
            {data.image && <div className="flex justify-center">
                <img src={data.image} alt={data.imageAlt || data.title} className="max-w-md w-full h-auto rounded-2xl shadow-lg" />
              </div>}
          </div>;
      case 'text-image':
        return <div className="space-y-8">
            <h1 className="text-2xl font-bold text-gray-800 text-center text-start">
              {data.title}
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <p className="text-base text-gray-700 leading-relaxed">
                  {data.content}
                </p>
                {data.points && data.points.length > 0 && <ul className="space-y-3">
                    {data.points.map((point, idx) => <li key={idx} className="flex items-start text-base text-gray-700">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-3 mt-2 flex-shrink-0"></div>
                        {point}
                      </li>)}
                  </ul>}
              </div>
              {data.image && <div className="flex justify-center">
                  <img src={data.image} alt={data.imageAlt || data.title} className="max-w-sm w-full h-auto rounded-2xl shadow-lg" />
                </div>}
            </div>
          </div>;
      case 'image-text':
        return <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 text-center">
              {data.title}
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {data.image && <div className="flex justify-center">
                  <img src={data.image} alt={data.imageAlt || data.title} className="max-w-sm w-full h-auto rounded-2xl shadow-lg" />
                </div>}
              <div className="space-y-6">
                <p className="text-lg text-gray-700 leading-relaxed">
                  {data.content}
                </p>
                {data.points && data.points.length > 0 && <ul className="space-y-3">
                    {data.points.map((point, idx) => <li key={idx} className="flex items-start text-base text-gray-700">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-3 mt-2 flex-shrink-0"></div>
                        {point}
                      </li>)}
                  </ul>}
              </div>
            </div>
          </div>;
      default:
        // text-only
        return <div className="text-center space-y-8 max-w-2xl mx-auto">
            <h1 className="text-2xl text-start font-bold text-gray-800 mb-8">
              {data.title}
            </h1>
            
            <p className="text-base text-gray-700 leading-relaxed mb-8 text-left">
              {data.content}
            </p>
            
            {data.points && data.points.length > 0 && <div className="space-y-4 text-left">
                <ul className="space-y-4">
                  {data.points.map((point, idx) => <li key={idx} className="flex items-start text-base text-gray-700">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-3 mt-2 flex-shrink-0"></div>
                      {point}
                    </li>)}
                </ul>
              </div>}
          </div>;
    }
  };
  return <div className="h-full flex flex-col">
      {/* Content */}
      <div className="flex-1 flex items-center justify-center py-2 overflow-hidden">
        <div className="w-full max-h-full overflow-y-auto">
          {renderContent()}
        </div>
      </div>
      
      {/* Bottom Button */}
      <div className="flex justify-center py-6 flex-shrink-0">
        {isLastBlock ? <Button onClick={onComplete} className="bg-green-500 hover:bg-green-600 text-white px-12 py-4 text-lg font-bold rounded-2xl border-none shadow-[0px_4px_0px_0px] shadow-green-600 hover:shadow-[0px_2px_0px_0px] hover:shadow-green-600 active:shadow-[0px_0px_0px_0px] active:shadow-green-600 transition-all duration-150 hover:translate-y-[2px] active:translate-y-[4px]">
            <CheckCircle className="w-5 h-5 mr-2" />
            Завершить урок
          </Button> : <Button onClick={onNext} className="bg-green-500 hover:bg-green-600 text-white px-16 py-4 text-lg font-bold rounded-2xl border-none shadow-[0px_4px_0px_0px] shadow-green-600 hover:shadow-[0px_2px_0px_0px] hover:shadow-green-600 active:shadow-[0px_0px_0px_0px] active:shadow-green-600 transition-all duration-150 hover:translate-y-[2px] active:translate-y-[4px]">
            Продолжить
          </Button>}
      </div>
    </div>;
};