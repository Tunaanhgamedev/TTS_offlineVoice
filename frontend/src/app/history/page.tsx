"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ttsApi, HistoryItem } from "@/lib/api";
import { 
  Play, 
  Download, 
  FileText, 
  Calendar, 
  Mic2,
  Search,
  RefreshCw,
  MoreVertical,
  History,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await ttsApi.getHistory();
      setHistory(data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(item => 
    item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.voice_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bản ghi này?")) return;
    
    try {
      await ttsApi.deleteGeneration(id);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (error: any) {
      console.error("DELETE ERROR:", error.response?.data || error.message);
      alert(`Lỗi khi xóa bản ghi: ${error.response?.data?.detail || "Không rõ nguyên nhân"}`);
    }
  };

  return (
    <main className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-border/50 flex items-center justify-between px-8 bg-card/10 backdrop-blur-md">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Lịch sử chuyển đổi</h2>
            <p className="text-sm text-muted-foreground">Quản lý tất cả các bản ghi âm của bạn</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Tìm kiếm nội dung..." 
                className="pl-10 pr-4 py-2 rounded-xl bg-muted/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={fetchHistory}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
              title="Làm mới"
            >
              <RefreshCw size={20} className={cn(isLoading && "animate-spin")} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-muted-foreground animate-pulse">Đang tải lịch sử...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 bg-card/30 rounded-3xl border border-dashed border-border p-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <History className="text-muted-foreground" size={32} />
              </div>
              <div>
                <p className="text-lg font-medium">Chưa có dữ liệu lịch sử</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredHistory.map((item) => (
                <div 
                  key={item.id} 
                  className="group p-5 rounded-2xl bg-card/40 border border-border/50 hover:border-primary/50 hover:bg-card/60 transition-all duration-300"
                >
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Mic2 className="text-primary" size={24} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                            item.status === "completed" ? "bg-green-500/10 text-green-500" :
                            item.status === "failed" ? "bg-red-500/10 text-red-500" :
                            "bg-blue-500/10 text-blue-500 animate-pulse"
                          )}>
                            {item.status === "completed" ? "Hoàn thành" : 
                             item.status === "failed" ? "Lỗi" : "Đang xử lý"}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(item.created_at).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="text-muted-foreground hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                            title="Xóa lịch sử"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="font-medium text-lg mb-2 line-clamp-1">{item.text}</h3>
                      <p className="text-sm text-muted-foreground mb-4 italic">Giọng đọc: {item.voice_id}</p>
                      
                      <div className="flex items-center gap-3">
                        {item.status === "completed" && (
                          <>
                            <button 
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 text-sm font-medium"
                              onClick={() => {
                                if (item.audio_url) {
                                  const audio = new Audio(item.audio_url);
                                  audio.play();
                                }
                              }}
                            >
                              <Play size={16} /> Nghe lại
                            </button>
                            <a 
                              href={item.audio_url}
                              download 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-all text-sm font-medium"
                            >
                              <Download size={16} /> Tải Audio
                            </a>
                            {item.srt_url && (
                              <a 
                                href={item.srt_url}
                                download 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-all text-sm font-medium"
                              >
                                <FileText size={16} /> Tải SRT
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
