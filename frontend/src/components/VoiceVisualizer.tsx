import React from 'react';

const VoiceVisualizer = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex items-end gap-1 h-12 px-4 py-2 bg-primary/5 rounded-2xl border border-primary/10 overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-primary rounded-full transition-all duration-300 ${isActive ? 'animate-bounce' : 'h-2 opacity-30'}`}
          style={{
            height: isActive ? `${Math.random() * 100}%` : '8px',
            animationDelay: `${i * 0.05}s`,
            animationDuration: `${0.5 + Math.random() * 0.5}s`
          }}
        />
      ))}
    </div>
  );
};

export default VoiceVisualizer;
