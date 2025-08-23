import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";

interface QuestionData {
  question: string;
  options: string[];
  correct: number;
}

interface QuizContentProps {
  questions: { title: string; content: string; order_index: number }[];
}

export const QuizContent = ({ questions }: QuizContentProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState<boolean[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const questionData: QuestionData[] = questions.map(question => {
    try {
      return JSON.parse(question.content);
    } catch (error) {
      console.error('Failed to parse question content:', error);
      return {
        question: question.title,
        options: [],
        correct: 0
      };
    }
  });

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = optionIndex;
    setSelectedAnswers(newAnswers);

    const newResults = [...showResults];
    newResults[currentQuestion] = true;
    setShowResults(newResults);
  };

  const handleNext = () => {
    if (currentQuestion < questionData.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResults([]);
    setQuizCompleted(false);
  };

  const getScore = () => {
    return selectedAnswers.reduce((score, answer, index) => {
      return score + (answer === questionData[index].correct ? 1 : 0);
    }, 0);
  };

  const currentQuestionData = questionData[currentQuestion];
  const isAnswered = selectedAnswers[currentQuestion] !== undefined;
  const isCorrect = selectedAnswers[currentQuestion] === currentQuestionData?.correct;

  if (quizCompleted) {
    const score = getScore();
    const percentage = Math.round((score / questionData.length) * 100);
    
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card className="border-none shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="text-6xl mb-4">
              {percentage >= 70 ? "🎉" : percentage >= 50 ? "👍" : "📚"}
            </div>
            
            <h2 className="text-3xl font-bold text-foreground">
              Тест завершен!
            </h2>
            
            <div className="text-xl text-muted-foreground">
              Ваш результат: <span className="font-bold text-primary">{score}</span> из {questionData.length}
            </div>
            
            <div className="text-lg text-muted-foreground">
              ({percentage}%)
            </div>
            
            <div className="text-center">
              {percentage >= 70 ? (
                <p className="text-green-600 font-semibold">Отлично! Вы хорошо усвоили материал.</p>
              ) : percentage >= 50 ? (
                <p className="text-yellow-600 font-semibold">Неплохо! Рекомендуем повторить материал.</p>
              ) : (
                <p className="text-red-600 font-semibold">Стоит изучить материал еще раз.</p>
              )}
            </div>
            
            <Button 
              onClick={handleRestart}
              className="mt-6"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Пройти еще раз
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="border-none shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="p-8">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Вопрос {currentQuestion + 1} из {questionData.length}</span>
              <span>{Math.round(((currentQuestion + 1) / questionData.length) * 100)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / questionData.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {currentQuestionData?.question}
            </h2>
            
            <div className="space-y-3">
              {currentQuestionData?.options.map((option, index) => {
                const isSelected = selectedAnswers[currentQuestion] === index;
                const isCorrectOption = index === currentQuestionData.correct;
                const showAnswer = showResults[currentQuestion];
                
                let buttonStyle = "border-2 text-left h-auto p-4 justify-start hover:scale-105 transition-all duration-200";
                
                if (showAnswer) {
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
                    onClick={() => !showAnswer && handleAnswerSelect(index)}
                    disabled={showAnswer}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{option}</span>
                      {showAnswer && (
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

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Назад
            </Button>
            
            {isAnswered && (
              <div className="flex items-center space-x-2">
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {isCorrect ? 'Правильно!' : 'Неправильно'}
                </span>
              </div>
            )}
            
            <Button
              onClick={handleNext}
              disabled={!isAnswered}
              className="min-w-[100px]"
            >
              {currentQuestion === questionData.length - 1 ? 'Завершить' : 'Далее'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};