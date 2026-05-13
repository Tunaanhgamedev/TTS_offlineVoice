"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ttsApi, Voice } from "@/lib/api";
import { 
  Volume2, 
  Plus, 
  Trash2, 
  Info, 
  Play,
  Upload,
  UserPlus,
  BadgeCheck,
  Languages
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function VoicesPage() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloning, setIsCloning] = useState(false);
  const [newVoice, setNewVoice] = useState({ name: "", gender: "female", accent: "Miền Bắc" });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const fetchVoices = async () => {
    setIsLoading(true);
    try {
      const data = await ttsApi.getVoices();
      setVoices(data);
    } catch (error) {
      console.error("Failed to fetch voices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVoices();
  }, []);

  const handleClone = async () => {
    if (!audioFile || !newVoice.name) return;
    setIsCloning(true);
    try {
      await ttsApi.cloneVoice(audioFile, newVoice.name, newVoice.gender, newVoice.accent);
      fetchVoices();
      setAudioFile(null);
      setNewVoice({ name: "", gender: "female", accent: "Miền Bắc" });
      alert("Nhân bản giọng nói thành công!");
    } catch (error) {
      alert("Lỗi khi nhân bản giọng nói.");
    } finally {
      setIsCloning(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa giọng nói này?")) return;
    try {
      await ttsApi.deleteVoice(id);
      fetchVoices();
    } catch (error) {
      alert("Lỗi khi xóa giọng nói.");
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa TẤT CẢ giọng clone? Thao tác này không thể hoàn tác!")) return;
    try {
      await ttsApi.deleteAllVoices();
      fetchVoices();
    } catch (error) {
      alert("Lỗi khi xóa tất cả giọng clone.");
    }
  };

  const handlePlaySample = async (voice: Voice) => {
    if (playingId === voice.id) {
      audio?.pause();
      setPlayingId(null);
      return;
    }

    setPlayingId(voice.id);
    try {
      const sampleText = `Xin chào, tôi là ${voice.name}, một giọng nói AI được nhân bản thành công trên hệ thống Viet Voice A I.`;
      const response = await ttsApi.generate(sampleText, voice.id, 1.0);
      
      // Poll for completion
      let status = response.status;
      let finalResponse = response;
      while (status === "queued" || status === "processing") {
        await new Promise(r => setTimeout(r, 1000));
        finalResponse = await ttsApi.getTaskStatus(response.id);
        status = finalResponse.status;
      }

      if (finalResponse.audio_url) {
        const newAudio = new Audio(finalResponse.audio_url);
        newAudio.onended = () => setPlayingId(null);
        newAudio.play();
        setAudio(newAudio);
      }
    } catch (error) {
      console.error("Failed to play sample:", error);
      setPlayingId(null);
    }
  };

  return (
    <main className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-border/50 flex items-center justify-between px-8 bg-card/10 backdrop-blur-md">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Thư viện giọng nói</h2>
            <p className="text-sm text-muted-foreground">Quản lý và nhân bản giọng nói AI</p>
          </div>
          
          <button 
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            onClick={() => {
              const el = document.getElementById('clone-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <UserPlus size={20} /> Nhân bản mới
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-12">
          
          {/* Voice Grid */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Volume2 className="text-primary" size={24} /> Giọng nói hiện có
              </h3>
              {voices.some(v => v.is_cloned) && (
                <button 
                  onClick={handleDeleteAll}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 text-destructive font-medium hover:bg-destructive hover:text-white transition-all text-sm"
                >
                  <Trash2 size={16} /> Xóa tất cả giọng clone
                </button>
              )}
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 rounded-3xl bg-muted/50 animate-pulse border border-border/50" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {voices.map((voice) => (
                  <div 
                    key={voice.id} 
                    className="group relative p-6 rounded-3xl bg-card/40 border border-border/50 hover:border-primary/50 hover:bg-card/60 transition-all duration-300"
                  >
                    {voice.is_cloned && (
                      <div className="absolute top-4 right-4 px-2 py-1 rounded-lg bg-primary/10 text-[10px] font-bold text-primary flex items-center gap-1">
                        <BadgeCheck size={12} /> CLONED
                      </div>
                    )}
                    
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Volume2 size={28} />
                    </div>
                    
                    <h4 className="text-xl font-bold mb-1">{voice.name}</h4>
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                        {voice.gender === "female" ? "Nữ" : "Nam"}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-secondary text-muted-foreground flex items-center gap-1">
                        <Languages size={10} /> {voice.accent}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handlePlaySample(voice)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all font-medium text-sm",
                          playingId === voice.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-primary/20 hover:text-primary"
                        )}
                      >
                        {playingId === voice.id ? (
                           <>
                             <div className="flex gap-1">
                               <div className="w-1 h-3 bg-current animate-[bounce_1s_infinite_0ms]" />
                               <div className="w-1 h-3 bg-current animate-[bounce_1s_infinite_200ms]" />
                               <div className="w-1 h-3 bg-current animate-[bounce_1s_infinite_400ms]" />
                             </div>
                             Đang phát
                           </>
                        ) : (
                          <><Play size={16} /> Nghe thử</>
                        )}
                      </button>
                      {voice.is_cloned && (
                        <button 
                          onClick={() => handleDelete(voice.id)}
                          className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Clone Section */}
          <section id="clone-section" className="p-10 rounded-[40px] bg-primary/5 border border-primary/20 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 grid lg:grid-cols-2 gap-12">
              <div>
                <h3 className="text-3xl font-bold mb-4">Nhân bản giọng nói AI</h3>
                <p className="text-muted-foreground mb-8 text-lg">
                  Chỉ cần một đoạn âm thanh mẫu 10-30 giây, công nghệ AI của chúng tôi sẽ học cách nói giống hệt như người thật.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-background/50 border border-border/50">
                    <div className="p-2 rounded-lg bg-green-500/10 text-green-500"><BadgeCheck size={20} /></div>
                    <p className="text-sm">
                      <span className="font-bold text-primary block mb-1">Mẹo hay:</span>
                      Đặt tên giọng nói là <code className="bg-primary/10 px-1 rounded">Ngọc Huyền</code> hoặc <code className="bg-primary/10 px-1 rounded">Mạnh Dũng</code> để kích hoạt chế độ tối ưu Neural AI chuyên sâu.
                    </p>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-background/50 border border-border/50">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><Upload size={20} /></div>
                    <p className="text-sm">Hỗ trợ các định dạng .mp3, .wav, .m4a. Thời lượng khuyên dùng: 30-60 giây.</p>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-background shadow-2xl border border-border/50">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Tên giọng đọc</label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: Giọng chị Lan, Anh Nam..."
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                      value={newVoice.name}
                      onChange={(e) => setNewVoice({...newVoice, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Giới tính</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border outline-none"
                        value={newVoice.gender}
                        onChange={(e) => setNewVoice({...newVoice, gender: e.target.value})}
                      >
                        <option value="female">Nữ</option>
                        <option value="male">Nam</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Vùng miền</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border outline-none"
                        value={newVoice.accent}
                        onChange={(e) => setNewVoice({...newVoice, accent: e.target.value})}
                      >
                        <option value="Miền Bắc">Miền Bắc</option>
                        <option value="Miền Nam">Miền Nam</option>
                        <option value="Miền Trung">Miền Trung</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Âm thanh mẫu</label>
                    <div 
                      className={cn(
                        "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer",
                        audioFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted"
                      )}
                      onClick={() => document.getElementById('audio-upload')?.click()}
                    >
                      <input 
                        type="file" 
                        id="audio-upload" 
                        className="hidden" 
                        accept="audio/*"
                        onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                      />
                      <Upload className={cn("mb-3", audioFile ? "text-primary" : "text-muted-foreground")} size={32} />
                      <p className="font-medium text-center">{audioFile ? audioFile.name : "Kéo thả hoặc nhấn để chọn file"}</p>
                    </div>
                  </div>

                  <button 
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl",
                      audioFile && newVoice.name 
                        ? "bg-primary text-primary-foreground shadow-primary/20 hover:scale-[1.02]" 
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                    disabled={isCloning || !audioFile || !newVoice.name}
                    onClick={handleClone}
                  >
                    {isCloning ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="animate-spin" size={20} /> Đang nhân bản...
                      </span>
                    ) : "Bắt đầu nhân bản ngay"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
