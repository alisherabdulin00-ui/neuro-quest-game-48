import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, CheckCircle } from "lucide-react";
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
  
  const data: QuestionData = block.content;
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
        <div className="w-full max-h-full overflow-y-auto px-2">
          {/* Question Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              ✨ ВОПРОС
            </div>
            <h1 className="text-2xl font-bold text-gray-800 leading-tight">
              {data.question}
            </h1>
          </div>

          {/* Answer Options */}
          <div className="space-y-4 mb-8">
            {data.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectOption = index === data.correct;
              
              let cardClasses = "w-full p-6 text-left rounded-2xl border-2 transition-all duration-200 font-medium text-lg";
              
              if (showResult) {
                if (isCorrectOption) {
                  cardClasses += " border-green-500 bg-green-50 text-green-800 shadow-[0px_4px_0px_0px] shadow-green-200";
                } else if (isSelected && !isCorrectOption) {
                  cardClasses += " border-red-500 bg-red-50 text-red-800 shadow-[0px_4px_0px_0px] shadow-red-200";
                } else {
                  cardClasses += " border-gray-200 bg-gray-50 text-gray-500";
                }
              } else {
                if (isSelected) {
                  cardClasses += " border-blue-500 bg-blue-50 text-blue-800 shadow-[0px_4px_0px_0px] shadow-blue-200";
                } else {
                  cardClasses += " border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:shadow-[0px_2px_0px_0px] hover:shadow-gray-200 cursor-pointer";
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
        <div className="flex justify-center py-6 flex-shrink-0">
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
      )}
    </div>
  );
};