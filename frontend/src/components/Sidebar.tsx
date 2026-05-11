"use client";

import React from "react";
import { 
  Mic2, 
  History, 
  Settings, 
  User, 
  PlusCircle,
  LayoutDashboard,
  Volume2
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: PlusCircle, label: "Tạo mới", active: true },
  { icon: History, label: "Lịch sử", active: false },
  { icon: Volume2, label: "Giọng đọc", active: false },
  { icon: LayoutDashboard, label: "Thống kê", active: false },
  { icon: Settings, label: "Cài đặt", active: false },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 h-screen border-r border-border bg-card/30 backdrop-blur-md flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <Mic2 className="text-primary-foreground" size={24} />
        </div>
        <h1 className="text-xl font-bold tracking-tight">VietVoice<span className="text-primary">AI</span></h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.label}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              item.active 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon size={20} className={cn(
              "transition-transform duration-200 group-hover:scale-110",
              item.active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
            )} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <User size={16} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Local User</p>
              <p className="text-xs text-muted-foreground">Offline Mode</p>
            </div>
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-primary rounded-full" />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">Unlimited Credits Available</p>
        </div>
      </div>
    </aside>
  );
};
