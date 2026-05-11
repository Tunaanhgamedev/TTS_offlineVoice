"use client";

import React, { useState, useCallback } from "react";
import { Copy, Trash2, FileText, Wand2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export const TextEditor = ({ 
  value, 
  onChange, 
  onSrtUpload,
  selectedFileName
}: { 
  value: string, 
  onChange: (val: string) => void,
  onSrtUpload?: (file: File) => void,
  selectedFileName?: string
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
    const estimatedDuration = Math.ceil(wordCount / 150);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.name.endsWith('.srt') && onSrtUpload) {
            onSrtUpload(file);
        }
    }, [onSrtUpload]);
  
    return (
      <div 
        className={cn(
            "flex flex-col h-full bg-card/10 rounded-3xl border transition-all duration-300 overflow-hidden group relative",
            isDragging ? "border-primary bg-primary/5 scale-[1.01] shadow-2xl shadow-primary/10" : "border-border/50 focus-within:border-primary/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-primary/10 backdrop-blur-sm pointer-events-none animate-in fade-in duration-200">
                <Upload size={48} className="text-primary mb-4 animate-bounce" />
                <p className="text-lg font-bold text-primary">Thả file SRT vào đây để lồng tiếng</p>
            </div>
        )}

        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-card/5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText size={16} />
              <span>Văn bản đầu vào</span>
            </div>
            
            {onSrtUpload && (
              <label className={cn(
                  "flex items-center gap-2 text-xs px-4 py-2 rounded-full cursor-pointer transition-all font-bold shadow-sm",
                  selectedFileName 
                    ? "bg-primary text-primary-foreground animate-pulse shadow-primary/20" 
                    : "bg-primary/10 text-primary hover:bg-primary/20"
              )}>
                <Upload size={12} />
                {selectedFileName ? `Đã chọn: ${selectedFileName}` : "Tải lên SRT"}
              <input 
                type="file" 
                accept=".srt" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onSrtUpload(file);
                }}
              />
            </label>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
                navigator.clipboard.writeText(value);
                // Simple toast could go here
            }}
            className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-90"
            title="Sao chép"
          >
            <Copy size={16} />
          </button>
          <button 
            onClick={() => onChange("")}
            className="p-2.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all active:scale-90"
            title="Xóa hết"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Nhập văn bản tiếng Việt hoặc kéo thả file SRT vào đây..."
        className="flex-1 p-8 bg-transparent resize-none focus:outline-none text-lg leading-relaxed placeholder:text-muted-foreground/30 font-light"
      />

      <div className="px-6 py-4 border-t border-border/30 bg-card/5 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="font-medium">{wordCount} từ</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span className="font-medium">Ước tính: ~{estimatedDuration} phút</span>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all font-bold active:scale-95 shadow-sm">
          <Wand2 size={12} />
          Chuẩn hóa văn bản
        </button>
      </div>
    </div>
  );
};
