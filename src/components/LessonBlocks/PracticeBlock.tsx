import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ArrowRight, CheckCircle } from "lucide-react";
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
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <Card className="border-none shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="p-8">
          {/* Question */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {data.question}
            </h2>
            
            <div className="space-y-3">
              {data.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectOption = index === data.correct;
                
                let buttonStyle = "border-2 text-left h-auto p-4 justify-start hover:scale-105 transition-all duration-200";
                
                if (showResult) {
                  if (isCorrectOption) {
                    buttonStyle += " border-green-500 bg-green-50 text-green-700";
                  } else if (isSelected && !isCorrectOption) {
                    buttonStyle += " border-red-500 bg-red-50 text-red-700";
                  } else {
                    buttonStyle += " border-muted bg-muted/30 text-muted-foreground";
                  }
                } else {
                  buttonStyle += isSelected 
                    ? " border-primary bg-primary/10 text-primary" 
                    : " border-muted hover:border-primary/50";
                }
                
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className={buttonStyle}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showResult}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{option}</span>
                      {showResult && (
                        <div className="ml-2">
                          {isCorrectOption ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : isSelected ? (
                            <XCircle className="w-5 h-5 text-red-600" />
                          ) : null}
                        </div>
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Feedback */}
          {showResult && (
            <div className="mb-6 p-4 rounded-lg bg-background/50">
              <div className="flex items-center space-x-2 mb-2">
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {isCorrect ? 'Правильно!' : 'Неправильно'}
                </span>
              </div>
              {data.explanation && (
                <p className="text-sm text-muted-foreground">
                  {data.explanation}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {showResult && (
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
      )}
    </div>
  );
};