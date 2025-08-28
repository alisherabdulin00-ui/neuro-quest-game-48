import { TheoryBlock } from "./TheoryBlock";
import { PracticeBlock } from "./PracticeBlock";
import { VideoBlock } from "./VideoBlock";

export interface LessonBlock {
  id: string;
  lesson_id: string;
  block_type: 'theory' | 'practice' | 'video';
  order_index: number;
  title: string;
  content: any; // JSON content
}

interface BlockRendererProps {
  block: LessonBlock;
  onComplete: () => void;
  onNext: () => void;
  isLastBlock: boolean;
}

export const BlockRenderer = ({ block, onComplete, onNext, isLastBlock }: BlockRendererProps) => {
  switch (block.block_type) {
    case 'theory':
      return <TheoryBlock block={block} onNext={onNext} isLastBlock={isLastBlock} onComplete={onComplete} />;
    case 'practice':
      return <PracticeBlock block={block} onNext={onNext} isLastBlock={isLastBlock} onComplete={onComplete} />;
    case 'video':
      return <VideoBlock block={block} onNext={onNext} isLastBlock={isLastBlock} onComplete={onComplete} />;
    default:
      return (
        <div className="text-center p-8">
          <p className="text-muted-foreground">Неизвестный тип блока: {block.block_type}</p>
        </div>
      );
  }
};