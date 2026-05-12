"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TextEditor } from "@/components/TextEditor";
import { VoiceSelector } from "@/components/VoiceSelector";
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
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ttsApi, GenerationResponse, Voice } from "@/lib/api";

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
  const [activeTab, setActiveTab] = useState<"text" | "srt">("text");

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

    if (!file || !name) return;

    try {
      setIsGenerating(true);
      await ttsApi.cloneVoice(file, name, gender, accent);
      const updatedVoices = await ttsApi.getVoices();
      setVoices(updatedVoices);
      setShowCloneModal(false);
      setSelectedCloneFile(null);
      setIsGenerating(false);
    } catch (err) {
      alert("Lỗi khi nhân bản giọng nói");
      setIsGenerating(false);
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
          if (statusResponse.status === "completed") {
            setResult(statusResponse);
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

  const [selectedSrtFile, setSelectedSrtFile] = useState<File | null>(null);

  const handleSrtUpload = async (file: File) => {
    setSelectedSrtFile(file);
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const initialResponse = await ttsApi.dubSrt(file, selectedVoice, speed);
      
      const pollStatus = async (taskId: string, retryCount = 0) => {
        try {
          const statusResponse = await ttsApi.getTaskStatus(taskId);
          if (statusResponse.status === "completed") {
            setResult(statusResponse);
            setIsGenerating(false);
            setSelectedSrtFile(null);
          } else if (statusResponse.status === "failed") {
            setError(statusResponse.error_message || "Xử lý SRT thất bại");
            setIsGenerating(false);
          } else {
            // Wait and poll again
            setTimeout(() => pollStatus(taskId), 2000);
          }
        } catch (err) {
          if (retryCount < 3) {
            // Retry if it's a temporary network glitch
            setTimeout(() => pollStatus(taskId, retryCount + 1), 2000);
          } else {
            setError("Mất kết nối với Server khi đang xử lý. Hãy kiểm tra trạng thái Task.");
            setIsGenerating(false);
          }
        }
      };

      pollStatus(initialResponse.id);
    } catch (err) {
      setError("Không thể nạp file SRT lên Server.");
      setIsGenerating(false);
    }
  };

  return (
    <main className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* 1. Sidebar */}
      <Sidebar />

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full -ml-32 -mb-32" />

        <div className="flex-1 p-8 overflow-y-auto z-10">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Tạo Voice AI mới</h2>
              <p className="text-muted-foreground">Chuyển đổi văn bản thành giọng đọc chuyên nghiệp với Piper & Whisper.</p>
            </div>
            <button className="p-3 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all">
              <Settings2 size={20} />
            </button>
          </header>

          <div className="grid grid-cols-12 gap-8 h-[calc(100%-120px)]">
            <div className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
              <TextEditor 
                value={text} 
                onChange={setText} 
                onSrtUpload={handleSrtUpload} 
                selectedFileName={selectedSrtFile?.name}
              />
            </div>

            {/* Right: Controls & Voice Selection */}
            <div className="col-span-12 lg:col-span-5 xl:col-span-4 flex flex-col gap-8">
              {/* Voice Selection Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" />
                    Chọn giọng đọc
                  </h3>
                  <button className="text-xs text-primary hover:underline flex items-center gap-1">
                    Xem tất cả <ChevronRight size={12} />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                <VoiceSelector 
                  voices={voices}
                  selectedId={selectedVoice} 
                  onSelect={setSelectedVoice} 
                  onClone={() => setShowCloneModal(true)}
                />
              </div>
              </section>

              {/* Advanced Settings */}
              <section className="p-6 rounded-3xl bg-card/20 border border-border/50 backdrop-blur-sm">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                  <Settings2 size={16} className="text-primary" />
                  Cấu hình âm thanh
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs mb-3 font-medium">
                      <span className="text-muted-foreground">Tốc độ (Speed)</span>
                      <span className="text-primary">{speed}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2.0" 
                      step="0.1" 
                      value={speed}
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <FileText size={16} />
                      </div>
                      <span className="text-sm font-medium">Tự động tạo Subtitle (SRT)</span>
                    </div>
                    <div className="w-10 h-5 bg-primary rounded-full relative">
                       <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                </div>
              </section>

            {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!text || isGenerating}
                className={cn(
                  "mt-auto w-full py-5 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300",
                  isGenerating 
                    ? "bg-muted text-muted-foreground cursor-wait" 
                    : "bg-primary text-primary-foreground hover:scale-[1.02] shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:grayscale"
                )}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Play size={20} fill="currentColor" />
                    BẮT ĐẦU GENERATE
                  </>
                )}
              </button>

              {error && (
                <div className="mt-4 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={18} className="shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Output Section (Floating Bottom) */}
        {result && (
           <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-20 animate-in slide-in-from-bottom-8 duration-500">
             <div className="glass-card p-6 rounded-[2rem] flex items-center justify-between gap-8">
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
            <div className="glass-card p-8 rounded-[2.5rem] w-full max-w-md border border-primary/20 shadow-2xl shadow-primary/10 animate-in zoom-in-95 duration-300">
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
      </div>
    </main>
  );
}
