"use client";

import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { 
  Settings as SettingsIcon, 
  Monitor, 
  FolderOpen, 
  Cpu, 
  ShieldCheck, 
  HelpCircle,
  ChevronRight,
  Info,
  Database,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  return (
    <main className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-border/50 flex items-center justify-between px-8 bg-card/10 backdrop-blur-md">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Cài đặt hệ thống</h2>
            <p className="text-sm text-muted-foreground">Tùy chỉnh cấu hình VietVoiceAI</p>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl space-y-8">
            
            {/* General Settings */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-2">Cài đặt chung</h3>
              <div className="bg-card/40 border border-border/50 rounded-[32px] overflow-hidden">
                <SettingItem 
                  icon={Monitor} 
                  label="Giao diện hệ thống" 
                  description="Thay đổi giữa chế độ sáng và tối" 
                  value="Tối (Dark Mode)"
                />
                <SettingItem 
                  icon={FolderOpen} 
                  label="Thư mục lưu trữ" 
                  description="Nơi lưu file .wav và .srt mặc định" 
                  value="E:\VietVoiceAI\backend\outputs"
                />
                <SettingItem 
                  icon={Bell} 
                  label="Thông báo" 
                  description="Âm thanh khi hoàn thành tác vụ" 
                  toggle={true}
                  defaultChecked={true}
                />
              </div>
            </section>

            {/* AI Engine Settings */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-2">Động cơ AI (Piper TTS)</h3>
              <div className="bg-card/40 border border-border/50 rounded-[32px] overflow-hidden">
                <SettingItem 
                  icon={Cpu} 
                  label="Chế độ xử lý" 
                  description="Tối ưu hóa cho CPU của bạn" 
                  value="Intel i5 (Balanced)"
                />
                <SettingItem 
                  icon={Database} 
                  label="Bộ nhớ đệm Model" 
                  description="Xóa cache các model không sử dụng" 
                  actionLabel="Làm sạch"
                />
              </div>
            </section>

            {/* About & Security */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-2">Về ứng dụng</h3>
              <div className="bg-card/40 border border-border/50 rounded-[32px] overflow-hidden">
                <SettingItem 
                  icon={ShieldCheck} 
                  label="Giấy phép (MIT)" 
                  description="Thông tin bản quyền và pháp lý" 
                  actionLabel="Xem chi tiết"
                />
                <SettingItem 
                  icon={Info} 
                  label="Phiên bản" 
                  description="Kiểm tra bản cập nhật mới" 
                  value="v1.0.0 (Stable)"
                />
                <SettingItem 
                  icon={HelpCircle} 
                  label="Hỗ trợ & Hướng dẫn" 
                  description="Xem tài liệu hướng dẫn sử dụng" 
                  actionLabel="Mở Wiki"
                />
              </div>
            </section>

            <div className="p-8 rounded-[32px] bg-primary/10 border border-primary/20 flex items-center justify-between">
              <div>
                <p className="font-bold text-lg mb-1">Dự án mã nguồn mở</p>
                <p className="text-sm text-muted-foreground">VietVoiceAI là một dự án hoàn toàn miễn phí và tôn trọng quyền riêng tư của bạn.</p>
              </div>
              <button className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:scale-105 transition-transform">
                Ghé thăm GitHub
              </button>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

function SettingItem({ icon: Icon, label, description, value, actionLabel, toggle, defaultChecked }: any) {
  return (
    <div className="flex items-center justify-between p-6 hover:bg-card/60 transition-colors border-b border-border/50 last:border-0 group cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          <Icon size={24} />
        </div>
        <div>
          <p className="font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {value && <span className="text-sm font-medium text-muted-foreground">{value}</span>}
        {actionLabel && (
          <button className="px-3 py-1.5 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary text-xs font-bold transition-all">
            {actionLabel}
          </button>
        )}
        {toggle && (
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked={defaultChecked} />
            <div className="w-11 h-6 bg-muted rounded-full peer peer-focus:ring-4 peer-focus:ring-primary/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        )}
        {!toggle && !actionLabel && <ChevronRight size={18} className="text-muted-foreground" />}
      </div>
    </div>
  );
}
