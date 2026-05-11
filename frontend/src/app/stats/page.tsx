"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ttsApi } from "@/lib/api";
import { 
  BarChart3, 
  Type, 
  Activity, 
  Mic2,
  TrendingUp,
  Clock,
  CheckCircle2,
  Zap,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsData {
  total_generations: number;
  completed_generations: number;
  total_voices: number;
  total_characters: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await ttsApi.getStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <main className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-border/50 flex items-center justify-between px-8 bg-card/10 backdrop-blur-md">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Thống kê hệ thống</h2>
            <p className="text-sm text-muted-foreground">Phân tích hiệu suất sử dụng AI</p>
          </div>
          <button 
            onClick={fetchStats}
            className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Làm mới
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 rounded-3xl bg-muted/50 animate-pulse border border-border/50" />
              ))}
            </div>
          ) : stats ? (
            <div className="space-y-8">
              {/* Primary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  icon={Type} 
                  label="Tổng ký tự" 
                  value={stats.total_characters.toLocaleString()} 
                  color="bg-blue-500" 
                  sub="Đã được chuyển đổi"
                />
                <StatCard 
                  icon={Activity} 
                  label="Tổng lượt tạo" 
                  value={stats.total_generations.toLocaleString()} 
                  color="bg-primary" 
                  sub="Yêu cầu đã gửi"
                />
                <StatCard 
                  icon={Mic2} 
                  label="Thư viện giọng" 
                  value={stats.total_voices.toLocaleString()} 
                  color="bg-purple-500" 
                  sub="Giọng AI sẵn có"
                />
                <StatCard 
                  icon={CheckCircle2} 
                  label="Tỷ lệ thành công" 
                  value={`${((stats.completed_generations / (stats.total_generations || 1)) * 100).toFixed(1)}%`} 
                  color="bg-green-500" 
                  sub="Hoạt động ổn định"
                />
              </div>

              {/* Insights Grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-8 rounded-[40px] bg-card/40 border border-border/50 relative overflow-hidden group">
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <TrendingUp className="text-primary" size={24} /> Hiệu quả công việc
                    </h3>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="p-6 rounded-3xl bg-background/50 border border-border/50">
                        <Clock className="text-primary mb-4" size={32} />
                        <p className="text-3xl font-bold mb-1">~{Math.round(stats.total_characters / 300)} Phút</p>
                        <p className="text-sm text-muted-foreground">Thời gian audio đã tạo</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-background/50 border border-border/50">
                        <Zap className="text-orange-500 mb-4" size={32} />
                        <p className="text-3xl font-bold mb-1">0.2s</p>
                        <p className="text-sm text-muted-foreground">Độ trễ trung bình</p>
                      </div>
                    </div>
                    <div className="mt-8 p-6 rounded-3xl bg-primary/10 border border-primary/20 flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                        <Award className="text-primary-foreground" size={32} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">Thành tích hôm nay</h4>
                        <p className="text-sm text-muted-foreground">Bạn đã tiết kiệm được khoảng 45 phút so với việc thu âm thủ công.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-[40px] bg-card/40 border border-border/50 flex flex-col items-center justify-center text-center">
                   <div className="w-32 h-32 rounded-full border-8 border-primary/20 border-t-primary flex items-center justify-center relative mb-6">
                      <span className="text-2xl font-bold">75%</span>
                   </div>
                   <h3 className="text-xl font-bold mb-2">Dung lượng bộ nhớ</h3>
                   <p className="text-sm text-muted-foreground mb-8">Hệ thống AI đang sử dụng 1.2GB model trên đĩa cứng.</p>
                   <button className="w-full py-3 rounded-2xl bg-muted hover:bg-muted/80 transition-colors font-semibold">Tối ưu bộ nhớ</button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon: Icon, label, value, color, sub }: any) {
  return (
    <div className="p-6 rounded-[32px] bg-card/40 border border-border/50 group hover:border-primary/50 transition-all duration-300">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg", color)}>
        <Icon size={24} />
      </div>
      <p className="text-sm text-muted-foreground font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60">{sub}</p>
    </div>
  );
}

import { RefreshCw } from "lucide-react";
