import React from "react";
import { User, Mic, Plus, Check } from "lucide-react";
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
  onClone
}: { 
  voices: Voice[], 
  selectedId: string, 
  onSelect: (id: string) => void,
  onClone?: () => void
}) => {
  return (
    <section className="flex flex-col h-full bg-card/10 rounded-3xl border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-card/5">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Mic size={16} />
          <span>Chọn giọng đọc</span>
        </div>
        <button 
          onClick={onClone}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <Plus size={14} />
          Nhân bản giọng mới
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {voices.map((voice) => (
            <button
              key={voice.id}
              onClick={() => onSelect(voice.id)}
              className={cn(
                "group relative p-4 rounded-2xl border transition-all duration-300 text-left overflow-hidden",
                selectedId === voice.id 
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/5" 
                  : "border-border/40 bg-card/20 hover:border-primary/40 hover:bg-card/30"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300",
                  selectedId === voice.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                )}>
                  <User size={20} />
                </div>
                {selectedId === voice.id && (
                  <div className="bg-primary text-primary-foreground p-1 rounded-full">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
                {voice.is_cloned && (
                  <div className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-tighter bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20">
                    CLONED
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-bold text-sm truncate">{voice.name}</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mt-0.5">
                  {voice.accent} • {voice.gender === "male" ? "NAM" : "NỮ"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
