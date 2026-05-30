import React, { createContext, useContext, useState } from "react";

export type Role = "all" | "owner" | "legal" | "finance" | "tech";

export interface RoleMeta {
  id: Role;
  label: string;
  labelRu: string;
  color: string;
  bg: string;
  initials: string;
}

export const ROLES: RoleMeta[] = [
  { id: "all",     label: "Admin",   labelRu: "Администратор", color: "text-primary",      bg: "bg-primary/10",      initials: "AD" },
  { id: "owner",   label: "Owner",   labelRu: "Собственник",   color: "text-amber-400",    bg: "bg-amber-400/10",    initials: "OW" },
  { id: "legal",   label: "Legal",   labelRu: "Юрист",         color: "text-sky-400",      bg: "bg-sky-400/10",      initials: "LG" },
  { id: "finance", label: "Finance", labelRu: "Финансы",       color: "text-emerald-400",  bg: "bg-emerald-400/10",  initials: "FN" },
  { id: "tech",    label: "Tech",    labelRu: "Технический",   color: "text-violet-400",   bg: "bg-violet-400/10",   initials: "TC" },
];

export const TEAM_MEMBERS = [
  { id: "alpariod",         name: "Андрей",     tg: "alpariod",         role: "owner"   as Role },
  { id: "Grygorii_Damekin", name: "Григорий",   tg: "Grygorii_Damekin", role: "owner"   as Role },
  { id: "sasha_damekina",   name: "Александра", tg: "sasha_damekina",   role: "legal"   as Role },
  { id: "danii191191",      name: "Данил",      tg: "danii191191",      role: "tech"    as Role },
];

interface RoleCtx {
  role: Role;
  setRole: (r: Role) => void;
  meta: RoleMeta;
}

const Ctx = createContext<RoleCtx | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    try { return (localStorage.getItem("sx_role") as Role) || "all"; }
    catch { return "all"; }
  });

  function setRole(r: Role) {
    try { localStorage.setItem("sx_role", r); } catch {}
    setRoleState(r);
  }

  const meta = ROLES.find(r => r.id === role)!;

  return <Ctx.Provider value={{ role, setRole, meta }}>{children}</Ctx.Provider>;
}

export function useRole(): RoleCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRole must be inside RoleProvider");
  return ctx;
}
