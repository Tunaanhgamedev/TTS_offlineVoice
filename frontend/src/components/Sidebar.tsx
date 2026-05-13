"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Sparkles, 
  History, 
  Settings, 
  User, 
  PlusCircle,
  BarChart3,
  Volume2,
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: PlusCircle, label: "Studio", href: "/" },
  { icon: Volume2, label: "Giọng đọc", href: "/voices" },
  { icon: History, label: "Lịch sử", href: "/history" },
  { icon: BarChart3, label: "Thống kê", href: "/stats" },
  { icon: Settings, label: "Cài đặt", href: "/settings" },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-72 h-screen border-r border-border/30 bg-background/40 backdrop-blur-2xl flex flex-col shrink-0 z-50">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
          <Cpu className="text-primary-foreground" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight">VietVoice<span className="text-primary">AI</span></h1>
          <p className="text-[8px] font-black tracking-[0.2em] text-muted-foreground uppercase opacity-50">Neural Engine v1</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2">
        <p className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">Main Menu</p>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              )}
              <item.icon size={20} className={cn(
                "transition-all duration-500",
                isActive ? "text-primary scale-110" : "text-muted-foreground group-hover:text-primary group-hover:scale-110"
              )} />
              <span className="font-bold text-sm">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto">
        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-card/50 to-card/20 border border-white/5 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary/50 to-primary/50 flex items-center justify-center border border-white/10">
              <User size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold">Studio Admin</p>
              <p className="text-[10px] text-muted-foreground">PRO License</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
              <span className="text-muted-foreground">System CPU</span>
              <span className="text-primary">24%</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-1/4 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
