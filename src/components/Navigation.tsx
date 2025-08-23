import { Button } from "@/components/ui/button";
import { Brain, Menu, User, Settings } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { name: "Модули", href: "#modules" },
    { name: "Игры", href: "#games" },
    { name: "Рейтинг", href: "#leaderboard" },
    { name: "Сообщество", href: "#community" }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Нейро-Квест</span>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Settings className="w-5 h-5" />
            </Button>
            
            <Button variant="game" className="hidden md:flex" asChild>
              <Link to="/auth">
                <User className="w-4 h-4 mr-2" />
                Войти
              </Link>
            </Button>

            <Button variant="hero">
              Начать игру
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col gap-4">
              {menuItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-smooth font-medium px-2 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                <Button variant="game" className="justify-start" asChild>
                  <Link to="/auth">
                    <User className="w-4 h-4 mr-2" />
                    Войти
                  </Link>
                </Button>
                <Button variant="ghost" className="justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Настройки
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;