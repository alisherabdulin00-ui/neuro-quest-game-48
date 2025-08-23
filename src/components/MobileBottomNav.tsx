import { NavLink } from "react-router-dom";
import { BookOpen, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileBottomNav = () => {
  const navItems = [
    {
      name: "Обучение",
      href: "/dashboard",
      icon: BookOpen,
    },
    {
      name: "ИИ-инструменты",
      href: "/ai-tools",
      icon: Brain,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;