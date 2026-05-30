import React from "react";
import { Link, useLocation } from "wouter";
import { ChatBot } from "@/components/ChatBot";
import {
  Home,
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
  Vote,
  ChevronDown,
} from "lucide-react";
import { useRole, ROLES } from "@/lib/roleContext";
import { useState } from "react";

export function Sidebar() {
  const [location] = useLocation();
  const { role, setRole, meta } = useRole();
  const [roleOpen, setRoleOpen] = useState(false);

  const navItems = [
    { label: "Hub",         href: "/",          icon: Home       },
    { label: "DAO Votes",   href: "/dao",        icon: Vote       },
    { label: "Pools",       href: "/pools",      icon: Layers     },
    { label: "Deals",       href: "/deals",      icon: Briefcase  },
    { label: "Financing",   href: "/financing",  icon: Coins      },
    { label: "Assets",      href: "/assets",     icon: Database   },
    { label: "Oracle Feed", href: "/oracle",     icon: Activity   },
    { label: "Escrow",      href: "/escrow",     icon: LockKeyhole},
    { label: "Investors",   href: "/investors",  icon: Users      },
    { label: "Accounting",  href: "/accounting", icon: Calculator },
    { label: "Legal",       href: "/legal",      icon: Scale      },
    { label: "Team",        href: "/team",       icon: UsersRound },
    { label: "Security",    href: "/security",   icon: ShieldCheck},
    { label: "Workspace",   href: "/workspace",  icon: FolderKanban},
    { label: "Settings",    href: "/settings",   icon: Settings   },
  ];

  return (
    <div className="w-64 flex-shrink-0 bg-card border-r border-border min-h-[100dvh] flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-bold text-primary-foreground text-sm">
          SX
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none tracking-tight">SED-Hub</h1>
          <p className="text-xs text-muted-foreground">RWA Pool Manager</p>
        </div>
        <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
          v2.1
        </span>
      </div>

      {/* Role switcher */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={() => setRoleOpen(o => !o)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-medium transition-all
            ${meta.bg} ${meta.color} border-current/20 hover:opacity-90`}
        >
          <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold bg-current/10">
            {meta.initials}
          </span>
          <span className="flex-1 text-left">{meta.labelRu}</span>
          <ChevronDown size={12} className={`transition-transform ${roleOpen ? "rotate-180" : ""}`} />
        </button>

        {roleOpen && (
          <div className="mt-1 rounded-md border border-border bg-card shadow-lg overflow-hidden z-50">
            {ROLES.map(r => (
              <button
                key={r.id}
                onClick={() => { setRole(r.id); setRoleOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors
                  ${role === r.id
                    ? `${r.bg} ${r.color} font-medium`
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <span className={`w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold ${r.bg} ${r.color}`}>
                  {r.initials}
                </span>
                {r.labelRu}
                {role === r.id && <span className="ml-auto text-[9px]">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? location === "/"
              : location === item.href || location.startsWith(item.href + "/");
          const Icon = item.icon;
          const isDao = item.href === "/dao";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : isDao
                    ? "text-amber-400/80 hover:bg-amber-400/10 hover:text-amber-400"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Icon
                size={16}
                className={
                  isActive ? "text-primary" : isDao ? "text-amber-400/80" : "text-muted-foreground"
                }
              />
              {item.label}
              {isDao && !isActive && (
                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-400">
                  2
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Telegram Bot */}
      <div className="px-3 pb-2">
        <a
          href="https://t.me/sx_fundBot"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sky-400 hover:bg-sky-400/10 transition-colors border border-sky-400/20 hover:border-sky-400/40 w-full"
        >
          <Send size={14} className="shrink-0" />
          <span className="font-medium text-xs">@sx_fundBot</span>
          <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-400/15 text-sky-400">TG</span>
        </a>
      </div>

      {/* Current role footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${meta.bg} ${meta.color}`}>
            {meta.initials}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">SX Fund Team</span>
            <span className={`text-xs ${meta.color}`}>{meta.labelRu}</span>
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
