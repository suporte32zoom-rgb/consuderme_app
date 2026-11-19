import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  UserCheck, 
  Info,
  Sparkles
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { WelcomeDashboard } from './components/WelcomeDashboard';
import { LegalDocumentsModule } from './components/LegalDocumentsModule';
import { ClinicalConsultationModule } from './components/ClinicalConsultationModule';
import { PrescriptionModule } from './components/PrescriptionModule';
import { ProceduresGuideModule } from './components/ProceduresGuideModule';
import { ClinicManagementModule } from './components/ClinicManagementModule';
import { FinancialCashFlowModule } from './components/FinancialCashFlowModule';
import { DermiaCopilot } from './components/DermiaCopilot';
import { PatientDatabaseModule } from './components/PatientDatabaseModule';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { usePWA } from './hooks/usePWA';
import { DoctorProfile, NavigationTab, FitzpatrickType, PatientRecord } from './types';
import { safeStorageGet, safeStorageSet, safeString } from './utils/safeHelpers';
import { ConsultationHistoryEntry } from './utils/consultationStorage';
import { markPatientLastVisit } from './utils/patientStorage';

// Default clean doctor profile (ready for real medical data entry)
const DEFAULT_DOCTOR_PROFILE: DoctorProfile = {
  name: 'Dr(a). Médico(a) Dermatologista',
  crm: '123456',
  uf: 'SP',
  rqe: '98765',
  clinicName: 'Clínica Dermatológica & Saúde da Pele',
  email: 'contato@consultorio.med.br',
  phone: '(11) 98765-4321',
  address: 'Av. Paulista, 1000 - Conj. 82 - Bela Vista, São Paulo/SP'
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isDermiaOpen, setIsDermiaOpen] = useState(false);
  const [showPWAModal, setShowPWAModal] = useState(false);

  // Progressive Web App (PWA) lifecycle & status
  const {
    isInstallable,
    isInstalled,
    isOffline,
    hasUpdate,
    installPWA,
    updateApp
  } = usePWA();

  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile>(() => {
    const saved = safeStorageGet<Partial<DoctorProfile>>('consuderme_doctor_profile', DEFAULT_DOCTOR_PROFILE);
    return {
      ...DEFAULT_DOCTOR_PROFILE,
      ...(saved && typeof saved === 'object' ? saved : {})
    };
  });

  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<ConsultationHistoryEntry | null>(null);
  const [selectedPatientForConsultation, setSelectedPatientForConsultation] = useState<PatientRecord | null>(null);
  const [prescriptionInitialData, setPrescriptionInitialData] = useState<{
    indication?: string;
    fitzpatrick?: FitzpatrickType;
    complaint?: string;
  } | undefined>(undefined);

  // Check URL query parameters for PWA shortcut launch
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam) {
        if (tabParam === 'dermia') {
          setIsDermiaOpen(true);
        } else if (['dashboard', 'clinical', 'patients', 'prescriptions', 'procedures', 'financial', 'management', 'legal'].includes(tabParam)) {
          setActiveTab(tabParam as NavigationTab);
        }
      }
    } catch (e) {
      // safe fallback
    }
  }, []);

  // Save profile to local storage whenever updated
  useEffect(() => {
    safeStorageSet('consuderme_doctor_profile', doctorProfile);
  }, [doctorProfile]);

  const handleUpdateDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDoctorModal(false);
  };

  const handleNavigateToPrescription = (data: { indication: string; fitzpatrick: FitzpatrickType; complaint: string }) => {
    setPrescriptionInitialData(data);
    setActiveTab('prescriptions');
  };

  const handleNavigateToPostCare = (_data: { procedure: string; patientName: string }) => {
    setActiveTab('procedures');
  };

  const handleSelectConsultationFromHistory = (entry: ConsultationHistoryEntry) => {
    setSelectedHistoryEntry(entry);
    setActiveTab('clinical');
  };

  const handleStartConsultationWithPatient = (patient: PatientRecord) => {
    setSelectedPatientForConsultation(patient);
    markPatientLastVisit(patient.id);
    setActiveTab('clinical');
  };

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#F8F9FA] text-slate-800 flex flex-col font-sans antialiased box-border selection:bg-rose-100 selection:text-rose-950">
      {/* PWA Alerts & Install Modal */}
      <PWAInstallBanner
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isOffline={isOffline}
        hasUpdate={hasUpdate}
        onInstall={installPWA}
        onUpdate={updateApp}
        isOpenModal={showPWAModal}
        onCloseModal={() => setShowPWAModal(false)}
      />

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onNavigate={setActiveTab}
        doctorProfile={doctorProfile}
        onOpenSettings={() => setShowDoctorModal(true)}
        onOpenDermia={() => setIsDermiaOpen(true)}
        onOpenPWAInstall={() => setShowPWAModal(true)}
        isPWAInstalled={isInstalled}
        isOffline={isOffline}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 box-border overflow-x-hidden">
        {/* Render Tab Content */}
        {activeTab === 'dashboard' && (
          <WelcomeDashboard
            doctorProfile={doctorProfile}
            onNavigate={setActiveTab}
            onOpenSettings={() => setShowDoctorModal(true)}
            onOpenDermia={() => setIsDermiaOpen(true)}
            onOpenPWAInstall={() => setShowPWAModal(true)}
            isPWAInstalled={isInstalled}
            onSelectConsultation={handleSelectConsultationFromHistory}
          />
        )}

        {activeTab === 'clinical' && (
          <ClinicalConsultationModule
            doctorProfile={doctorProfile}
            initialConsultation={selectedHistoryEntry}
            initialPatient={selectedPatientForConsultation}
            onNavigateToPatients={() => setActiveTab('patients')}
            onNavigateToPrescription={handleNavigateToPrescription}
            onNavigateToPostCare={handleNavigateToPostCare}
          />
        )}

        {activeTab === 'patients' && (
          <PatientDatabaseModule
            doctorProfile={doctorProfile}
            onStartConsultationWithPatient={handleStartConsultationWithPatient}
          />
        )}

        {activeTab === 'prescriptions' && (
          <PrescriptionModule
            doctorProfile={doctorProfile}
            initialData={prescriptionInitialData}
          />
        )}

        {activeTab === 'procedures' && (
          <ProceduresGuideModule
            doctorProfile={doctorProfile}
          />
        )}

        {activeTab === 'financial' && (
          <FinancialCashFlowModule
            doctorProfile={doctorProfile}
          />
        )}

        {activeTab === 'management' && (
          <ClinicManagementModule
            doctorProfile={doctorProfile}
          />
        )}

        {activeTab === 'legal' && (
          <LegalDocumentsModule
            doctorProfile={doctorProfile}
          />
        )}
      </main>

      {/* Persistent DermIA Floating AI Copilot */}
      <DermiaCopilot
        doctorProfile={doctorProfile}
        isOpen={isDermiaOpen}
        onClose={() => setIsDermiaOpen(false)}
        onOpen={() => setIsDermiaOpen(true)}
        onNavigate={setActiveTab}
      />

      {/* Footer with min 90px bottom padding on mobile for FAB clearance */}
      <footer className="border-t border-rose-100/80 bg-white/90 backdrop-blur pt-6 pb-28 md:pb-8 px-4 sm:px-6 lg:px-8 mt-12 text-slate-500 text-xs shadow-sm w-full max-w-full box-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-100 to-pink-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm shrink-0">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-800">
                CONSU<span className="text-rose-500">DERME</span> — Consultório Virtual & Copiloto DermIA
              </p>
              <p className="text-[11px] text-slate-500">
                Em conformidade com a Resolução CFM nº 2.314/2022 (Telemedicina e IA Médica), Marco Civil da Internet (Lei 12.965/14) e LGPD Sensível (Lei 13.709/18).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] shrink-0">
            <button
              onClick={() => setActiveTab('legal')}
              className="text-slate-600 hover:text-rose-600 font-medium transition"
            >
              Documentos Legais & TCLEs
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => setIsDermiaOpen(true)}
              className="text-rose-600 hover:text-rose-700 font-bold transition flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>DermIA</span>
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => setShowDoctorModal(true)}
              className="text-slate-600 hover:text-rose-600 font-medium transition"
            >
              Credenciais do Médico
            </button>
          </div>
        </div>
      </footer>

      {/* Doctor Profile Settings Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white border border-rose-100 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Identificação do Médico Responsável</h3>
                  <p className="text-[11px] text-slate-500">Personaliza receitas, laudos, atestados e termos legais</p>
                </div>
              </div>
              <button
                onClick={() => setShowDoctorModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateDoctor} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={safeString(doctorProfile.name)}
                  onChange={(e) => setDoctorProfile({ ...doctorProfile, name: e.target.value })}
                  placeholder="Ex: Dra. Mariana Vasconcelos"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">CRM</label>
                  <input
                    type="text"
                    value={safeString(doctorProfile.crm)}
                    onChange={(e) => setDoctorProfile({ ...doctorProfile, crm: e.target.value })}
                    placeholder="123456"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">UF</label>
                  <input
                    type="text"
                    value={safeString(doctorProfile.uf)}
                    onChange={(e) => setDoctorProfile({ ...doctorProfile, uf: e.target.value.toUpperCase() })}
                    placeholder="SP"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">RQE</label>
                  <input
                    type="text"
                    value={safeString(doctorProfile.rqe)}
                    onChange={(e) => setDoctorProfile({ ...doctorProfile, rqe: e.target.value })}
                    placeholder="7890"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nome do Consultório / Clínica</label>
                <input
                  type="text"
                  value={safeString(doctorProfile.clinicName)}
                  onChange={(e) => setDoctorProfile({ ...doctorProfile, clinicName: e.target.value })}
                  placeholder="Ex: Instituto da Pele Mariana Vasconcelos"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={safeString(doctorProfile.phone)}
                    onChange={(e) => setDoctorProfile({ ...doctorProfile, phone: e.target.value })}
                    placeholder="(11) 98765-4321"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">E-mail Profissional</label>
                  <input
                    type="email"
                    value={safeString(doctorProfile.email)}
                    onChange={(e) => setDoctorProfile({ ...doctorProfile, email: e.target.value })}
                    placeholder="doutora@clinicadepele.med.br"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Endereço do Consultório</label>
                <input
                  type="text"
                  value={safeString(doctorProfile.address)}
                  onChange={(e) => setDoctorProfile({ ...doctorProfile, address: e.target.value })}
                  placeholder="Ex: Av. Brigadeiro Faria Lima, 2000 - Conj 104 - SP"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-100 text-[11px] text-rose-800 flex items-start gap-2">
                <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>Os dados ficam salvos localmente e são incorporados no cabeçalho e rodapé de todos os atestados, laudos, receitas e termos de consentimento gerados.</span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition"
                >
                  Salvar Dados do Médico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
