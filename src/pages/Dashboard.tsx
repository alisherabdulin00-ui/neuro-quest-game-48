import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Trophy, 
  Clock, 
  Target, 
  Play, 
  CheckCircle2,
  User,
  LogOut
} from "lucide-react";
import Navigation from "@/components/Navigation";

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
  lesson: {
    title: string;
    course: {
      title: string;
      color: string;
    };
  };
}

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      await Promise.all([
        fetchProfile(session.user.id),
        fetchCourses(),
        fetchUserProgress(session.user.id)
      ]);
    } catch (error) {
      console.error("Error checking user:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные пользователя",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching profile:", error);
    } else if (data) {
      setProfile(data);
    }
  };

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at');

    if (error) {
      console.error("Error fetching courses:", error);
    } else {
      setCourses(data || []);
    }
  };

  const fetchUserProgress = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_progress')
      .select(`
        *,
        lesson:lessons(
          title,
          course:courses(title, color)
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error("Error fetching user progress:", error);
    } else {
      setUserProgress(data || []);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось выйти из системы",
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const completedLessons = userProgress.filter(p => p.completed).length;
  const totalProgress = userProgress.length > 0 
    ? userProgress.reduce((acc, p) => acc + p.progress_percentage, 0) / userProgress.length 
    : 0;

  const userName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.telegram_username 
    ? `@${profile.telegram_username}`
    : user?.email || "Пользователь";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Navigation />
      
      <main className="pt-20 px-6 pb-12">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">Добро пожаловать, {userName}!</h1>
                <p className="text-muted-foreground">Ваш личный кабинет обучения</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Общий прогресс</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(totalProgress)}%</div>
                <Progress value={totalProgress} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Пройдено уроков</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedLessons}</div>
                <p className="text-xs text-muted-foreground">из {userProgress.length} начатых</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Доступно курсов</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courses.length}</div>
                <p className="text-xs text-muted-foreground">готовых к изучению</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Время обучения</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {courses.reduce((acc, course) => acc + course.duration_hours, 0)}ч
                </div>
                <p className="text-xs text-muted-foreground">общая длительность</p>
              </CardContent>
            </Card>
          </div>

          {/* Current Progress */}
          {userProgress.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Текущий прогресс</CardTitle>
                <CardDescription>Ваши активные уроки</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userProgress.slice(0, 5).map((progress) => (
                    <div key={progress.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: progress.lesson.course.color }}
                        />
                        <div>
                          <p className="font-medium">{progress.lesson.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {progress.lesson.course.title}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {progress.completed ? (
                          <Badge variant="default">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Завершен
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Progress value={progress.progress_percentage} className="w-20" />
                            <span className="text-sm">{progress.progress_percentage}%</span>
                          </div>
                        )}
                        <Button size="sm" variant="outline">
                          <Play className="w-3 h-3 mr-1" />
                          Продолжить
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Courses */}
          <Card>
            <CardHeader>
              <CardTitle>Доступные курсы</CardTitle>
              <CardDescription>Начните изучение новых тем</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <Card key={course.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div 
                          className="p-2 rounded-lg" 
                          style={{ backgroundColor: course.bg_color, color: course.color }}
                        >
                          <span className="text-2xl">{course.icon}</span>
                        </div>
                        <Badge variant="secondary">{course.difficulty}</Badge>
                      </div>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {course.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                        <span>{course.lessons_count} уроков</span>
                        <span>{course.duration_hours}ч</span>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => navigate(`/course/${course.id}`)}
                      >
                        Начать изучение
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;