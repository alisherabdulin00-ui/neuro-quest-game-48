import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageCircle, Mail } from "lucide-react";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTelegramAuth, setIsTelegramAuth] = useState(false);
  const [activeTab, setActiveTab] = useState("email");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

  // Check if running in Telegram WebApp
  useEffect(() => {
    const isTelegram = (window as any).Telegram?.WebApp?.initData;
    if (isTelegram) {
      setActiveTab("telegram");
      setIsTelegramAuth(true);
    }
  }, []);

  const handleEmailAuth = async (isSignUp = false) => {
    if (!email || !password) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        
        if (error) throw error;
        
        toast({
          title: "Регистрация успешна",
          description: "Проверьте почту для подтверждения аккаунта",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast({
          title: "Добро пожаловать!",
          description: "Вы успешно вошли в систему",
        });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Произошла ошибка при входе",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTelegramAuth = async () => {
    setIsLoading(true);
    try {
      const initData = (window as any).Telegram?.WebApp?.initData;
      
      if (!initData) {
        throw new Error("Telegram WebApp данные недоступны");
      }

      const { data, error } = await supabase.functions.invoke('telegram-auth', {
        body: { initData }
      });

      if (error) throw error;

      if (data.access_token && data.refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token
        });

        if (sessionError) throw sessionError;

        toast({
          title: "Добро пожаловать!",
          description: "Авторизация через Telegram успешна",
        });
        navigate("/");
      } else {
        throw new Error("Не удалось создать сессию");
      }
    } catch (error: any) {
      console.error('Telegram auth error:', error);
      toast({
        title: "Ошибка авторизации",
        description: error.message || "Произошла ошибка при авторизации через Telegram",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background to-secondary/20">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Вход в систему</CardTitle>
          <CardDescription className="text-center">
            Выберите способ авторизации
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" disabled={isTelegramAuth}>
                <Mail className="w-4 h-4 mr-2" />
                Email
              </TabsTrigger>
              <TabsTrigger value="telegram">
                <MessageCircle className="w-4 h-4 mr-2" />
                Telegram
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  onKeyPress={(e) => e.key === 'Enter' && handleEmailAuth()}
                />
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => handleEmailAuth(false)}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Войти
                </Button>
                <Button
                  onClick={() => handleEmailAuth(true)}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Регистрация
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="telegram" className="space-y-4">
              <div className="text-center space-y-4">
                {isTelegramAuth ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Вы находитесь в Telegram WebApp. Нажмите кнопку ниже для авторизации.
                    </p>
                    <Button
                      onClick={handleTelegramAuth}
                      disabled={isLoading}
                      className="w-full bg-blue-500 hover:bg-blue-600"
                    >
                      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Войти через Telegram
                    </Button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Авторизация через Telegram доступна только в Telegram WebApp
                    </p>
                    <Button
                      onClick={() => setActiveTab("email")}
                      variant="outline"
                      className="w-full"
                    >
                      Использовать Email
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;