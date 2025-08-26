import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Trophy, Clock, Target, Play, CheckCircle2, User, LogOut } from "lucide-react";
import Navigation from "@/components/Navigation";
import MobileBottomNav from "@/components/MobileBottomNav";
import LearningPath from "@/components/LearningPath";
interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  telegram_username?: string;
}
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
}
interface UserProgress {
  id: string;
  lesson_id: string;
  progress_percentage: number;
  completed: boolean;
  completed_at: string | null;
}
interface Chapter {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
}
const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    checkUser();
  }, []);
  useEffect(() => {
    if (selectedCourseId) {
      fetchChapters(selectedCourseId);
    }
  }, [selectedCourseId]);
  const checkUser = async () => {
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await Promise.all([fetchProfile(session.user.id), fetchCourses(), fetchUserProgress(session.user.id)]);
    } catch (error) {
      console.error("Error checking user:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные пользователя",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchProfile = async (userId: string) => {
    const {
      data,
      error
    } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching profile:", error);
    } else if (data) {
      setProfile(data);
    }
  };
  const fetchCourses = async () => {
    const {
      data,
      error
    } = await supabase.from('courses').select('*').order('created_at');
    if (error) {
      console.error("Error fetching courses:", error);
    } else {
      setCourses(data || []);
      // Auto-select first course if none selected
      if (data && data.length > 0 && !selectedCourseId) {
        setSelectedCourseId(data[0].id);
      }
    }
  };
  const fetchChapters = async (courseId: string) => {
    const {
      data,
      error
    } = await supabase.from('chapters').select('*').eq('course_id', courseId).order('order_index');
    if (error) {
      console.error("Error fetching chapters:", error);
    } else {
      setChapters(data || []);
    }
  };
  const fetchUserProgress = async (userId: string) => {
    const {
      data,
      error
    } = await supabase.from('user_progress').select('*').eq('user_id', userId);
    if (error) {
      console.error("Error fetching user progress:", error);
    } else {
      setUserProgress(data || []);
    }
  };
  const handleLogout = async () => {
    const {
      error
    } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось выйти из системы",
        variant: "destructive"
      });
    } else {
      navigate("/");
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>;
  }
  const completedLessons = userProgress.filter(p => p.completed).length;
  const totalProgress = userProgress.length > 0 ? userProgress.reduce((acc, p) => acc + p.progress_percentage, 0) / userProgress.length : 0;
  const userName = profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : profile?.telegram_username ? `@${profile.telegram_username}` : user?.email || "Пользователь";
  const selectedCourse = courses.find(course => course.id === selectedCourseId);
  return <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button className="p-2">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">{selectedCourse?.title || "Выберите курс"}</span>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
        
        <button className="p-2" onClick={handleLogout}>
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
          </svg>
        </button>
      </div>

      <main className="pb-20">
        {/* Course Selection */}
        <div className="p-4">
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите курс" />
            </SelectTrigger>
            <SelectContent>
              {courses.map(course => <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Chapters and Learning Path Content */}
        <div className="space-y-6 p-4">
          {chapters.map(chapter => <div key={chapter.id} className="space-y-4">
              {/* Chapter Header */}
              <div className="bg-indigo-600 text-white p-4 rounded-2xl border-[3px] border-indigo-700 shadow-[0px_4px_0px_0px] shadow-indigo-700">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white/80 uppercase tracking-wide">
                    {chapter.title}
                  </p>
                  <h1 className="text-xl font-bold leading-tight">{chapter.description}</h1>
                 
                </div>
              </div>
              
              {/* Learning Path */}
              <div className="p-0 bg-gray-800">
                <LearningPath chapterId={chapter.id} />
              </div>
            </div>)}
        </div>
      </main>
      
      <MobileBottomNav />
    </div>;
};
export default Dashboard;