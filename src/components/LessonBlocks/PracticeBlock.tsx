import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, CheckCircle } from "lucide-react";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/solid";
import { LessonBlock } from "./BlockRenderer";

interface PracticeBlockProps {
  block: LessonBlock;
  onNext: () => void;
  isLastBlock: boolean;
  onComplete: () => void;
}

interface QuestionData {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

export const PracticeBlock = ({ block, onNext, isLastBlock, onComplete }: PracticeBlockProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  // Add null safety check for block.content
  if (!block || !block.content) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Handle data structure mismatch - extract from exercises array or use direct content
  let data: QuestionData;
  
  if (block.content.exercises && Array.isArray(block.content.exercises) && block.content.exercises.length > 0) {
    // Database structure with exercises array
    const exercise = block.content.exercises[0];
    data = {
      question: exercise.question || 'Вопрос не найден',
      options: exercise.options || [],
      correct: exercise.correctAnswer !== undefined ? exercise.correctAnswer : exercise.correct || 0,
      explanation: exercise.explanation
    };
  } else {
    // Direct structure or fallback
    data = {
      question: block.content.question || 'Вопрос не найден',
      options: block.content.options || [],
      correct: block.content.correctAnswer !== undefined ? block.content.correctAnswer : block.content.correct || 0,
      explanation: block.content.explanation
    };
  }

  // Additional safety check for options array
  if (!Array.isArray(data.options) || data.options.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Вопрос загружается...</p>
        </div>
      </div>
    );
  }
  
  const isCorrect = selectedAnswer === data.correct;

  const handleAnswerSelect = (optionIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(optionIndex);
    setShowResult(true);
  };

  const handleContinue = () => {
    if (isLastBlock) {
      onComplete();
    } else {
      onNext();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center overflow-hidden">
        <div className="w-full max-h-full overflow-y-auto px-6">
          {/* Question Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium mb-4">
              <QuestionMarkCircleIcon className="w-4 h-4 mr-2 text-indigo-600" />
              ВОПРОС
            </div>
            <h1 className="text-2xl font-bold text-gray-800 leading-tight">
              {data.question}
            </h1>
          </div>

          {/* Answer Options */}
          <div className="space-y-3 mb-6">
            {data.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectOption = index === data.correct;
              
              let cardClasses = "w-full p-6 text-left rounded-2xl border-2 transition-all duration-200 font-medium text-lg cursor-pointer";
              
              if (showResult) {
                if (isCorrectOption) {
                  cardClasses += " border-green-500 bg-green-50 text-green-800 shadow-[0px_4px_0px_0px] shadow-green-500";
                } else if (isSelected && !isCorrectOption) {
                  cardClasses += " border-red-500 bg-red-50 text-red-800 shadow-[0px_4px_0px_0px] shadow-red-500";
                } else {
                  cardClasses += " border-gray-200 bg-gray-50 text-gray-500 shadow-[0px_2px_0px_0px] shadow-gray-300";
                }
              } else {
                if (isSelected) {
                  cardClasses += " border-indigo-500 bg-indigo-50 text-indigo-800 shadow-[0px_4px_0px_0px] shadow-indigo-500";
                } else {
                  cardClasses += " border-gray-200 bg-white text-gray-800 shadow-[0px_4px_0px_0px] shadow-gray-200 hover:border-indigo-300 hover:shadow-[0px_4px_0px_0px] hover:shadow-indigo-200 active:shadow-[0px_2px_0px_0px] active:shadow-indigo-200 active:translate-y-[2px]";
                }
              }
              
              return (
                <div
                  key={index}
                  className={cardClasses}
                  onClick={() => handleAnswerSelect(index)}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showResult && (
                      <div className="ml-4">
                        {isCorrectOption ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : isSelected ? (
                          <XCircle className="w-6 h-6 text-red-600" />
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feedback */}
          {showResult && (
            <div className={`p-6 rounded-2xl ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
              <div className="flex items-center space-x-3 mb-3">
                {isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                <span className={`font-bold text-lg ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {isCorrect ? 'Отлично!' : 'Попробуйте еще раз!'}
                </span>
              </div>
              {data.explanation && (
                <p className={`text-base ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {data.explanation}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Continue Button */}
      {showResult && (
        <div className="flex justify-center py-4 px-6 flex-shrink-0">
          {isLastBlock ? (
            <Button 
              onClick={handleContinue} 
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-12 py-4 text-lg font-bold rounded-xl border-none shadow-[0px_4px_0px_0px] shadow-indigo-600 hover:shadow-[0px_2px_0px_0px] hover:shadow-indigo-600 active:shadow-[0px_0px_0px_0px] active:shadow-indigo-600 transition-all duration-150 hover:translate-y-[2px] active:translate-y-[4px]"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Завершить урок
            </Button>
          ) : (
            <Button 
              onClick={handleContinue} 
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-16 py-4 text-lg font-bold rounded-xl border-none shadow-[0px_4px_0px_0px] shadow-indigo-600 hover:shadow-[0px_2px_0px_0px] hover:shadow-indigo-600 active:shadow-[0px_0px_0px_0px] active:shadow-indigo-600 transition-all duration-150 hover:translate-y-[2px] active:translate-y-[4px]"
            >
              Продолжить
            </Button>
          )}
        </div>
      )}
    </div>
  );
};