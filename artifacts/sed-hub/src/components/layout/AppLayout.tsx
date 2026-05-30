import React from "react";
import { Link, useLocation } from "wouter";
import { ChatBot } from "@/components/ChatBot";
import { 
  LayoutDashboard, 
  Layers, 
  Briefcase, 
  Database, 
  Activity, 
  Users, 
  Calculator, 
  Scale, 
  UsersRound, 
  Settings,
  ShieldCheck,
  LockKeyhole,
  Send,
  FolderKanban,
  Coins,
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Pools", href: "/pools", icon: Layers },
    { label: "Deals", href: "/deals", icon: Briefcase },
    { label: "Financing", href: "/financing", icon: Coins },
    { label: "Assets", href: "/assets", icon: Database },
    { label: "Oracle Feed", href: "/oracle", icon: Activity },
    { label: "Escrow", href: "/escrow", icon: LockKeyhole },
    { label: "Investors", href: "/investors", icon: Users },
    { label: "Accounting", href: "/accounting", icon: Calculator },
    { label: "Legal", href: "/legal", icon: Scale },
    { label: "Team", href: "/team", icon: UsersRound },
    { label: "Security", href: "/security", icon: ShieldCheck },
    { label: "Workspace", href: "/workspace", icon: FolderKanban },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="w-64 flex-shrink-0 bg-card border-r border-border min-h-[100dvh] flex flex-col">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-bold text-primary-foreground">
          SX
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none tracking-tight">SED-Hub</h1>
          <p className="text-xs text-muted-foreground">RWA Pool Manager</p>
        </div>
        <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">v2.0-beta</span>
      </div>
      
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Icon size={16} className={isActive ? "text-primary" : "text-muted-foreground"} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Telegram Bot link */}
      <div className="px-3 pb-2">
        <a
          href="https://t.me/sx_fundBot"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sky-400 hover:bg-sky-400/10 transition-colors border border-sky-400/20 hover:border-sky-400/40 w-full"
        >
          <Send size={14} className="shrink-0" />
          <span className="font-medium">@sx_fundBot</span>
          <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-400/15 text-sky-400">TG</span>
        </a>
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
            AD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">Admin User</span>
            <span className="text-xs text-muted-foreground">Originator</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden flex flex-col h-[100dvh]">
        {children}
      </main>
      <ChatBot />
    </div>
  );
}
