import { Link, useLocation } from "react-router-dom";
import { Route, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Mapa de Rotas", path: "/", icon: Route },
  { name: "Carteira de Pedidos", path: "/orders", icon: FileText },
];

interface AppNavigationProps {
  isCollapsed: boolean;
}

export function AppNavigation({ isCollapsed }: AppNavigationProps) {
  const location = useLocation();

  return (
    <TooltipProvider>
      <div className="p-4 border-b">
        <nav className="flex flex-col space-y-1">
          {navItems.map((item) =>
            isCollapsed ? (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link to={item.path}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "w-full h-12",
                        location.pathname === item.path && "bg-accent"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="sr-only">{item.name}</span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-4">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-12 text-base",
                    location.pathname === item.path
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-muted-foreground hover:bg-accent/50"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            )
          )}
        </nav>
      </div>
    </TooltipProvider>
  );
}