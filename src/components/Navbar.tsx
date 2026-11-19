import React, { useState } from 'react';
import { 
  Stethoscope, 
  ShieldCheck, 
  FileText, 
  Sparkles, 
  Syringe, 
  Calculator, 
  UserCheck, 
  Settings, 
  Layers,
  Menu,
  X,
  DollarSign,
  Mic,
  Download,
  WifiOff,
  Users
} from 'lucide-react';
import { DoctorProfile, NavigationTab } from '../types';

interface NavbarProps {
  activeTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  doctorProfile: DoctorProfile;
  onOpenSettings: () => void;
  onOpenDermia: () => void;
  onOpenPWAInstall?: () => void;
  isPWAInstalled?: boolean;
  isOffline?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onNavigate,
  doctorProfile,
  onOpenSettings,
  onOpenDermia,
  onOpenPWAInstall,
  isPWAInstalled,
  isOffline
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: NavigationTab) => {
    onNavigate(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-[1000] bg-white/95 backdrop-blur-md border-b border-rose-100/90 text-slate-800 shadow-sm w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 box-border">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Platform identity - Compact on mobile */}
          <div 
            id="nav-logo-btn"
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group select-none shrink-0"
            onClick={() => handleNavClick('dashboard')}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-rose-400 via-pink-300 to-teal-300 p-0.5 shadow-md shadow-rose-300/30 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-white rounded-[10px] sm:rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                  CONSU<span className="text-rose-500">DERME</span>
                </span>
                <span className="hidden sm:inline-flex bg-rose-50 text-rose-700 text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border border-rose-200">
                  CFM / SBD
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 hidden xs:block">Consultório & DermIA</p>
            </div>
          </div>

          {/* Desktop Navigation Items */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              id="nav-dashboard-btn"
              onClick={() => handleNavClick('dashboard')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm font-bold'
                  : 'text-slate-600 hover:bg-rose-50/60 hover:text-rose-700'
              }`}
            >
              <Layers className="w-4 h-4 text-rose-500" />
              <span>Painel</span>
            </button>

            <button
              id="nav-clinical-btn"
              onClick={() => handleNavClick('clinical')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'clinical'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm font-bold'
                  : 'text-slate-600 hover:bg-rose-50/60 hover:text-rose-700'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-rose-500" />
              <span>Consulta Clínica</span>
            </button>

            <button
              id="nav-patients-btn"
              onClick={() => handleNavClick('patients')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'patients'
                  ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-sm font-bold'
                  : 'text-slate-600 hover:bg-teal-50/60 hover:text-teal-800'
              }`}
            >
              <Users className="w-4 h-4 text-teal-600" />
              <span>Pacientes</span>
            </button>

            <button
              id="nav-prescriptions-btn"
              onClick={() => handleNavClick('prescriptions')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'prescriptions'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm font-bold'
                  : 'text-slate-600 hover:bg-rose-50/60 hover:text-rose-700'
              }`}
            >
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Prescritor</span>
            </button>

            <button
              id="nav-procedures-btn"
              onClick={() => handleNavClick('procedures')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'procedures'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm font-bold'
                  : 'text-slate-600 hover:bg-rose-50/60 hover:text-rose-700'
              }`}
            >
              <Syringe className="w-4 h-4 text-purple-600" />
              <span>Injetáveis</span>
            </button>

            <button
              id="nav-financial-btn"
              onClick={() => handleNavClick('financial')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'financial'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm font-bold'
                  : 'text-slate-600 hover:bg-emerald-50/60 hover:text-emerald-800'
              }`}
            >
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Financeiro</span>
            </button>

            <button
              id="nav-management-btn"
              onClick={() => handleNavClick('management')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'management'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm font-bold'
                  : 'text-slate-600 hover:bg-rose-50/60 hover:text-rose-700'
              }`}
            >
              <Calculator className="w-4 h-4 text-amber-600" />
              <span>Gestão</span>
            </button>

            <button
              id="nav-legal-btn"
              onClick={() => handleNavClick('legal')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'legal'
                  ? 'bg-sky-50 text-sky-800 border border-sky-200 shadow-sm font-bold'
                  : 'text-slate-600 hover:bg-sky-50/60 hover:text-sky-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>Páginas Legais</span>
            </button>
          </nav>

          {/* Right Section: Compact on mobile (< 768px) */}
          <div className="flex items-center space-x-2 shrink-0 ml-auto">
            {/* Offline indicator if active */}
            {isOffline && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full animate-pulse">
                <WifiOff className="w-3 h-3 text-amber-600" /> Offline
              </span>
            )}

            {/* PWA Install Button - Hidden on Mobile to save space (available in drawer) */}
            {onOpenPWAInstall && (
              <button
                id="btn-navbar-install-pwa"
                onClick={onOpenPWAInstall}
                className="hidden md:flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50/60 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-600 text-xs font-semibold transition"
                title={isPWAInstalled ? "Aplicativo Instalado (PWA)" : "Instalar Aplicativo ConsuDerme (PWA)"}
              >
                <Download className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden xl:inline">{isPWAInstalled ? 'App Ativo' : 'Instalar App'}</span>
                <span className="xl:hidden">PWA</span>
              </button>
            )}

            {/* Quick DermIA AI button - Hidden on screens < 768px (FAB is always active at bottom right!) */}
            <button
              id="btn-navbar-dermia"
              onClick={onOpenDermia}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold transition shadow-md shadow-rose-500/20"
              title="Abrir DermIA — Inteligência Artificial por Voz e Microfone"
            >
              <Mic className="w-3.5 h-3.5 text-white animate-pulse" />
              <span>DermIA (Voz & IA)</span>
            </button>

            {/* Doctor Profile Button - Compact on Mobile */}
            <button
              id="btn-open-doctor-settings"
              onClick={onOpenSettings}
              className="flex items-center space-x-1.5 sm:space-x-2 bg-slate-50 hover:bg-rose-50/50 text-slate-700 border border-slate-200 hover:border-rose-200 p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium transition"
              title="Configurar Dados do Médico e Consultório"
            >
              <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <div className="text-left hidden md:block">
                <div className="font-semibold text-slate-800 truncate max-w-[110px] lg:max-w-[130px]">
                  {doctorProfile.name || 'Dr(a). Dermatologista'}
                </div>
                <div className="text-[10px] text-rose-600 font-mono font-bold">
                  CRM {doctorProfile.crm || '---'}/{doctorProfile.uf || 'UF'}
                </div>
              </div>
              <Settings className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 hidden sm:block" />
            </button>

            {/* Mobile/Tablet Menu Toggle - Aligned Right with High Z-Index */}
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ zIndex: 1000 }}
              className="lg:hidden p-2 rounded-xl bg-slate-50 text-slate-700 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 transition shrink-0 relative focus:outline-none focus:ring-2 focus:ring-rose-400"
              title="Menu de Navegação"
              aria-label="Abrir Menu Principal"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-rose-600" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Drawer Menu with High Z-Index (1000) */}
      {mobileMenuOpen && (
        <div 
          style={{ zIndex: 1000 }}
          className="lg:hidden bg-white/98 backdrop-blur-md border-b border-rose-200/80 px-4 pt-3 pb-6 space-y-1 animate-fadeIn shadow-2xl w-full max-w-full box-border"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
            Menu de Navegação Principal
          </div>

          <button
            onClick={() => handleNavClick('dashboard')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition ${
              activeTab === 'dashboard' ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200' : 'text-slate-700 hover:bg-rose-50/50'
            }`}
          >
            <Layers className="w-4 h-4 text-rose-500" />
            <span>Painel Principal</span>
          </button>

          <button
            onClick={() => handleNavClick('clinical')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition ${
              activeTab === 'clinical' ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200' : 'text-slate-700 hover:bg-rose-50/50'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-rose-500" />
            <span>[1] Consulta Clínica & Copiloto</span>
          </button>

          <button
            onClick={() => handleNavClick('patients')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition ${
              activeTab === 'patients' ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200' : 'text-slate-700 hover:bg-teal-50/50'
            }`}
          >
            <Users className="w-4 h-4 text-teal-600" />
            <span>Base de Pacientes & Fitzpatrick</span>
          </button>

          <button
            onClick={() => handleNavClick('prescriptions')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition ${
              activeTab === 'prescriptions' ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200' : 'text-slate-700 hover:bg-rose-50/50'
            }`}
          >
            <FileText className="w-4 h-4 text-teal-600" />
            <span>[3] Prescritor & Fórmulas Magistrais</span>
          </button>

          <button
            onClick={() => handleNavClick('procedures')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition ${
              activeTab === 'procedures' ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200' : 'text-slate-700 hover:bg-rose-50/50'
            }`}
          >
            <Syringe className="w-4 h-4 text-purple-600" />
            <span>Guia Injetáveis & Anatomia de Risco</span>
          </button>

          <button
            onClick={() => handleNavClick('financial')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition ${
              activeTab === 'financial' ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200' : 'text-slate-700 hover:bg-emerald-50/50'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Fluxo de Caixa & Gestão Financeira</span>
          </button>

          <button
            onClick={() => handleNavClick('management')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition ${
              activeTab === 'management' ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200' : 'text-slate-700 hover:bg-rose-50/50'
            }`}
          >
            <Calculator className="w-4 h-4 text-amber-600" />
            <span>[4] Gestão de Pacientes & Precificação</span>
          </button>

          <button
            onClick={() => handleNavClick('legal')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition ${
              activeTab === 'legal' ? 'bg-sky-50 text-sky-800 font-bold border border-sky-200' : 'text-slate-700 hover:bg-sky-50/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>[2] Páginas Legais, LGPD & TCLEs</span>
          </button>

          <div className="pt-3 border-t border-rose-100 space-y-2">
            {onOpenPWAInstall && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPWAInstall();
                }}
                className="w-full py-2.5 px-3 bg-slate-50 hover:bg-rose-50 border border-slate-200 text-rose-600 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition"
              >
                <Download className="w-4 h-4 text-rose-500" />
                <span>{isPWAInstalled ? 'App ConsuDerme Instalado' : 'Instalar Aplicativo (PWA)'}</span>
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDermia();
              }}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-rose-500/20"
            >
              <Mic className="w-4 h-4" />
              <span>Abrir DermIA (Voz & Microfone IA)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
