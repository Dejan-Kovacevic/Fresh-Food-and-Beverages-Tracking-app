import { Link, useLocation } from "wouter";
import { 
  Home, 
  Plus, 
  History,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Today", icon: Home },
    { href: "/add", label: "Add Food", icon: Plus },
    { href: "/history", label: "History", icon: History },
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] max-w-md mx-auto bg-background shadow-2xl relative">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-tight text-lg">NutriAI</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 relative">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-background/90 backdrop-blur-lg border-t pb-safe max-w-md mx-auto">
        <div className="flex items-center justify-around p-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-16",
                  isActive 
                    ? "text-primary scale-110" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <div className={cn(
                  "p-1 rounded-full transition-colors",
                  isActive ? "bg-primary/10" : ""
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
