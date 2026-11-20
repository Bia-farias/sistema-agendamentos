import React, { useState } from 'react';
import { CheckCheck, Smartphone, Eye, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../stores/authStore';

interface WhatsAppBubblePreviewProps {
  content: string;
  templateName?: string;
  sampleData?: {
    cliente_nome?: string;
    empresa?: string;
    data?: string;
    horario?: string;
    servico?: string;
    profissional?: string;
  };
}

export function WhatsAppBubblePreview({
  content,
  templateName = 'Modelo de Mensagem',
  sampleData,
}: WhatsAppBubblePreviewProps) {
  const { tenant } = useAuthStore();
  const [showSampleData, setShowSampleData] = useState(true);

  const effectiveSampleData = {
    cliente_nome: sampleData?.cliente_nome || 'Cliente',
    empresa: sampleData?.empresa || tenant?.name || 'Sua Empresa',
    data: sampleData?.data || '10/09/2026',
    horario: sampleData?.horario || '15:30',
    servico: sampleData?.servico || 'Corte & Escova',
    profissional: sampleData?.profissional || 'Profissional',
  };

  // Replace tags with sample data if toggle is on
  let displayContent = content;
  if (showSampleData) {
    displayContent = displayContent
      .replace(/{cliente_nome}/g, effectiveSampleData.cliente_nome)
      .replace(/{empresa}/g, effectiveSampleData.empresa)
      .replace(/{data}/g, effectiveSampleData.data)
      .replace(/{horario}/g, effectiveSampleData.horario)
      .replace(/{servico}/g, effectiveSampleData.servico)
      .replace(/{profissional}/g, effectiveSampleData.profissional);
  }

  // Format WhatsApp markdown: *bold* -> <strong>, _italic_ -> <em>
  const formatWhatsAppText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      // Regex replace *bold*
      const parts = line.split(/(\*[^*]+\*)/g);
      return (
        <React.Fragment key={lineIdx}>
          {parts.map((part, partIdx) => {
            if (part.startsWith('*') && part.endsWith('*')) {
              return (
                <strong key={partIdx} className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {part.slice(1, -1)}
                </strong>
              );
            }
            return part;
          })}
          {lineIdx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="flex flex-col bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-xl max-w-sm w-full mx-auto select-none">
      {/* Phone Header */}
      <div className="bg-[#128C7E] dark:bg-[#075E54] text-white px-3 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-white/30">
            {tenant?.name ? tenant.name.substring(0, 2).toUpperCase() : 'AI'}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold leading-tight truncate">
              {tenant?.name || 'Sua Empresa'}
            </p>
            <p className="text-[10px] text-emerald-100/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              Online • WhatsApp Business
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowSampleData(!showSampleData)}
          className={cn(
            'flex items-center gap-1 text-[10px] px-2 py-1 rounded-md font-medium transition-colors',
            showSampleData
              ? 'bg-white text-[#075E54] shadow-sm font-semibold'
              : 'bg-white/10 text-white hover:bg-white/20'
          )}
          title="Alternar dados de exemplo"
        >
          <Sparkles size={11} />
          {showSampleData ? 'Exemplo Real' : 'Tags Brutas'}
        </button>
      </div>

      {/* Chat Background & Content */}
      <div
        className="p-3.5 min-h-[220px] flex flex-col justify-end relative overflow-y-auto"
        style={{
          backgroundColor: '#0b141a',
          backgroundImage: `radial-gradient(#1f2c34 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
        }}
      >
        {/* Date Stamp */}
        <div className="flex justify-center mb-3">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#182229] text-zinc-400 shadow-sm border border-zinc-700/40">
            Hoje
          </span>
        </div>

        {/* Bubble */}
        <div className="self-end max-w-[90%] bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tr-xs p-3 text-xs leading-relaxed shadow-md border border-[#005c4b]/50 relative group">
          <div className="break-words whitespace-pre-wrap font-sans">
            {formatWhatsAppText(displayContent)}
          </div>

          {/* Timestamp and Double Check */}
          <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] text-[#8696a0]">
            <span>10:30</span>
            <CheckCheck size={14} className="text-[#53bdeb]" />
          </div>
        </div>
      </div>

      {/* Preview Footer note */}
      <div className="bg-[#182229] border-t border-zinc-800 px-3 py-1.5 text-[10px] text-zinc-400 flex items-center justify-between">
        <span className="truncate">{templateName}</span>
        <span className="text-zinc-500 font-mono text-[9px]">Preview Interativo</span>
      </div>
    </div>
  );
}
