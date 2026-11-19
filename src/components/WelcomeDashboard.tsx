import React from 'react';
import { 
  Stethoscope, 
  ShieldCheck, 
  FileText, 
  Syringe, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Scale, 
  ScrollText, 
  Calculator,
  UserCheck,
  Zap,
  MessageSquare,
  Bot,
  DollarSign,
  TrendingUp,
  Wallet,
  Mic,
  Volume2,
  Download,
  Smartphone,
  Wifi
} from 'lucide-react';
import { DoctorProfile, NavigationTab } from '../types';
import { ConsultationHistory } from './ConsultationHistory';
import { ConsultationHistoryEntry } from '../utils/consultationStorage';

interface WelcomeDashboardProps {
  doctorProfile: DoctorProfile;
  onNavigate: (tab: NavigationTab) => void;
  onOpenSettings: () => void;
  onOpenDermia: () => void;
  onOpenPWAInstall?: () => void;
  isPWAInstalled?: boolean;
  onSelectConsultation?: (entry: ConsultationHistoryEntry) => void;
}

export const WelcomeDashboard: React.FC<WelcomeDashboardProps> = ({
  doctorProfile,
  onNavigate,
  onOpenSettings,
  onOpenDermia,
  onOpenPWAInstall,
  isPWAInstalled,
  onSelectConsultation
}) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner: Status & Clean Environment */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-750 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>CONSUDERME OPERACIONAL • AMBIENTE 100% LIMPO & PRIVATIVO</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Painel de Boas-Vindas do ConsuDerme
            </h1>
            
            <p className="text-slate-300 text-sm leading-relaxed">
              Bem-vindo, <span className="font-semibold text-teal-300">{doctorProfile.name || 'Doutor(a) Dermatologista'}</span>. Seu consultório virtual, gestão financeira e copiloto por voz <strong className="text-teal-300">DermIA</strong> estão configurados e 100% prontos para a entrada de dados do primeiro paciente real, com suporte a microfone e síntese de voz, em estrita conformidade com o <strong className="text-white">CFM</strong> e à <strong className="text-white">LGPD Médica</strong>.
            </p>

            <div className="flex flex-wrap gap-2 pt-2 text-[11px] text-slate-300">
              <span className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1.5">
                <Scale className="w-3 h-3 text-teal-400" /> Resolução CFM 2.314/2022
              </span>
              <span className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-400" /> LGPD Art. 11 (Dados Sensíveis)
              </span>
              <span className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1.5">
                <Mic className="w-3 h-3 text-teal-400" /> Microfone & Voz da DermIA
              </span>
              <span className="bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-3 h-3 text-emerald-400" /> Fluxo de Caixa Real
              </span>
            </div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl flex flex-col justify-between space-y-3 min-w-[240px]">
            <div>
              <div className="text-xs text-slate-400 font-medium">Médico Responsável:</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {doctorProfile.name || 'Não configurado'}
              </div>
              <div className="text-xs text-teal-400 font-medium font-mono">
                CRM {doctorProfile.crm || '---'}/{doctorProfile.uf || 'UF'} {doctorProfile.rqe ? `• RQE ${doctorProfile.rqe}` : ''}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">
                {doctorProfile.clinicName || 'Consultório Particular'}
              </div>
            </div>
            
            <button
              id="btn-edit-header-data"
              onClick={onOpenSettings}
              className="w-full py-1.5 px-3 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-semibold border border-teal-500/30 transition flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Editar Dados do Consultório</span>
            </button>
          </div>
        </div>
      </div>

      {/* DERMIA AI & VOICE SPOTLIGHT BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 border border-teal-500/40 p-5 sm:p-6 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/30 shrink-0">
              <Sparkles className="w-6 h-6 text-slate-950" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  DermIA: A Inteligência Artificial com Microfone & Voz
                </h3>
                <span className="bg-teal-500/20 text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-500/30 animate-pulse flex items-center gap-1">
                  <Mic className="w-2.5 h-2.5" /> Microfone Online
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                Faça perguntas por <strong className="text-teal-300">microfone</strong> e receba a conduta falada por <strong className="text-teal-300">voz</strong> ou texto: diagnóstico diferencial (Fitzpatrick I–VI, ABCDE), formulações magistrais, cálculo de insumos, reversão de oclusão com Hialuronidase e gestão do consultório.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              id="btn-spotlight-open-dermia"
              onClick={onOpenDermia}
              className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition transform active:scale-95"
            >
              <Mic className="w-4 h-4" />
              <span>Falar com a DermIA por Voz</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 PRIMARY FAST-ACTION SHORTCUTS REQUIRED BY PROTOCOL */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-teal-400" />
              Atalhos Rápidos de Acesso Obrigatórios
            </h2>
            <p className="text-xs text-slate-400">Selecione uma das categorias principais do ConsuDerme para navegar imediatamente</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* [1] Iniciar Consulta Clínica */}
          <div 
            id="shortcut-clinical-consultation"
            onClick={() => onNavigate('clinical')}
            className="group cursor-pointer bg-slate-900/90 rounded-xl border border-slate-750 hover:border-teal-500 hover:shadow-xl hover:shadow-teal-500/10 p-4 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-300 font-extrabold text-xs flex items-center justify-center border border-teal-500/30">
                  1
                </span>
                <div className="p-2 rounded-lg bg-teal-600 text-slate-950 font-bold shadow-md shadow-teal-600/30 group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="font-bold text-white group-hover:text-teal-300 transition-colors text-sm">
                Consulta Clínica
              </h3>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Anamnese estruturada com Fitzpatrick (I–VI), Diagnóstico Diferencial e Alerta de Neoplasias.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-teal-400">
              <span>Abrir Consulta</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* [2] Fluxo de Caixa Real & Financeiro */}
          <div 
            id="shortcut-financial-flow"
            onClick={() => onNavigate('financial')}
            className="group cursor-pointer bg-slate-900/90 rounded-xl border border-slate-750 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 p-4 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-300 font-extrabold text-xs flex items-center justify-center border border-emerald-500/30">
                  $
                </span>
                <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-md shadow-emerald-600/30 group-hover:scale-110 transition-transform">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-bold text-white group-hover:text-emerald-300 transition-colors text-sm">
                Fluxo de Caixa Real
              </h3>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Controle de entradas por procedimento, DRE do consultório, custos de insumos e contas a receber.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span>Abrir Financeiro</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* [3] Criar Prescrição / Fórmula */}
          <div 
            id="shortcut-prescriptions"
            onClick={() => onNavigate('prescriptions')}
            className="group cursor-pointer bg-slate-900/90 rounded-xl border border-slate-750 hover:border-teal-500 hover:shadow-xl hover:shadow-teal-500/10 p-4 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-300 font-extrabold text-xs flex items-center justify-center border border-teal-500/30">
                  3
                </span>
                <div className="p-2 rounded-lg bg-teal-600 text-white shadow-md shadow-teal-600/30 group-hover:scale-110 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-bold text-white group-hover:text-teal-300 transition-colors text-sm">
                Prescritor & Fórmulas
              </h3>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Fórmulas Magistrais galênicas personalizadas com veículos ideais (Gel, Sérum, Creme).
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-teal-400">
              <span>Prescrever</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* [4] Gestão do Consultório */}
          <div 
            id="shortcut-management-tcle"
            onClick={() => onNavigate('management')}
            className="group cursor-pointer bg-slate-900/90 rounded-xl border border-slate-750 hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/10 p-4 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-300 font-extrabold text-xs flex items-center justify-center border border-amber-500/30">
                  4
                </span>
                <div className="p-2 rounded-lg bg-amber-600 text-white shadow-md shadow-amber-600/30 group-hover:scale-110 transition-transform">
                  <ScrollText className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-bold text-white group-hover:text-amber-300 transition-colors text-sm">
                Gestão & Custos
              </h3>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Atestados com CID-10, Receita C2 (Isotretinoína), Laudos e Margens por UI/mL.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-amber-400">
              <span>Abrir Gestão</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* [5] Páginas Legais / Termos de Uso */}
          <div 
            id="shortcut-legal-pages"
            onClick={() => onNavigate('legal')}
            className="group cursor-pointer bg-slate-900/90 rounded-xl border border-slate-750 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 p-4 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-300 font-extrabold text-xs flex items-center justify-center border border-blue-500/30">
                  5
                </span>
                <div className="p-2 rounded-lg bg-blue-600 text-white shadow-md shadow-blue-600/30 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-bold text-white group-hover:text-blue-300 transition-colors text-sm">
                Páginas Legais & TCLE
              </h3>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Termos de Uso, Política de Privacidade LGPD, Disclaimers CFM e TCLEs cirúrgicos.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-400">
              <span>Ver Legais</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Modules In-Depth Architecture Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Módulo 1 */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Módulo 1: Jurídico & Regulatório</span>
            </div>
            <h4 className="text-base font-bold text-white mb-2">
              Páginas Institucionais e LGPD
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Documentação jurídica obrigatória para publicar no site da clínica ou sistema web, blindando o médico de responsabilidades indevidas.
            </p>
            <ul className="text-xs space-y-2 text-slate-300">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span><strong>Termos de Uso:</strong> Suporte clínico IA (responsabilidade 100% CRM) e planos R$ 59,90/mês e R$ 599,00/ano.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span><strong>LGPD Médica:</strong> Dados sensíveis de saúde, anonimização e criptografia.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span><strong>TCLEs Oficiais:</strong> Toxina, Preenchedores, Bioestimuladores, Peelings e Cirurgia.</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => onNavigate('legal')}
            className="mt-5 w-full py-2.5 px-3 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 rounded-lg text-xs font-semibold transition border border-blue-500/30 text-center"
          >
            Acessar Documentos Legais
          </button>
        </div>

        {/* Card Módulo 2 */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-teal-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Stethoscope className="w-4 h-4" />
              <span>Módulo 2: Atendimento Clínico</span>
            </div>
            <h4 className="text-base font-bold text-white mb-2">
              DermIA & Raciocínio Dermatológico
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Assistente inteligente em tempo real alimentado pelo Gemini 3.7 Flash para estratificação semiológica e prescrição.
            </p>
            <ul className="text-xs space-y-2 text-slate-300">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Fototipo de Fitzpatrick:</strong> Escala I a VI com orientações de tolerância actínica e risco de discromias.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Diagnóstico Diferencial:</strong> Probabilidades ranqueadas e Alertas Críticos de Melanoma/CBC/CEC.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Fórmulas Magistrais:</strong> Veículos (Gel, Sérum, Creme, Loção) e posologia detalhada.</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => onNavigate('clinical')}
            className="mt-5 w-full py-2.5 px-3 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 rounded-lg text-xs font-semibold transition border border-teal-500/30 text-center"
          >
            Iniciar Consulta com DermIA
          </button>
        </div>

        {/* Card Módulo 3 */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
              <DollarSign className="w-4 h-4" />
              <span>Módulo 3: Fluxo de Caixa & Finanças</span>
            </div>
            <h4 className="text-base font-bold text-white mb-2">
              Fluxo de Caixa & DRE do Consultório
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Controle em tempo real de entradas, pagamentos, custos de insumos farmacológicos e margem líquida do consultório.
            </p>
            <ul className="text-xs space-y-2 text-slate-300">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Controle Real de Entradas:</strong> PIX, Cartão (1x-12x), Dinheiro e Boleto.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Custos de Insumos:</strong> Dedução automática de custos de toxinas e preenchedores.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>DRE Gerencial:</strong> Demonstração do Resultado com margem líquida e lucro operacional.</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => onNavigate('financial')}
            className="mt-5 w-full py-2.5 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-lg text-xs font-semibold transition border border-emerald-500/30 text-center"
          >
            Abrir Fluxo de Caixa Real
          </button>
        </div>
      </div>

      {/* RECENT CONSULTATIONS HISTORY */}
      <ConsultationHistory
        compact
        maxItems={5}
        onSelectConsultation={onSelectConsultation}
      />

      {/* PWA APPLICATIVE STATUS & INSTALL CARD */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-teal-500/30 p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-bold shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">
                ConsuDerme em Versão Aplicativo Nativo (PWA)
              </h3>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                <Wifi className="w-2.5 h-2.5" /> 100% Instalável & Offline
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Instale o ConsuDerme diretamente na tela inicial do seu computador, tablet ou smartphone. Tenha acesso sem barras de navegador, inicialização instantânea, suporte offline completo e integração com microfone para o copiloto <strong className="text-teal-300">DermIA</strong>.
            </p>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-auto">
          {onOpenPWAInstall && (
            <button
              onClick={onOpenPWAInstall}
              className="w-full md:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{isPWAInstalled ? 'Gerenciar Aplicativo Instalado' : 'Instalar ConsuDerme no Dispositivo'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
