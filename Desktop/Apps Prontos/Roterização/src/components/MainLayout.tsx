import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Route, FileText, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { name: "Mapa de Rotas", path: "/", icon: Route },
  { name: "Carteira de Pedidos", path: "/orders", icon: FileText },
];

const MobileSidebar = () => {
  const location = useLocation();

  return (
    <nav className="flex flex-col space-y-1 p-4">
      {navItems.map((item) => (
        <Link key={item.path} to={item.path}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3",
              location.pathname === item.path
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Button>
        </Link>
      ))}
    </nav>
  );
};

const Header = () => (
  <header className="border-b bg-card shadow-sm">
    <div className="container mx-auto flex h-16 items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">Roterização TecnoPerfil</h1>
          <p className="text-xs text-muted-foreground">Otimização de Rotas Inteligente</p>
        </div>
      </div>
    </div>
  </header>
);

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex h-screen w-full flex-col overflow-hidden">
        <Header />
        <div className="absolute top-4 left-4 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] p-0 pt-16">
              <MobileSidebar />
            </SheetContent>
          </Sheet>
        </div>
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-background to-secondary/20">
      {children}
    </div>
  );
}