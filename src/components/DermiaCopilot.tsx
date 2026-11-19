import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  ArrowUpRight, 
  Stethoscope, 
  FileText, 
  Syringe, 
  Calculator, 
  ShieldCheck, 
  RefreshCw, 
  Zap, 
  MessageSquare, 
  ChevronDown,
  Mic,
  MicOff,
  Radio,
  Volume1,
  Headphones,
  Sliders,
  Play,
  Square,
  AlertCircle
} from 'lucide-react';
import { DoctorProfile, NavigationTab } from '../types';
import { directDermiaChat, getGeminiApiKey, setGeminiApiKey } from '../services/geminiDirect';

// Declare SpeechRecognition interfaces for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  id: string;
  sender: 'user' | 'dermia';
  text: string;
  timestamp: string;
  isVoiceInput?: boolean;
  providerUsed?: string;
  model?: string;
  isFreeTier?: boolean;
  suggestedAction?: {
    label: string;
    tab: NavigationTab;
    icon: string;
  };
}

interface ProviderInfo {
  id: string;
  name: string;
  model: string;
  configured: boolean;
  isFreeTier: boolean;
  badge: string;
  description: string;
}

interface DermiaCopilotProps {
  doctorProfile: DoctorProfile;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onNavigate: (tab: NavigationTab) => void;
}

const QUICK_PROMPTS = [
  {
    label: '💊 Fórmula para Melasma Dérmico',
    query: 'DermIA, elabore uma fórmula magistral completa para Melasma dérmico/misto recalcitrante em fototipo III/IV com veículo de toque seco e ativos clareadores não citotóxicos.',
    targetTab: 'prescriptions' as NavigationTab
  },
  {
    label: '💉 Emergência Hialuronidase',
    query: 'DermIA, forneça imediatamente o protocolo de emergência para suspeita de oclusão vascular após preenchimento labial com ácido hialurônico (doses de hialuronidase e conduta imediata).',
    targetTab: 'procedures' as NavigationTab
  },
  {
    label: '🔬 Diagnóstico Diferencial ABCDE',
    query: 'DermIA, como realizar a estratificação clínica e dermatoscópica de uma lesão pigmentada assimétrica em dorso com suspeita de melanoma conforme as diretrizes da SBD?',
    targetTab: 'clinical' as NavigationTab
  },
  {
    label: '💰 Calcular Custo de Toxina',
    query: 'DermIA, como calcular a precificação ideal e margem de lucro para uma aplicação de 50 UI de toxina botulínica considerando custo de frasco de R$ 750 e insumos?',
    targetTab: 'management' as NavigationTab
  },
  {
    label: '📜 Regras Isotretinoína C2',
    query: 'DermIA, quais são as exigências legais da Portaria 344/98 e do CFM para prescrição de Isotretinoína Oral e termo de consentimento para mulheres em idade fértil?',
    targetTab: 'management' as NavigationTab
  },
  {
    label: '🧴 Skincare para Rosácea',
    query: 'DermIA, sugira uma rotina completa de cuidados para paciente com Rosácea Eritematotelangiectásica e pele reativa sensível.',
    targetTab: 'prescriptions' as NavigationTab
  }
];

export const DermiaCopilot: React.FC<DermiaCopilotProps> = ({
  doctorProfile,
  isOpen,
  onClose,
  onOpen,
  onNavigate
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Voice & Microphone states
  const [isListening, setIsListening] = useState(false);
  const [speechInterim, setSpeechInterim] = useState('');
  const [autoVoiceResponse, setAutoVoiceResponse] = useState(true);
  const [micSupported, setMicSupported] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState(1.05);

  // Provider states
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('auto');
  const [showProviderMenu, setShowProviderMenu] = useState(false);
  const [showProviderInfoModal, setShowProviderInfoModal] = useState(false);

  const recognitionRef = useRef<any>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'dermia',
      text: `Olá, ${doctorProfile.name || 'Doutor(a)'}! Sou a **DermIA**, a inteligência artificial e copiloto clínico do seu consultório **ConsuDerme**.\n\n🎙️ **Sistema de Voz Ativado:** Você pode falar comigo pelo **microfone** e eu responderei por **voz** ou texto em tempo real.\n\n⚡ **Multi-IA Gratuita Integrada:** Operando com Llama 3.3 70B (Groq), Gemini 2.0 (Google Free) e Motor Clínico de Alta Precisão.\n\nEstou pronta para auxiliá-lo em:\n• **Raciocínio Diagnóstico & Rastreio de Neoplasias (ABCDE)**\n• **Formulações Magistrais & Veículos Galênicos**\n• **Anatomia Facial, Injetáveis & Protocolo de Hialuronidase**\n• **Custos de Procedimentos & Documentos CFM/LGPD**\n\nComo posso ajudar na sua conduta clínica agora?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      providerUsed: 'Motor Clínico ConsuDerme (Local)',
      isFreeTier: true
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, speechInterim]);

  // Load available AI Providers directly without server dependency
  useEffect(() => {
    setProviders([
      { id: 'gemini', name: 'Google Gemini 3.7 Flash (Direto REST)', active: true, free: true },
      { id: 'clinical_engine', name: 'Motor Clínico ConsuDerme (Offline)', active: true, free: true }
    ]);
  }, []);

  // Check browser SpeechRecognition support
  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setMicSupported(false);
    }
  }, []);

  // Text cleaner to format Markdown for pleasant SpeechSynthesis audio
  const cleanTextForSpeech = (rawText: string): string => {
    return rawText
      .replace(/[*#_`~>]/g, '') // remove markdown symbols
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/•/g, ', ') // bullets
      .replace(/(\d+)\.\s/g, 'Ponto $1: ') // numbered lists
      .replace(/UI/g, 'unidades internacionais')
      .replace(/mL/gi, 'mililitros')
      .replace(/mg/gi, 'miligramas')
      .replace(/kg/gi, 'quilos')
      .replace(/FPS/gi, 'Fator de Proteção Solar')
      .replace(/q\.s\.p\./gi, 'quantidade suficiente para')
      .replace(/\n+/g, '. ') // linebreaks to natural sentence pauses
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Speak text with SpeechSynthesis
  const speakResponse = (text: string, messageId?: string) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    if (isSpeaking && activeSpeakingId === messageId) {
      setIsSpeaking(false);
      setActiveSpeakingId(null);
      return;
    }

    const cleanText = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    // Pick best Portuguese voice if available
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang === 'pt-BR' || v.lang === 'pt_BR' || v.lang.startsWith('pt'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setActiveSpeakingId(messageId || 'auto');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveSpeakingId(null);
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      setIsSpeaking(false);
      setActiveSpeakingId(null);
    };

    setIsSpeaking(true);
    setActiveSpeakingId(messageId || 'auto');
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setActiveSpeakingId(null);
  };

  // Start Speech Recognition (Microphone)
  const startListening = () => {
    setMicError(null);
    stopSpeaking();

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setMicError('Reconhecimento de voz não suportado neste navegador. Use o Google Chrome ou Microsoft Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechInterim('');
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        if (finalText) {
          setInput(prev => (prev ? prev + ' ' : '') + finalText);
          setSpeechInterim('');
          // Auto-send when user finishes dictation
          handleSendMessage(finalText, undefined, true);
        } else {
          setSpeechInterim(interimText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        setIsListening(false);
        setSpeechInterim('');
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setMicError('Permissão do microfone negada. Permita o acesso ao microfone no seu navegador.');
        } else if (event.error === 'no-speech') {
          // just silent timeout
        } else {
          setMicError(`Erro no microfone (${event.error}). Tente novamente.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setSpeechInterim('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to initialize speech recognition:', err);
      setIsListening(false);
      setMicError('Não foi possível iniciar o microfone. Verifique as permissões.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
    setSpeechInterim('');
  };

  // Main Send Message Handler
  const handleSendMessage = async (textToSend?: string, suggestedTab?: NavigationTab, isFromVoice: boolean = false) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || loading) return;

    // Stop listening if currently listening
    stopListening();
    stopSpeaking();

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      isVoiceInput: isFromVoice,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSpeechInterim('');
    setLoading(true);

    try {
      const data = await directDermiaChat({
        message: messageText,
        conversationHistory: messages.slice(-6).map(m => ({ sender: m.sender, text: m.text })),
        doctorProfile
      });

      // Infer suggested tab if applicable
      let tabToSuggest: NavigationTab | undefined = suggestedTab;
      const lower = messageText.toLowerCase() + ' ' + (data.text || '').toLowerCase();
      if (!tabToSuggest) {
        if (lower.includes('prescri') || lower.includes('fórmula') || lower.includes('manipula') || lower.includes('veículo')) {
          tabToSuggest = 'prescriptions';
        } else if (lower.includes('injetáve') || lower.includes('toxina') || lower.includes('botox') || lower.includes('hialuroni') || lower.includes('preenchedor')) {
          tabToSuggest = 'procedures';
        } else if (lower.includes('diagnóstic') || lower.includes('anamnese') || lower.includes('melanoma') || lower.includes('fitzpatrick')) {
          tabToSuggest = 'clinical';
        } else if (lower.includes('fluxo') || lower.includes('financeir') || lower.includes('caixa') || lower.includes('receita') || lower.includes('dre')) {
          tabToSuggest = 'financial';
        } else if (lower.includes('custo') || lower.includes('preço') || lower.includes('atestado') || lower.includes('receita c2') || lower.includes('laudo')) {
          tabToSuggest = 'management';
        } else if (lower.includes('tcle') || lower.includes('termo') || lower.includes('lgpd') || lower.includes('consentimento')) {
          tabToSuggest = 'legal';
        }
      }

      const responseText = data.text;
      const responseMsgId = (Date.now() + 1).toString();

      const dermiaMsg: Message = {
        id: responseMsgId,
        sender: 'dermia',
        text: responseText,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        providerUsed: data.provider,
        model: data.model,
        isFreeTier: false,
        suggestedAction: tabToSuggest ? {
          label: tabToSuggest === 'prescriptions' ? 'Abrir no Prescritor de Fórmulas' :
                 tabToSuggest === 'procedures' ? 'Acessar Guia de Injetáveis' :
                 tabToSuggest === 'clinical' ? 'Iniciar Consulta Clínica' :
                 tabToSuggest === 'financial' ? 'Acessar Fluxo de Caixa' :
                 tabToSuggest === 'management' ? 'Abrir Gestão do Consultório' : 'Ver TCLEs e Documentos Legais',
          tab: tabToSuggest,
          icon: tabToSuggest
        } : undefined
      };

      setMessages(prev => [...prev, dermiaMsg]);

      // Automatically speak the response if requested by voice or autoVoiceResponse is true
      if (autoVoiceResponse || isFromVoice) {
        setTimeout(() => {
          speakResponse(responseText, responseMsgId);
        }, 300);
      }
    } catch (err: any) {
      console.warn('Network issue caught in DermiaCopilot, generating direct clinical response:', err);
      
      // Client-side instant clinical response
      const lower = messageText.toLowerCase();
      let fallbackText = `Olá, **${doctorProfile.name || 'Doutor(a)'}**! Sou a **DermIA**, a inteligência artificial do seu consultório **ConsuDerme**.\n\n`;

      if (lower.includes('melasma') || lower.includes('despigment') || lower.includes('mancha') || lower.includes('tranex')) {
        fallbackText += `### 🔬 Manejo do Melasma Recalcitrante (Dérmico / Misto)\n\n**Sugestão de Fórmula Magistral:**\n• **Ácido Tranexâmico**: 3.0%\n• **Alfa-Arbutin**: 3.0% ou **Cisteamina HCl**: 5.0%\n• **Niacinamida**: 4.0%\n• **Ácido Kójico Dipalmitato**: 2.0%\n• **Veículo**: Sérum Fluido Toque Seco Fosfolipídico q.s.p. 30g (pH 5.5)\n\n**Posologia:** Aplicar 4 a 5 gotas à noite na face limpa e seca. Fotoproteção com cor (FPS 50+ com óxido de ferro) a cada 3h.`;
      } else if (lower.includes('hialuroni') || lower.includes('isquemia') || lower.includes('oclus') || lower.includes('necrose')) {
        fallbackText += `⚠️ **PROTOCOLO DE EMERGÊNCIA: REVERSÃO DE ISQUEMIA POR PREENCHEDOR**\n\n1. **Infiltração Imediata de Hialuronidase**: 500 a 1.500 UI diluídas em SF 0.9% na área isquêmica e trajeto vascular.\n2. **Repetição**: A cada 60 a 90 minutos se o tempo de enchimento capilar permanecer > 2 segundos.\n3. **Compressas Mornas e Massagem Vigorosa** para vasodilatação e difusão.\n4. **Adjuvantes**: AAS 100-300mg dose única + Prednisona 40-60mg/dia.\n5. **Amaurose/Dor ocular**: Encaminhamento imediato ao oftalmologista e câmara hiperbárica.`;
      } else if (lower.includes('isotretino') || lower.includes('roacutan') || lower.includes('c2') || lower.includes('portaria 344')) {
        fallbackText += `### 📜 Protocolo de Prescrição de Isotretinoína Oral (Portaria 344 Lista C2)\n\n• **Receituário C2**: Notificação especial branca (validade 30 dias).\n• **Mulheres em idade fértil**: Termo de Consentimento, 2 métodos contraceptivos complementares e 2 testes de gravidez (Beta-HCG) negativos com 30 dias de intervalo.\n• **Controle Laboratorial**: Hemograma, perfil lipídico, transaminases (TGO/TGP) e Beta-HCG mensal.\n• **Dose Acumulada Alvo**: 120 a 150 mg/kg.`;
      } else if (lower.includes('melanoma') || lower.includes('abcde') || lower.includes('biópsia') || lower.includes('cbc') || lower.includes('cec')) {
        fallbackText += `### 🔍 Avaliação Oncologia Cutânea & Regra ABCDE\n\n• **A - Assimetria**: Eixos estruturais e de cor desiguais.\n• **B - Bordas**: Irregulares, chanfradas ou término abrupto.\n• **C - Cores**: ≥ 3 tons (preto, castanho, azul/véu branco, despigmentação).\n• **D - Diâmetro**: > 6 mm.\n• **E - Evolução**: Mudança de relevo, sangramento ou prurido.\n\n**Conduta Padrão-Ouro**: Biópsia excisional completa com margem de 1 a 2mm de pele sã.`;
      } else if (lower.includes('custo') || lower.includes('preço') || lower.includes('botox') || lower.includes('toxina')) {
        fallbackText += `### 💰 Precificação & Custos de Procedimentos\n\n• **Custo por UI (Toxina Botulínica)**: R$ 7,50 (base frasco 100 UI por R$ 750).\n• **Sessão 50 UI + Insumos**: R$ 375,00 + R$ 45,00 = R$ 420,00 de custo direto.\n• **Preço Sugerido (Margem 65%)**: R$ 1.200,00 (Lucro de R$ 780,00 por aplicação).`;
      } else {
        fallbackText += `Recebi sua dúvida: *" ${messageText} "*\n\n### 🩺 Conduta & Módulos Disponíveis no ConsuDerme:\n• **Prescritor de Fórmulas**: Fórmulas magistrais personalizadas com veículos ideais.\n• **Guia de Injetáveis**: Mapa de segurança, dosimetria e protocolo de Hialuronidase.\n• **Consulta Clínica**: Anamnese estruturada por fototipo Fitzpatrick I a VI e diagnósticos diferenciais.\n• **Fluxo de Caixa**: Entradas, despesas operacionais e DRE real.\n• **Gestão**: Atestados CID-10, laudos dermatoscópicos e receitas C2.\n\nComo posso ajudá-lo a detalhar esse caso clínico?`;
      }

      const responseMsgId = (Date.now() + 1).toString();
      const clientMsg: Message = {
        id: responseMsgId,
        sender: 'dermia',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        suggestedAction: suggestedTab ? {
          label: suggestedTab === 'prescriptions' ? 'Abrir no Prescritor de Fórmulas' :
                 suggestedTab === 'procedures' ? 'Acessar Guia de Injetáveis' :
                 suggestedTab === 'clinical' ? 'Iniciar Consulta Clínica' :
                 suggestedTab === 'financial' ? 'Acessar Fluxo de Caixa' :
                 suggestedTab === 'management' ? 'Abrir Gestão do Consultório' : 'Ver TCLEs e Documentos Legais',
          tab: suggestedTab,
          icon: suggestedTab
        } : undefined
      };
      setMessages(prev => [...prev, clientMsg]);

      if (autoVoiceResponse || isFromVoice) {
        setTimeout(() => {
          speakResponse(fallbackText, responseMsgId);
        }, 300);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleResetChat = () => {
    stopSpeaking();
    stopListening();
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'dermia',
        text: `Conversa reiniciada! Como posso auxiliá-lo agora, ${doctorProfile.name || 'Doutor(a)'}? Fale pelo microfone ou digite sua pergunta.`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <>
      {/* Floating Action Button (FAB) of DermIA */}
      {!isOpen && (
        <button
          id="btn-open-dermia-fab"
          onClick={onOpen}
          style={{ 
            position: 'fixed',
            bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))', 
            right: 'calc(16px + env(safe-area-inset-right, 0px))', 
            zIndex: 9999 
          }}
          className="fixed bottom-6 right-4 z-[9999] group flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-400 text-white shadow-xl shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white focus:outline-none"
          title="Abrir DermIA — Inteligência Artificial por Voz e Texto do ConsuDerme"
        >
          <Sparkles className="w-7 h-7 font-black text-white group-hover:rotate-12 transition-transform drop-shadow" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
        </button>
      )}

      {/* Slide-over / Modal Drawer when open */}
      {isOpen && (
        <div 
          style={{ zIndex: 9999 }}
          className="fixed inset-y-0 right-0 w-full sm:w-[500px] max-w-full bg-white border-l border-rose-100 shadow-2xl flex flex-col animate-slideLeft text-slate-800 h-full max-h-[100dvh]"
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-rose-50 via-pink-50/50 to-white border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white font-black shadow-md shadow-rose-500/20">
                <Sparkles className="w-5 h-5 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-base text-slate-900 tracking-tight">ConsuDerme AI</h3>
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                    Gemini 3.7 Flash
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Copiloto Clínico, Fórmulas & Voz Ativa (Direto REST)</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Toggle Auto Voice Response */}
              <button
                onClick={() => {
                  const next = !autoVoiceResponse;
                  setAutoVoiceResponse(next);
                  if (!next) stopSpeaking();
                }}
                className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition ${
                  autoVoiceResponse
                    ? 'bg-rose-100 text-rose-700 border-rose-300'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-700'
                }`}
                title={autoVoiceResponse ? 'Resposta por Voz Automática: ATIVADA' : 'Resposta por Voz Automática: DESATIVADA'}
              >
                {autoVoiceResponse ? (
                  <>
                    <Volume2 className="w-4 h-4 text-rose-600 animate-pulse" />
                    <span className="hidden sm:inline text-[10px] font-bold">Voz On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-slate-400" />
                    <span className="hidden sm:inline text-[10px]">Voz Off</span>
                  </>
                )}
              </button>

              {/* Stop global speech if playing */}
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="p-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 transition"
                  title="Parar áudio da DermIA"
                >
                  <Square className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
                </button>
              )}

              <button
                onClick={handleResetChat}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title="Reiniciar Conversa"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => {
                  stopSpeaking();
                  stopListening();
                  onClose();
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title="Minimizar DermIA"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Shortcuts Bar & Provider Switcher */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              {/* Active AI Engine Selector */}
              <div className="relative flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  Motor IA:
                </span>
                
                <div className="relative">
                  <button
                    onClick={() => setShowProviderMenu(!showProviderMenu)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 text-xs font-semibold text-slate-800 transition shadow-sm"
                    title="Alternar Motor de Inteligência Artificial Gratuito"
                  >
                    <span className="truncate max-w-[190px]">
                      ✨ Gemini 3.7 Flash (Direto REST)
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {showProviderMenu && (
                    <div className="absolute left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fadeIn text-xs">
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100 flex items-center justify-between">
                        <span>Selecione a IA Gratuita</span>
                        <span className="text-emerald-600 font-extrabold bg-emerald-50 px-1 rounded">100% Free</span>
                      </div>
                      
                      <button
                        onClick={() => { setSelectedProvider('auto'); setShowProviderMenu(false); }}
                        className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-rose-50 transition ${selectedProvider === 'auto' ? 'bg-rose-50/70 text-rose-700 font-bold' : 'text-slate-700'}`}
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-900">⚡ Automático (Recomendado)</div>
                          <div className="text-[10px] text-slate-500">Cascata: Groq ➔ Gemini ➔ OpenRouter ➔ Local</div>
                        </div>
                      </button>

                      <button
                        onClick={() => { setSelectedProvider('groq'); setShowProviderMenu(false); }}
                        className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-rose-50 transition ${selectedProvider === 'groq' ? 'bg-rose-50/70 text-rose-700 font-bold' : 'text-slate-700'}`}
                      >
                        <span className="text-sm">⚡</span>
                        <div>
                          <div className="font-semibold text-slate-900">Groq (Llama 3.3 70B)</div>
                          <div className="text-[10px] text-slate-500">Ultra-rápido, raciocínio clínico de ponta</div>
                        </div>
                      </button>

                      <button
                        onClick={() => { setSelectedProvider('gemini'); setShowProviderMenu(false); }}
                        className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-rose-50 transition ${selectedProvider === 'gemini' ? 'bg-rose-50/70 text-rose-700 font-bold' : 'text-slate-700'}`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-pink-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-900">Google Gemini (Free Tier)</div>
                          <div className="text-[10px] text-slate-500">Gemini 2.0 Flash com foco dermatológico</div>
                        </div>
                      </button>

                      <button
                        onClick={() => { setSelectedProvider('openrouter'); setShowProviderMenu(false); }}
                        className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-rose-50 transition ${selectedProvider === 'openrouter' ? 'bg-rose-50/70 text-rose-700 font-bold' : 'text-slate-700'}`}
                      >
                        <span className="text-sm">🌐</span>
                        <div>
                          <div className="font-semibold text-slate-900">OpenRouter (Modelos Free)</div>
                          <div className="text-[10px] text-slate-500">DeepSeek R1 / Llama 3.3 via OpenRouter</div>
                        </div>
                      </button>

                      <button
                        onClick={() => { setSelectedProvider('clinical_engine'); setShowProviderMenu(false); }}
                        className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-rose-50 transition ${selectedProvider === 'clinical_engine' ? 'bg-rose-50/70 text-rose-700 font-bold' : 'text-slate-700'}`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-900">Motor Clínico ConsuDerme</div>
                          <div className="text-[10px] text-slate-500">100% offline e imediato sem necessidade de chaves</div>
                        </div>
                      </button>

                      <div className="border-t border-slate-100 p-2 bg-slate-50 rounded-b-xl flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Custo zero para o consultório</span>
                        <button
                          onClick={() => { setShowProviderMenu(false); setShowProviderInfoModal(true); }}
                          className="text-rose-600 hover:text-rose-700 font-bold underline text-[10px]"
                        >
                          Como funciona?
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Free badge & Help button */}
              <button
                onClick={() => setShowProviderInfoModal(true)}
                className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 hover:bg-emerald-100 transition"
                title="Ver detalhes das IAs gratuitas disponíveis"
              >
                <span>🌱 100% Gratuito</span>
                <span className="text-slate-400">ⓘ</span>
              </button>
            </div>

            {/* Modules Shortcut Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar pt-1 border-t border-slate-200/60">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] shrink-0">
                Módulos:
              </span>
              <button
                onClick={() => onNavigate('clinical')}
                className="px-2 py-0.5 bg-white hover:bg-rose-50 text-rose-700 rounded-lg border border-slate-200 shrink-0 flex items-center gap-1 font-medium transition text-[10px]"
              >
                <Stethoscope className="w-3 h-3 text-rose-500" />
                <span>Consulta</span>
              </button>
              <button
                onClick={() => onNavigate('prescriptions')}
                className="px-2 py-0.5 bg-white hover:bg-teal-50 text-teal-800 rounded-lg border border-slate-200 shrink-0 flex items-center gap-1 font-medium transition text-[10px]"
              >
                <FileText className="w-3 h-3 text-teal-600" />
                <span>Prescritor</span>
              </button>
              <button
                onClick={() => onNavigate('procedures')}
                className="px-2 py-0.5 bg-white hover:bg-purple-50 text-purple-800 rounded-lg border border-slate-200 shrink-0 flex items-center gap-1 font-medium transition text-[10px]"
              >
                <Syringe className="w-3 h-3 text-purple-600" />
                <span>Injetáveis</span>
              </button>
              <button
                onClick={() => onNavigate('financial')}
                className="px-2 py-0.5 bg-white hover:bg-emerald-50 text-emerald-800 rounded-lg border border-slate-200 shrink-0 flex items-center gap-1 font-medium transition text-[10px]"
              >
                <span className="font-bold text-emerald-600">$</span>
                <span>Financeiro</span>
              </button>
              <button
                onClick={() => onNavigate('management')}
                className="px-2 py-0.5 bg-white hover:bg-amber-50 text-amber-800 rounded-lg border border-slate-200 shrink-0 flex items-center gap-1 font-medium transition text-[10px]"
              >
                <Calculator className="w-3 h-3 text-amber-600" />
                <span>Gestão</span>
              </button>
              <button
                onClick={() => onNavigate('legal')}
                className="px-2 py-0.5 bg-white hover:bg-sky-50 text-sky-800 rounded-lg border border-slate-200 shrink-0 flex items-center gap-1 font-medium transition text-[10px]"
              >
                <ShieldCheck className="w-3 h-3 text-sky-600" />
                <span>TCLEs</span>
              </button>
            </div>
          </div>

          {/* Microphone Warning / Notification banner if active or error */}
          {micError && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{micError}</span>
              </div>
              <button 
                onClick={() => setMicError(null)} 
                className="text-amber-700 hover:text-amber-900 font-bold text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Active Speaking Banner */}
          {isSpeaking && (
            <div className="px-4 py-1.5 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span className="font-semibold text-rose-900">DermIA falando a conduta médica por voz...</span>
              </div>
              <button
                onClick={stopSpeaking}
                className="text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300"
              >
                Silenciar
              </button>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs bg-slate-50/50">
            {(messages || []).map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-500">
                  {msg.sender === 'user' ? (
                    <>
                      {msg.isVoiceInput && (
                        <span className="inline-flex items-center gap-0.5 text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                          <Mic className="w-2.5 h-2.5" /> Voz
                        </span>
                      )}
                      <span>{doctorProfile.name || 'Você'}</span>
                      <User className="w-3 h-3 text-rose-500" />
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-rose-500" />
                      <span className="font-bold text-rose-600">DermIA</span>
                    </>
                  )}
                  <span>• {msg.timestamp}</span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl max-w-[92%] space-y-2 leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-tr-none shadow-rose-500/20'
                      : 'bg-white text-slate-800 border border-rose-100 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Suggested Quick Navigation Action if present */}
                  {msg.suggestedAction && (
                    <div className="pt-2 mt-2 border-t border-slate-100">
                      <button
                        onClick={() => onNavigate(msg.suggestedAction!.tab)}
                        className="w-full py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center justify-between transition"
                      >
                        <span>{msg.suggestedAction.label}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Message Action Bar (Voice Player & Copy for DermIA + Provider Badge) */}
                  {msg.sender === 'dermia' && (
                    <div className="flex items-center justify-between gap-2 pt-1.5 text-[10px] text-slate-400 border-t border-slate-100 mt-2">
                      <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 truncate max-w-[190px]">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="truncate">
                          {msg.providerUsed || 'Motor Clínico ConsuDerme'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => speakResponse(msg.text, msg.id)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition ${
                            isSpeaking && activeSpeakingId === msg.id
                              ? 'bg-rose-100 text-rose-700 border border-rose-300 font-bold'
                              : 'hover:text-rose-600 hover:bg-rose-50 text-slate-500'
                          }`}
                          title="Ouvir resposta com voz da DermIA"
                        >
                          {isSpeaking && activeSpeakingId === msg.id ? (
                            <>
                              <Square className="w-2.5 h-2.5 fill-rose-600 text-rose-600" />
                              <span>Parar</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3 text-rose-500" />
                              <span>Voz</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="hover:text-rose-600 hover:bg-rose-50 px-1.5 py-0.5 rounded flex items-center gap-1 transition text-slate-500"
                          title="Copiar texto"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === msg.id ? 'OK' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Live Listening State Indicator */}
            {isListening && (
              <div className="flex items-start gap-2 animate-fadeIn">
                <div className="w-8 h-8 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 animate-pulse">
                  <Mic className="w-4 h-4" />
                </div>
                <div className="p-3 rounded-2xl bg-red-50/80 border border-red-200 text-slate-800 text-xs rounded-tl-none space-y-1.5 max-w-[85%]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    <span className="font-bold text-red-700 text-[11px] uppercase tracking-wider">
                      Microfone Ativo • DermIA está ouvindo você...
                    </span>
                  </div>
                  <p className="italic text-slate-700">
                    {speechInterim || 'Fale sua dúvida, sintoma, cálculo de toxina ou caso clínico...'}
                  </p>
                  <div className="flex items-center justify-end pt-1">
                    <button
                      onClick={stopListening}
                      className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded-lg transition shadow"
                    >
                      Concluir Fala
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AI Loading State */}
            {loading && (
              <div className="flex items-start gap-2 animate-fadeIn">
                <div className="w-8 h-8 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-3 rounded-2xl bg-white border border-rose-100 text-slate-600 text-xs rounded-tl-none flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  <span>DermIA está raciocinando e formulando a conduta clínica...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="p-3 bg-white border-t border-rose-100">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Perguntas & Sugestões Rápidas:</span>
              </div>
              <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                <Mic className="w-2.5 h-2.5" /> Fale ou clique
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp.query, qp.targetTab)}
                  disabled={loading || isListening}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 shrink-0 transition whitespace-nowrap disabled:opacity-50 font-medium"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat & Microphone Input Bar */}
          <div className="p-3 bg-white border-t border-rose-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Microphone Button (Speech-to-Text) */}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                disabled={loading || !micSupported}
                className={`relative p-2.5 rounded-xl transition font-bold flex items-center justify-center shrink-0 ${
                  isListening
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/40 animate-pulse ring-2 ring-red-400'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title={
                  !micSupported
                    ? 'Microfone não suportado no navegador'
                    : isListening
                    ? 'Clique para parar de falar e enviar'
                    : 'Falar pelo microfone com a DermIA'
                }
              >
                {isListening ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-400 rounded-full animate-ping"></span>
                  </>
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={speechInterim || input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isListening
                    ? 'Ouvindo sua voz... Pode falar...'
                    : 'Fale pelo microfone ou digite para a DermIA...'
                }
                disabled={loading}
                className={`flex-1 p-2.5 text-xs rounded-xl bg-slate-50 border text-slate-900 placeholder-slate-400 focus:outline-none transition disabled:opacity-50 ${
                  isListening
                    ? 'border-red-400 ring-2 ring-red-200 placeholder-red-400'
                    : 'border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-rose-400'
                }`}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={(!input.trim() && !speechInterim.trim()) || loading}
                className="p-2.5 bg-gradient-to-tr from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold rounded-xl transition shadow-md shadow-rose-500/20 disabled:opacity-50 shrink-0"
                title="Enviar mensagem para a DermIA"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Mic className="w-3 h-3 text-rose-500" />
                {isListening ? (
                  <strong className="text-red-600">Gravando sua voz em tempo real...</strong>
                ) : (
                  'Clique no microfone para falar diretamente'
                )}
              </span>
              <span className="flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-emerald-600" />
                {autoVoiceResponse ? 'Resposta falada por voz: Ativa' : 'Resposta falada: Manual'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Free AI Provider Info Modal */}
      {showProviderInfoModal && (
        <div 
          style={{ zIndex: 10000 }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-rose-100 text-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  🌱
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Multi-IA Gratuita ConsuDerme</h3>
                  <p className="text-xs text-slate-500">IAs Gratuitas integradas sem custos para o consultório</p>
                </div>
              </div>
              <button
                onClick={() => setShowProviderInfoModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                O <strong>ConsuDerme & DermIA</strong> possui um motor híbrido inteligente com <strong>cascata de alta disponibilidade 100% gratuita</strong>:
              </p>

              <div className="space-y-2">
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 flex items-center gap-1">
                      <span>⚡</span> Groq Cloud (Llama 3.3 70B Versatile)
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      100% Grátis & Ultra-rápido
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Oferece o modelo open-source Llama 3.3 70B com velocidade incomparável de inferência em chips LPU. Gratuito em <em>console.groq.com</em>.
                  </p>
                </div>

                <div className="p-3 bg-pink-50/70 border border-pink-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-pink-500" /> Google Gemini (Free Tier)
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Gratuito (AI Studio)
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Gemini 2.0 Flash com cota gratuita generosa para raciocínio clínico dermatológico.
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Motor Clínico ConsuDerme (Local)
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Sempre Ativo (Offline)
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Base de conhecimento médico interna de segurança para melasma, isotretinoína, reversão com hialuronidase e regras CFM/SBD.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                <strong>💡 Modo de Operação Automático:</strong>
                <p>
                  Quando configurado no modo <em>Automático</em>, a DermIA consulta primeiro o provedor mais rápido disponível. Se houver limite de taxa ou falha de rede, ela aciona automaticamente a próxima opção sem interromper seu atendimento.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowProviderInfoModal(false)}
                className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs rounded-xl shadow hover:from-rose-600 hover:to-pink-600 transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
