import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp } from "lucide-react";
interface Course {
  id: string;
  title: string;
  description: string;
  lessons_count: number;
  duration_hours: number;
  difficulty: string;
  icon: string;
  color: string;
  bg_color: string;
  order_index: number;
  badges: string[];
}
interface NextCourseCardProps {
  currentCourse: Course | undefined;
  allCourses: Course[];
}
const NextCourseCard = ({
  currentCourse,
  allCourses
}: NextCourseCardProps) => {
  if (!currentCourse) return null;

  // Find the next course by order_index
  const nextCourse = allCourses.find(course => course.order_index === currentCourse.order_index + 1);
  if (!nextCourse) return null;
  const handleNextCourse = () => {
    // For now, just show an alert. Later this could navigate to the next course
    alert(`Следующий курс: ${nextCourse.title}`);
  };
  return <div className="mt-8 px-4">
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
        <div className="text-center space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Следующий курс
            </p>
            <h2 className="text-2xl font-bold text-gray-900">
              {nextCourse.title}
            </h2>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-2">
            {nextCourse.badges.map((badge, index) => <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {badge}
              </Badge>)}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center flex-col ">
            <Button onClick={handleNextCourse} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl border-[3px] border-blue-700 shadow-[0px_4px_0px_0px] shadow-blue-700 transition-all duration-200 hover:translate-y-[2px] hover:shadow-[0px_2px_0px_0px]">
              Следующий курс
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <Button variant="outline" className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-xl border-2 border-gray-300">
              История обучения
              <TrendingUp className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>;
};
export default NextCourseCard;