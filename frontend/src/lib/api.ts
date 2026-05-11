import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export interface Voice {
  id: string;
  name: string;
  gender: string;
  accent: string;
  is_cloned: boolean;
}

export interface GenerationResponse {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  audio_url?: string;
  srt_url?: string;
  error_message?: string;
}

export const ttsApi = {
  getVoices: async (): Promise<Voice[]> => {
    const response = await api.get("/voices");
    return response.data;
  },
  
  generate: async (text: string, voiceId: string, speed: number): Promise<GenerationResponse> => {
    // Backend expects 'voice', not 'voice_id' in GenerateRequest model
    const response = await api.post("/generate", { text, voice: voiceId, speed });
    return response.data;
  },
  
  dubSrt: async (file: File, voiceId: string, speed: number): Promise<GenerationResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    // Backend expects 'voice', not 'voice_id' in dub_srt Form fields
    formData.append("voice", voiceId);
    formData.append("speed", speed.toString());
    
    const response = await api.post("/dub-srt", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },
  
  getTaskStatus: async (taskId: string): Promise<GenerationResponse> => {
    const response = await api.get(`/task/${taskId}`);
    return response.data;
  },

  cloneVoice: async (file: File, name: string, gender: string, accent: string): Promise<{id: string, name: string}> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);
    formData.append("gender", gender);
    formData.append("accent", accent);
    
    const response = await api.post("/clone-voice", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },

  getHistory: async (): Promise<HistoryItem[]> => {
    const response = await api.get("/generations");
    return response.data;
  },

  getStats: async (): Promise<any> => {
    const response = await api.get("/stats");
    return response.data;
  }
};

export interface HistoryItem {
  id: string;
  text: string;
  voice_id: string;
  status: string;
  created_at: string;
  audio_path?: string;
  srt_path?: string;
}
