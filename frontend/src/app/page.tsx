"use client";

import React, { useState, useEffect } from "react";
import { VoiceSelector } from "@/components/VoiceSelector";
import VoiceVisualizer from "@/components/VoiceVisualizer";
import { 
  Play, 
  Settings2, 
  ChevronRight, 
  Sparkles,
  Download,
  FileAudio,
  FileText,
  Upload,
  Check,
  AlertCircle,
  History,
  Zap,
  Volume2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ttsApi, GenerationResponse, Voice } from "@/lib/api";

import { Sidebar } from "@/components/Sidebar";

export default function Home() {
  const [text, setText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("vi_VN-hoai_bao-medium");
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [formant, setFormant] = useState(1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [selectedCloneFile, setSelectedCloneFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Đang xử lý...");
  const [history, setHistory] = useState<any[]>([]);

  // Fetch voices on mount
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const data = await ttsApi.getVoices();
        setVoices(data);
        if (data.length > 0) setSelectedVoice(data[0].id);
      } catch (err) {
        console.error("Failed to fetch voices", err);
        setVoices([
          { id: "vi_VN-hoai_bao-medium", name: "Hoài Bảo", gender: "male", accent: "Miền Bắc", is_cloned: false },
          { id: "vi_VN-nam_minh-medium", name: "Nam Minh", gender: "male", accent: "Miền Bắc", is_cloned: false },
        ]);
      }
    };
    fetchVoices();
  }, []);

  const handleClone = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const gender = formData.get("gender") as string;
    const accent = formData.get("accent") as string;
    const refText = formData.get("ref_text") as string;

    if (!file || !name) return;

    try {
      setIsGenerating(true);
      const newVoice = await ttsApi.cloneVoice(file, name, gender, accent, refText);
      const updatedVoices = await ttsApi.getVoices();
      setVoices(updatedVoices);
      setSelectedVoice(newVoice.id); // Auto-select the new voice
      setShowCloneModal(false);
      setSelectedCloneFile(null);
      setIsGenerating(false);
    } catch (err) {
      alert("Lỗi khi nhân bản giọng nói");
      setIsGenerating(false);
    }
  };

  const handleDeleteVoice = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa giọng nói này?")) return;
    try {
      await ttsApi.deleteVoice(id);
      const updatedVoices = await ttsApi.getVoices();
      setVoices(updatedVoices);
      if (selectedVoice === id && updatedVoices.length > 0) {
        setSelectedVoice(updatedVoices[0].id);
      }
    } catch (err) {
      alert("Lỗi khi xóa giọng nói");
    }
  };

  const handleGenerate = async () => {
    if (!text) return;
    
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const initialResponse = await ttsApi.generate(text, selectedVoice, speed, pitch, formant);

      // Polling for status
      const pollStatus = async (taskId: string) => {
        try {
          const statusResponse = await ttsApi.getTaskStatus(taskId);
          
          if (statusResponse.status.startsWith("processing:")) {
             setStatusMessage(statusResponse.status.replace("processing: ", ""));
          }

          if (statusResponse.status === "completed") {
            setResult(statusResponse);
            setHistory(prev => [{...statusResponse, text: text, created_at: new Date().toISOString()}, ...prev]);
            setIsGenerating(false);
          } else if (statusResponse.status === "failed") {
            setError(statusResponse.error_message || "Generation failed");
            setIsGenerating(false);
          } else {
            // Keep polling
            setTimeout(() => pollStatus(taskId), 2000);
          }
        } catch (err) {
          setError("Lỗi khi kiểm tra trạng thái tác vụ");
          setIsGenerating(false);
        }
      };

      pollStatus(initialResponse.id);
    } catch (err) {
      setError("Không thể kết nối tới Backend. Hãy đảm bảo Server đang chạy.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto pb-20 selection:bg-primary selection:text-primary-foreground custom-scrollbar relative">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />
        </div>

        {/* Header */}
        <header className="border-b border-border/50 bg-background/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Volume2 className="text-primary-foreground" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold tracking-tight">
                  VietVoice<span className="text-primary">AI</span>
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary/20 text-primary rounded-md border border-primary/20">PRO</span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Offline Studio V1.0</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-full text-sm font-bold transition-all duration-300">
                <Zap size={16} />
                Upgrade Plan
              </button>
            </div>
          </div>
        </header>

      <div className="container mx-auto px-6 pt-12">
        <div className="grid grid-cols-12 gap-8">
          
          {/* Left Column: Input & Controls (Bento Style) */}
          <div className="col-span-12 lg:col-span-7 space-y-8">
            
            {/* 1. Main Editor Card */}
            <div className="glass rounded-[2rem] p-8 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles size={16} className="text-primary" />
                  </div>
                  <h2 className="text-lg font-display font-bold">Studio Editor</h2>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <span>{text.length} ký tự</span>
                  <div className="w-1 h-1 rounded-full bg-border" />
                  <span>Ước tính: {Math.ceil(text.length / 15)} giây</span>
                </div>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Nhập nội dung bạn muốn chuyển thành giọng nói tại đây..."
                className="w-full bg-transparent text-lg md:text-xl font-medium placeholder:text-muted-foreground/30 min-h-[320px] outline-none resize-none custom-scrollbar"
              />

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-8 border-t border-border/30">
                <div className="flex items-center gap-4">
                  <VoiceVisualizer isActive={isGenerating} />
                  {isGenerating && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">{statusMessage}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !text}
                  className="relative group disabled:opacity-50"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                  <div className="relative flex items-center gap-3 px-10 py-4 bg-background rounded-full leading-none flex items-center divide-x divide-border/50">
                    <span className="flex items-center gap-2 text-primary group-hover:text-primary transition duration-200 font-bold tracking-tight">
                      {isGenerating ? "ĐANG XỬ LÝ..." : "BẮT ĐẦU GENERATE"}
                    </span>
                    <span className="pl-3 text-muted-foreground group-hover:text-primary transition duration-200">
                      <Play size={18} />
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Advanced Controls Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card rounded-[2rem] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Settings2 size={18} className="text-primary" />
                  <h3 className="font-bold text-sm">Cấu hình âm thanh</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tốc độ (Speed)</label>
                      <span className="text-xs font-bold text-primary">{speed}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={speed}
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      className="w-full accent-primary h-1.5 bg-border/40 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cao độ (Pitch)</label>
                      <span className="text-xs font-bold text-secondary">{pitch}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.05"
                      value={pitch}
                      onChange={(e) => setPitch(parseFloat(e.target.value))}
                      className="w-full accent-secondary h-1.5 bg-border/40 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-[2rem] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles size={18} className="text-accent" />
                    <h3 className="font-bold text-sm">Trình tinh chỉnh (Formant)</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Điều chỉnh Formant giúp giọng nói nghe "nữ tính" hoặc "nam tính" hơn mà không thay đổi cao độ gốc.
                  </p>
                </div>
                
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Âm sắc</span>
                    <span className="text-xs font-bold text-accent">V{formant}</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.2"
                    step="0.02"
                    value={formant}
                    onChange={(e) => setFormant(parseFloat(e.target.value))}
                    className="w-full accent-accent h-1.5 bg-border/40 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Voices & History */}
          <div className="col-span-12 lg:col-span-5 space-y-8">
            
            {/* Voice Selector Section */}
            <div className="glass rounded-[2rem] h-[640px] flex flex-col">
              <VoiceSelector 
                voices={voices}
                selectedId={selectedVoice} 
                onSelect={setSelectedVoice} 
                onClone={() => setShowCloneModal(true)}
                onDelete={handleDeleteVoice}
              />
            </div>

            {/* Recent Tasks Card */}
            <div className="glass-card rounded-[2rem] p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <History size={18} className="text-primary" />
                  <h3 className="font-bold text-sm">Lịch sử gần đây</h3>
                </div>
                <button className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
                  Xem tất cả
                </button>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {history.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground italic">
                    Chưa có lịch sử chuyển đổi nào...
                  </div>
                ) : (
                  history.slice(0, 5).map((task) => (
                    <div key={task.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-primary/70 uppercase tracking-tighter">TASK #{task.id.slice(0, 8)}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(task.created_at).toLocaleTimeString("vi-VN")}</span>
                      </div>
                      <p className="text-xs font-medium line-clamp-1 text-foreground/80 mb-3">{task.text}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${task.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`} />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{task.status}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Output Section (Floating Bottom) */}
      {result && (
         <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-50 animate-in slide-in-from-bottom-8 duration-500">
           <div className="glass p-6 rounded-[2rem] flex items-center justify-between gap-8 border border-primary/20">
             <div className="flex items-center gap-4 flex-1">
               <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                 <FileAudio size={24} />
               </div>
               <div className="flex-1">
                 <p className="text-sm font-semibold truncate">Kết quả âm thanh - {result.id.slice(0, 8)}</p>
                 <div className="flex items-center gap-2 mt-1">
                    <audio controls className="h-8 w-full accent-primary" key={result.audio_url}>
                      <source src={result.audio_url} type="audio/wav" />
                    </audio>
                 </div>
               </div>
             </div>
             
             <div className="flex items-center gap-3">
               {result.srt_url && (
                 <a 
                   href={result.srt_url}
                   download
                   className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
                 >
                   <FileText size={18} />
                   Tải SRT
                 </a>
               )}
               <a 
                 href={result.audio_url}
                 download
                 className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
               >
                 <Download size={18} />
                 Tải Audio
               </a>
             </div>
           </div>
         </div>
      )}

      {/* 4. Clone Voice Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass p-8 rounded-[2.5rem] w-full max-w-md border border-primary/20 shadow-2xl shadow-primary/10 animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-bold mb-2">Nhân bản giọng mới</h2>
            <p className="text-muted-foreground text-sm mb-6">Tải lên file mẫu (10-30s) để AI học âm sắc.</p>
            
            <form onSubmit={handleClone} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground ml-1">TÊN GIỌNG ĐỌC</label>
                <input name="name" required placeholder="VD: Ngọc Huyền Vbee" className="w-full bg-card/20 border border-border/50 rounded-2xl px-5 py-3 focus:border-primary outline-none transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground ml-1">GIỚI TÍNH</label>
                  <select name="gender" className="w-full bg-card/20 border border-border/50 rounded-2xl px-5 py-3 focus:border-primary outline-none appearance-none">
                    <option value="female">Nữ</option>
                    <option value="male">Nam</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground ml-1">VÙNG MIỀN</label>
                  <select name="accent" className="w-full bg-card/20 border border-border/50 rounded-2xl px-5 py-3 focus:border-primary outline-none appearance-none">
                    <option value="Miền Bắc">Miền Bắc</option>
                    <option value="Miền Nam">Miền Nam</option>
                    <option value="Miền Trung">Miền Trung</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground ml-1">NỘI DUNG TRONG FILE MẪU (BẮT BUỘC)</label>
                <textarea 
                  name="ref_text" 
                  placeholder="Nhập chính xác những gì người trong file âm thanh nói..." 
                  className="w-full bg-card/20 border border-border/50 rounded-2xl px-5 py-3 focus:border-primary outline-none transition-colors min-h-[80px] text-sm resize-none"
                  required
                />
                <p className="text-[10px] text-red-400 font-bold leading-tight bg-red-400/10 p-2 rounded-lg border border-red-400/20">
                  ⚠️ QUAN TRỌNG: Chỉ nhập lời thoại CÓ TRONG FILE MẪU. Không nhập nội dung bạn muốn AI đọc vào đây.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground ml-1">FILE ÂM THANH MẪU (WAV/MP3)</label>
                  <label className={cn(
                    "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-3xl cursor-pointer transition-all",
                    selectedCloneFile 
                      ? "border-primary bg-primary/5" 
                      : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
                  )}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                      {selectedCloneFile ? (
                        <>
                          <div className="p-2 rounded-full bg-primary/20 text-primary mb-2">
                             <Check size={20} />
                          </div>
                          <p className="text-xs font-medium text-primary truncate max-w-full">{selectedCloneFile.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{(selectedCloneFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <p className="text-xs text-muted-foreground text-center">Kéo thả hoặc nhấn để chọn file mẫu</p>
                        </>
                      )}
                    </div>
                    <input 
                      name="file" 
                      type="file" 
                      required 
                      accept="audio/*" 
                      className="hidden" 
                      onChange={(e) => setSelectedCloneFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowCloneModal(false);
                      setSelectedCloneFile(null);
                    }} 
                    className="flex-1 py-4 rounded-2xl bg-muted hover:bg-muted/80 font-bold transition-colors"
                  >
                    HỦY
                  </button>
                  <button 
                    type="submit" 
                    disabled={!selectedCloneFile || isGenerating}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-bold transition-all shadow-lg",
                      isGenerating || !selectedCloneFile
                        ? "bg-muted text-muted-foreground cursor-wait"
                        : "bg-primary text-primary-foreground hover:opacity-90 shadow-primary/20"
                    )}
                  >
                    {isGenerating ? "ĐANG XỬ LÝ..." : "BẮT ĐẦU CLONE"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
