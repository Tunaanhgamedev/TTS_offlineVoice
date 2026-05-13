import React from "react";
import { User, Mic, Plus, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Voice {
  id: string;
  name: string;
  gender: string;
  accent: string;
  is_cloned?: boolean;
}

export const VoiceSelector = ({ 
  voices, 
  selectedId, 
  onSelect,
  onClone,
  onDelete
}: { 
  voices: Voice[], 
  selectedId: string, 
  onSelect: (id: string) => void,
  onClone?: () => void,
  onDelete?: (id: string) => void
}) => {
  return (
    <section className="flex flex-col h-full bg-transparent overflow-hidden">
      <div className="flex items-center justify-between px-6 py-6 border-b border-border/30">
        <div>
          <h3 className="font-display font-bold text-lg">Thư viện giọng nói</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Studio Voice Bank</p>
        </div>
        <button 
          onClick={onClone}
          className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-lg shadow-primary/5 group"
          title="Nhân bản giọng mới"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="grid grid-cols-1 gap-4">
          {voices.map((voice) => (
            <div key={voice.id} className="relative group">
              <button
                onClick={() => onSelect(voice.id)}
                className={cn(
                  "w-full p-4 rounded-2xl border transition-all duration-300 text-left glass-card",
                  selectedId === voice.id 
                    ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10" 
                    : "border-border/40 hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                    selectedId === voice.id 
                      ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground scale-110 shadow-lg shadow-primary/20" 
                      : "bg-white/5 text-muted-foreground group-hover:bg-white/10 group-hover:text-primary"
                  )}>
                    <User size={24} strokeWidth={1.5} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={cn(
                        "font-bold text-sm truncate",
                        selectedId === voice.id ? "text-primary" : "text-foreground"
                      )}>{voice.name}</h4>
                      {voice.is_cloned && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-500 border border-amber-500/20">
                          PRO CLONE
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                      {voice.accent} • {voice.gender === "male" ? "Nam" : "Nữ"}
                    </p>
                  </div>

                  {selectedId === voice.id && (
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
              </button>

              {voice.is_cloned && onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(voice.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
