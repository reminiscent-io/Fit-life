import { Link, useLocation } from "wouter";
import { Home, Dumbbell, History, User } from "lucide-react";
import { cn } from "@/lib/utils";
import AiCoach from "./ai-coach";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Dumbbell, label: "Workout", href: "/workout" },
    { icon: History, label: "History", href: "/history" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 md:pb-0 md:pl-20">
      <main className="max-w-md mx-auto min-h-screen md:max-w-2xl lg:max-w-4xl px-4 py-6 md:px-8">
        {children}
      </main>

      {/* AI Fitness Coach - Available on all pages */}
      <AiCoach />

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/80 backdrop-blur-lg safe-area-bottom md:hidden z-50">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.label} href={item.href}>
                <div className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 cursor-pointer",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}>
                  <item.icon className={cn("h-6 w-6", isActive && "stroke-[2.5px]")} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Side Nav */}
      <nav className="hidden md:flex fixed top-0 left-0 bottom-0 w-20 border-r border-border flex-col items-center py-8 bg-card z-50">
        <div className="mb-8 p-2 rounded-xl bg-primary/10">
          <Dumbbell className="h-8 w-8 text-primary" />
        </div>
        <div className="flex flex-col gap-6 w-full">
          {navItems.map((item) => {
             const isActive = location === item.href;
             return (
              <Link key={item.label} href={item.href}>
                <div className={cn(
                  "flex flex-col items-center justify-center p-3 mx-2 rounded-xl transition-all duration-200 hover:bg-muted cursor-pointer",
                  isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
                )}>
                  <item.icon className={cn("h-6 w-6", isActive && "stroke-[2.5px]")} />
                </div>
              </Link>
             )
          })}
        </div>
      </nav>
    </div>
  );
}
