import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Sparkles, 
  AlertOctagon, 
  CheckCircle2, 
  HelpCircle, 
  FileText, 
  Share2, 
  Printer, 
  AlertTriangle, 
  RotateCcw, 
  ChevronRight, 
  Activity, 
  Eye, 
  Layers, 
  ShieldAlert, 
  Send,
  Loader2,
  Copy,
  Check,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Save,
  Users,
  UserPlus
} from 'lucide-react';
import { FITZPATRICK_SCALE, CLINICAL_PRESETS, FitzpatrickInfo } from '../data/clinicalTemplates';
import { FitzpatrickType, DifferentialDiagnosisResponse, DoctorProfile, PatientConsultation, PatientRecord } from '../types';
import { directDifferentialDiagnosis } from '../services/geminiDirect';
import { safeArray, safeJoin, safeString } from '../utils/safeHelpers';
import { ConsultationHistoryEntry, saveConsultationToHistory } from '../utils/consultationStorage';
import { loadPatients, markPatientLastVisit, savePatientRecord } from '../utils/patientStorage';
import { ConsultationHistory } from './ConsultationHistory';

interface ClinicalConsultationModuleProps {
  doctorProfile: DoctorProfile;
  initialConsultation?: ConsultationHistoryEntry | null;
  initialPatient?: PatientRecord | null;
  onNavigateToPatients?: () => void;
  onNavigateToPrescription?: (patientData: { indication: string; fitzpatrick: FitzpatrickType; complaint: string }) => void;
  onNavigateToPostCare?: (patientData: { procedure: string; patientName: string }) => void;
}

export const ClinicalConsultationModule: React.FC<ClinicalConsultationModuleProps> = ({
  doctorProfile,
  initialConsultation,
  initialPatient,
  onNavigateToPatients,
  onNavigateToPrescription,
  onNavigateToPostCare
}) => {
  // Anamnesis Form State
  const [patientName, setPatientName] = useState('');
  const [fitzpatrick, setFitzpatrick] = useState<FitzpatrickType>('III');
  const [complaint, setComplaint] = useState('');
  const [evolutionTime, setEvolutionTime] = useState('');
  const [topography, setTopography] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [previousTreatments, setPreviousTreatments] = useState('');
  const [comorbidities, setComorbidities] = useState('');
  const [allergies, setAllergies] = useState('');
  const [photoDesc, setPhotoDesc] = useState('');

  // AI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<DifferentialDiagnosisResponse | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isDictatingComplaint, setIsDictatingComplaint] = useState(false);
  const [isSpeakingAnalysis, setIsSpeakingAnalysis] = useState(false);

  const [savedNotice, setSavedNotice] = useState(false);
  const [registeredPatients, setRegisteredPatients] = useState<PatientRecord[]>(() => loadPatients());
  const [selectedPatientRecord, setSelectedPatientRecord] = useState<PatientRecord | null>(null);
  const [patientQuickSaved, setPatientQuickSaved] = useState(false);

  // Sync registered patients directory
  useEffect(() => {
    const syncPatients = () => setRegisteredPatients(loadPatients());
    window.addEventListener('consuderme:patients-updated', syncPatients);
    window.addEventListener('storage', syncPatients);
    return () => {
      window.removeEventListener('consuderme:patients-updated', syncPatients);
      window.removeEventListener('storage', syncPatients);
    };
  }, []);

  const handleApplyPatientRecord = (patient: PatientRecord) => {
    setSelectedPatientRecord(patient);
    setPatientName(safeString(patient.fullName));
    setFitzpatrick(patient.fitzpatrick || 'III');
    setAllergies(safeString(patient.allergies));
    setComorbidities(safeString(patient.comorbidities));
    setPreviousTreatments(safeString(patient.previousTreatments));
    setError(null);
  };

  // Load initial consultation if passed from Dashboard
  useEffect(() => {
    if (initialConsultation) {
      handleLoadFromHistory(initialConsultation);
    }
  }, [initialConsultation]);

  // Load initial patient if passed from PatientDatabaseModule
  useEffect(() => {
    if (initialPatient) {
      handleApplyPatientRecord(initialPatient);
    }
  }, [initialPatient]);

  const handleLoadFromHistory = (entry: ConsultationHistoryEntry) => {
    setSelectedPatientRecord(null);
    setPatientName(safeString(entry.patientName) === 'Paciente não identificado' ? '' : safeString(entry.patientName));
    setFitzpatrick(entry.fitzpatrick || 'III');
    setComplaint(safeString(entry.complaint));
    setEvolutionTime(safeString(entry.evolutionTime));
    setTopography(safeString(entry.topography));
    setSymptoms(safeString(entry.symptoms));
    setPreviousTreatments(safeString(entry.previousTreatments));
    setComorbidities(safeString(entry.comorbidities));
    setAllergies(safeString(entry.allergies));
    setPhotoDesc(safeString(entry.photoDesc));
    setError(null);
  };

  // Dictate complaint via microphone
  const toggleComplaintDictation = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setError('Reconhecimento de voz não suportado neste navegador. Use o Google Chrome ou Edge.');
      return;
    }

    if (isDictatingComplaint) {
      setIsDictatingComplaint(false);
      return;
    }

    try {
      const rec = new SpeechRecognitionClass();
      rec.lang = 'pt-BR';
      rec.continuous = false;
      rec.interimResults = true;

      rec.onstart = () => setIsDictatingComplaint(true);
      rec.onresult = (event: any) => {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          text += event.results[i][0].transcript;
        }
        if (text) {
          setComplaint(prev => (prev ? prev + ' ' : '') + text);
        }
      };
      rec.onerror = () => setIsDictatingComplaint(false);
      rec.onend = () => setIsDictatingComplaint(false);
      rec.start();
    } catch (e) {
      console.warn(e);
      setIsDictatingComplaint(false);
    }
  };

  // Speak AI Clinical Analysis
  const toggleSpeakAnalysis = () => {
    if (!('speechSynthesis' in window) || !aiResult) return;

    if (isSpeakingAnalysis) {
      window.speechSynthesis.cancel();
      setIsSpeakingAnalysis(false);
      return;
    }

    const diffSummary = safeJoin(
      safeArray<any>(aiResult.differentials).map(d => `${safeString(d?.disease)}, probabilidade ${safeString(d?.probability)}`),
      '. '
    );
    const textToSpeak = `Resumo clínico para o paciente com fototipo ${safeString(fitzpatrick, 'III')}. Diagnósticos diferenciais mais prováveis: ${diffSummary || 'em avaliação'}. Conduta inicial recomendada: ${safeString(aiResult.initialManagement)}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    utterance.onend = () => setIsSpeakingAnalysis(false);
    utterance.onerror = () => setIsSpeakingAnalysis(false);
    setIsSpeakingAnalysis(true);
    window.speechSynthesis.speak(utterance);
  };

  // Load a quick clinical preset
  const handleApplyPreset = (presetId: string) => {
    const preset = CLINICAL_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setFitzpatrick(preset.fitzpatrick || 'III');
    setComplaint(safeString(preset.complaint));
    setEvolutionTime(safeString(preset.evolutionTime));
    setTopography(safeString(preset.topography));
    setSymptoms(safeJoin(preset.symptoms));
    setPreviousTreatments(safeString(preset.previousTreatments));
    setComorbidities(safeString(preset.comorbidities));
    setAllergies(safeString(preset.allergies));
  };

  // Reset form to 100% clean state
  const handleClearForm = () => {
    setSelectedPatientRecord(null);
    setPatientName('');
    setFitzpatrick('III');
    setComplaint('');
    setEvolutionTime('');
    setTopography('');
    setSymptoms('');
    setPreviousTreatments('');
    setComorbidities('');
    setAllergies('');
    setPhotoDesc('');
    setAiResult(null);
    setError(null);
  };

  // Save current patient info quickly into Patient Database
  const handleQuickSavePatient = () => {
    const cleanName = safeString(patientName).trim();
    if (!cleanName) {
      setError('Informe o nome do paciente antes de salvar na Base de Pacientes.');
      return;
    }
    const { saved } = savePatientRecord({
      id: selectedPatientRecord?.id,
      fullName: cleanName,
      phone: safeString(selectedPatientRecord?.phone),
      email: safeString(selectedPatientRecord?.email),
      birthDate: safeString(selectedPatientRecord?.birthDate),
      cpf: safeString(selectedPatientRecord?.cpf),
      fitzpatrick: fitzpatrick || 'III',
      allergies: safeString(allergies),
      comorbidities: safeString(comorbidities),
      previousTreatments: safeString(previousTreatments),
      medicalHistoryNotes: safeString(selectedPatientRecord?.medicalHistoryNotes)
    });
    if (saved) {
      setSelectedPatientRecord(saved);
      setError(null);
      setPatientQuickSaved(true);
      setTimeout(() => setPatientQuickSaved(false), 2500);
    }
  };

  // Manual save to localStorage history
  const handleManualSaveHistory = () => {
    if (!safeString(complaint).trim() && !safeString(patientName).trim()) {
      setError('Informe ao menos o nome do paciente ou a queixa principal para salvar no histórico.');
      return;
    }
    const topDisease = safeArray<any>(aiResult?.differentials)[0]?.disease || '';
    saveConsultationToHistory({
      patientName: safeString(patientName).trim() || 'Paciente não identificado',
      fitzpatrick: fitzpatrick || 'III',
      complaint: safeString(complaint),
      evolutionTime: safeString(evolutionTime),
      topography: safeString(topography),
      symptoms: safeJoin(symptoms),
      previousTreatments: safeString(previousTreatments),
      comorbidities: safeString(comorbidities),
      allergies: safeString(allergies),
      photoDesc: safeString(photoDesc),
      primaryHypothesis: safeString(topDisease),
      differentialSummary: safeString(aiResult?.summary)
    });
    setError(null);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  // Submit to Gemini Copilot
  const handleRunCopilotAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!safeString(complaint).trim()) {
      setError('Por favor, informe ao menos a Queixa Principal / HMA para processar a análise.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const normalizedSymptoms = safeJoin(symptoms);
      const data = await directDifferentialDiagnosis({
        fitzpatrick: fitzpatrick || 'III',
        complaint: safeString(complaint),
        evolutionTime: safeString(evolutionTime),
        topography: safeString(topography),
        symptoms: normalizedSymptoms,
        previousTreatments: safeString(previousTreatments),
        comorbidities: safeString(comorbidities),
        allergies: safeString(allergies),
        photoDesc: safeString(photoDesc)
      });

      setAiResult(data as any);

      // Persist basic consultation info safely in localStorage
      const topDisease = safeArray<any>(data?.differentials)[0]?.disease || '';
      saveConsultationToHistory({
        patientName: safeString(patientName).trim() || 'Paciente não identificado',
        fitzpatrick: fitzpatrick || 'III',
        complaint: safeString(complaint),
        evolutionTime: safeString(evolutionTime),
        topography: safeString(topography),
        symptoms: normalizedSymptoms,
        previousTreatments: safeString(previousTreatments),
        comorbidities: safeString(comorbidities),
        allergies: safeString(allergies),
        photoDesc: safeString(photoDesc),
        primaryHypothesis: safeString(topDisease),
        differentialSummary: safeString(data?.summary)
      });
      if (selectedPatientRecord?.id) {
        markPatientLastVisit(selectedPatientRecord.id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao processar análise semiológica.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAnalysis = () => {
    if (!aiResult) return;
    const differentialsText = safeJoin(
      safeArray<any>(aiResult.differentials).map((d, i) => `${i + 1}. [${safeString(d?.probability)}] ${safeString(d?.disease)} — ${safeString(d?.clinicalRationale)}`),
      '\n'
    );
    const redFlagsText = safeJoin(
      safeArray<any>(aiResult.redFlags).map(r => `• [${safeString(r?.severity)}] ${safeString(r?.warningTitle)}: ${safeString(r?.actionProtocol)}`),
      '\n'
    );
    const workupText = safeJoin(aiResult.diagnosticWorkup, ' | ');

    const text = `
CONSU-DERME — ANÁLISE CLÍNICA & COPILOTO DERMATOLÓGICO
Paciente: ${safeString(patientName) || 'Não identificado'} | Fototipo: Fitzpatrick ${safeString(fitzpatrick, 'III')}
Médico: ${safeString(doctorProfile?.name) || 'Médico Assistente'} (CRM: ${safeString(doctorProfile?.crm)}/${safeString(doctorProfile?.uf)})

RESUMO SEMIOLÓGICO:
${safeString(aiResult.summary)}

DIAGNÓSTICOS DIFERENCIAIS (Por Probabilidade):
${differentialsText}

ALERTAS DE NEOPLASIAS / RED FLAGS:
${redFlagsText}

INVESTIGAÇÃO PROPAGATÓRIA:
${workupText}

CONDUTA INICIAL:
${safeString(aiResult.initialManagement)}

*Nota: Suporte à decisão clínica. A responsabilidade do diagnóstico e ato médico é exclusiva do CRM cadastrado.*
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 text-white rounded-2xl p-6 border border-teal-800/40 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-teal-500/20 text-teal-300 text-xs font-semibold mb-2 border border-teal-500/30">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>MÓDULO 2: ATENDIMENTO CLÍNICO E COPILOTO DERMATOLÓGICO</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Anamnese Estruturada & Diagnóstico Diferencial com IA
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl mt-1 leading-relaxed">
              Estratificação semiológica completa pelo <strong>Fototipo de Fitzpatrick (I–VI)</strong>, classificação de probabilidades diagnósticas e detecção de sinais de alarme em oncologia cutânea (Melanoma, CBC, CEC).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleManualSaveHistory}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl border border-teal-500 flex items-center gap-1.5 transition"
              title="Salvar atendimento atual no histórico local"
            >
              {savedNotice ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savedNotice ? 'Salvo no Histórico!' : 'Salvar no Histórico'}</span>
            </button>
            <button
              type="button"
              onClick={handleClearForm}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
              title="Limpar formulário para novo paciente"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Novo Atendimento Limpo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Clinical Form + AI Differential Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Anamnesis Form */}
        <div className="lg:col-span-6 space-y-4">
          {/* Quick Presets for Demo/Rapid Entry */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Modelos Semiológicos de Referência
              </span>
              <span className="text-[10px] text-slate-400">Preenchimento com 1 clique</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {CLINICAL_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p.id)}
                  className="text-left p-2 rounded-lg bg-slate-50 hover:bg-teal-50/70 border border-slate-200 hover:border-teal-300 text-xs text-slate-800 transition truncate"
                  title={p.complaint}
                >
                  <span className="font-semibold text-[11px] block text-slate-900 truncate">{p.title}</span>
                  <span className="text-[10px] text-slate-500">Fitzpatrick {p.fitzpatrick}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Anamnesis Form */}
          <form onSubmit={handleRunCopilotAnalysis} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                Ficha de Anamnese & Semiopatologia
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                100% Confidencial
              </span>
            </div>

            {/* Quick Patient Retrieval from PatientDatabaseModule */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-teal-600" />
                  <span>Recuperação Rápida da Base de Pacientes</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleQuickSavePatient}
                    className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                  >
                    {patientQuickSaved ? <Check className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                    <span>{patientQuickSaved ? 'Ficha salva na Base!' : selectedPatientRecord ? 'Atualizar na Base' : 'Salvar na Base'}</span>
                  </button>
                  {onNavigateToPatients && (
                    <>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <button
                        type="button"
                        onClick={onNavigateToPatients}
                        className="text-[11px] font-semibold text-slate-600 hover:text-slate-900"
                      >
                        Gerenciar Base
                      </button>
                    </>
                  )}
                </div>
              </div>

              <select
                value={selectedPatientRecord?.id || ''}
                onChange={(e) => {
                  const chosenId = e.target.value;
                  if (!chosenId) {
                    setSelectedPatientRecord(null);
                    return;
                  }
                  const found = safeArray<PatientRecord>(registeredPatients).find((p) => p.id === chosenId);
                  if (found) {
                    handleApplyPatientRecord(found);
                  }
                }}
                aria-label="Selecionar paciente cadastrado para consulta"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">
                  {registeredPatients.length > 0
                    ? `Selecionar paciente cadastrado (${registeredPatients.length})...`
                    : 'Nenhum paciente cadastrado na Base ainda'}
                </option>
                {safeArray<PatientRecord>(registeredPatients).map((p) => (
                  <option key={p.id} value={p.id}>
                    {safeString(p.fullName)} — Fototipo {safeString(p.fitzpatrick, 'III')}
                    {p.phone ? ` · ${p.phone}` : ''}
                  </option>
                ))}
              </select>

              {selectedPatientRecord && (
                <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-200/80">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span>
                      <strong className="text-slate-800">Ficha vinculada:</strong>{' '}
                      {safeString(selectedPatientRecord.fullName)} · Fototipo {selectedPatientRecord.fitzpatrick}
                      {selectedPatientRecord.phone ? ` · ${selectedPatientRecord.phone}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPatientRecord(null)}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
                    >
                      Desvincular
                    </button>
                  </div>
                  {selectedPatientRecord.medicalHistoryNotes && (
                    <p className="text-slate-600">
                      <strong className="text-slate-800">Notas prévias:</strong>{' '}
                      {selectedPatientRecord.medicalHistoryNotes}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Patient Name & Identifier */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Identificação do Paciente (Opcional)
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Ex: Ana Lúcia Silveira (ou deixe em branco para desidentificação)"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              />
            </div>

            {/* Fitzpatrick Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Fototipo de Fitzpatrick (Escala I a VI) *
                </label>
                <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Fototipo {fitzpatrick} Selecionado
                </span>
              </div>

              <div className="grid grid-cols-6 gap-1.5">
                {FITZPATRICK_SCALE.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setFitzpatrick(item.type)}
                    className={`p-2 rounded-lg border text-center transition flex flex-col items-center justify-between ${
                      fitzpatrick === item.type
                        ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div 
                      className="w-5 h-5 rounded-full border border-slate-300 shadow-inner mb-1" 
                      style={{ backgroundColor: item.colorTone }}
                    />
                    <span className="text-xs font-black text-slate-900">{item.type}</span>
                  </button>
                ))}
              </div>

              {/* Selected Fitzpatrick Card Info */}
              {(() => {
                const current = FITZPATRICK_SCALE.find(f => f.type === fitzpatrick);
                return current ? (
                  <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-tight">
                    <span className="font-bold text-slate-800">{current.name}:</span> {current.reaction} • {current.melaninRisk}
                  </div>
                ) : null;
              })()}
            </div>

            {/* Queixa Principal e HMA */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Queixa Principal e História da Moléstia Atual (HMA) *
                </label>
                <button
                  type="button"
                  onClick={toggleComplaintDictation}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition ${
                    isDictatingComplaint
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
                  }`}
                  title={isDictatingComplaint ? 'Parar ditado por voz' : 'Ditar queixa por microfone'}
                >
                  <Mic className="w-3 h-3" />
                  <span>{isDictatingComplaint ? 'Gravando...' : 'Ditar por Voz'}</span>
                </button>
              </div>
              <textarea
                required
                rows={3}
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="Ex: Lesão máculo-papular eritematosa descamativa, de evolução progressiva, com prurido noturno... (Você pode digitar ou ditar pelo microfone)"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              />
            </div>

            {/* Tempo de Evolução & Topografia */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tempo de Evolução
                </label>
                <input
                  type="text"
                  value={evolutionTime}
                  onChange={(e) => setEvolutionTime(e.target.value)}
                  placeholder="Ex: 3 semanas / 6 meses"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Topografia da Lesão
                </label>
                <input
                  type="text"
                  value={topography}
                  onChange={(e) => setTopography(e.target.value)}
                  placeholder="Ex: Região malar e nasal / Dorso"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                />
              </div>
            </div>

            {/* Sintomas Associados */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Sintomas Associados (Prurido, Dor, Sangramento, Descamação)
              </label>
              <input
                type="text"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Ex: Prurido intenso, ardência ao contato com a água, sem febre"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              />
            </div>

            {/* Tratamentos Prévios & Alergias */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tratamentos Prévios Usados
                </label>
                <input
                  type="text"
                  value={previousTreatments}
                  onChange={(e) => setPreviousTreatments(e.target.value)}
                  placeholder="Ex: Corticóide tópico, Hidroquinona 4%"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Alergias / Comorbidades
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="Ex: Nega alergias; Hipertensão em uso de Losartana"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                />
              </div>
            </div>

            {/* Descrição Dermatoscópica Opcional */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                <span>Achados Dermatoscópicos / Semiológicos Adicionais (Opcional)</span>
                <span className="text-[10px] text-slate-400">Padrão pigmentar, rede, véu, vasos</span>
              </label>
              <textarea
                rows={2}
                value={photoDesc}
                onChange={(e) => setPhotoDesc(e.target.value)}
                placeholder="Ex: Rede pigmentada atípica com término abrupto na periferia, glóbulos irregulares em distribuição periférica..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-teal-700/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando Raciocínio Clínico com IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Gerar Diagnóstico Diferencial & Alertas</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column (6 cols): AI Differential Results & Action Suite */}
        <div className="lg:col-span-6 space-y-4">
          {aiResult ? (
            <div className="space-y-4 animate-fadeIn">
              {/* Header with Quick Actions */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Relatório do Copiloto Consuderme
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Análise em conformidade com SBD / CFM
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleSpeakAnalysis}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 border ${
                      isSpeakingAnalysis
                        ? 'bg-teal-600 text-white border-teal-700 animate-pulse'
                        : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200'
                    }`}
                    title="Ouvir análise clínica em áudio falado"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>{isSpeakingAnalysis ? 'Pausar Voz' : 'Ouvir Análise'}</span>
                  </button>

                  <button
                    onClick={handleCopyAnalysis}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1 border border-slate-300"
                    title="Copiar relatório completo"
                  >
                    {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSummary ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Red Flags / Neoplasia Warnings */}
              {aiResult.redFlags && aiResult.redFlags.length > 0 && (
                <div className="bg-red-50/90 border-2 border-red-300 rounded-xl p-4 space-y-2.5 shadow-sm">
                  <div className="flex items-center space-x-2 text-red-800 font-extrabold text-xs uppercase tracking-wider">
                    <AlertOctagon className="w-4 h-4 text-red-600" />
                    <span>Alertas de Urgência & Neoplasias Cutâneas (Melanoma / CBC / CEC)</span>
                  </div>

                  <div className="space-y-2">
                    {safeArray<any>(aiResult.redFlags).map((flag, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-red-200 text-xs">
                        <div className="flex items-center justify-between font-bold text-red-900">
                          <span>{safeString(flag?.warningTitle)}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            flag?.severity === 'Crítico' 
                              ? 'bg-red-600 text-white' 
                              : 'bg-amber-100 text-amber-900'
                          }`}>
                            {safeString(flag?.severity, 'Atenção')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 mt-1 font-medium leading-relaxed">
                          <strong>Conduta Imediata Recomendada:</strong> {safeString(flag?.actionProtocol)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical Semiology Summary */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-teal-600" />
                  <span>Resumo Semiológico</span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {safeString(aiResult.summary)}
                </p>
              </div>

              {/* Ranked Differential Diagnoses Table */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-teal-600" />
                    Diagnósticos Diferenciais (Ordenados por Probabilidade)
                  </span>
                  <span className="text-[10px] text-slate-400">Diretrizes SBD</span>
                </div>

                <div className="space-y-2.5">
                  {safeArray<any>(aiResult.differentials).map((item, idx) => {
                    const prob = safeString(item?.probability, 'Investigar');
                    const isHigh = prob.toLowerCase().includes('alta');
                    const isMedium = prob.toLowerCase().includes('média') || prob.toLowerCase().includes('media');
                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-lg border text-xs transition ${
                          isHigh 
                            ? 'bg-emerald-50/70 border-emerald-300' 
                            : isMedium 
                            ? 'bg-blue-50/70 border-blue-200' 
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-slate-900 text-xs">
                            {idx + 1}. {safeString(item?.disease)}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isHigh 
                              ? 'bg-emerald-600 text-white' 
                              : isMedium 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-slate-200 text-slate-800'
                          }`}>
                            Probabilidade {prob}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-relaxed mt-1">
                          <strong>Justificativa Clínica:</strong> {safeString(item?.clinicalRationale)}
                        </p>
                        {item?.semiologyFeatures && (
                          <p className="text-[10px] text-slate-500 mt-1 italic">
                            Achados cardinais: {safeString(item?.semiologyFeatures)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Diagnostic Workup & Initial Management */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div>
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Exames Complementares / Propedêutica Sugerida
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {safeArray<string>(aiResult.diagnosticWorkup).map((test, i) => (
                      <span key={i} className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-200">
                        {safeString(test)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Conduta Inicial & Cuidados da Barreira Cutânea
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {aiResult.initialManagement}
                  </p>
                </div>
              </div>

              {/* Next Step Flow Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateToPrescription) {
                      const topDisease = safeArray<any>(aiResult.differentials)[0]?.disease || safeString(complaint);
                      onNavigateToPrescription({
                        indication: safeString(topDisease),
                        fitzpatrick: fitzpatrick || 'III',
                        complaint: safeString(complaint)
                      });
                    }
                  }}
                  className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <FileText className="w-4 h-4" />
                  <span>Criar Prescrição / Fórmulas</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateToPostCare) {
                      onNavigateToPostCare({
                        procedure: safeString(safeArray<any>(aiResult.differentials)[0]?.disease, 'Procedimento Clínico'),
                        patientName: safeString(patientName, 'Paciente')
                      });
                    }
                  }}
                  className="p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <Send className="w-4 h-4" />
                  <span>Orientações para WhatsApp</span>
                </button>
              </div>
            </div>
          ) : (
            /* Empty State Placeholder */
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center flex flex-col items-center justify-center min-h-[420px] text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-400">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-700 text-sm">
                Aguardando Início da Anamnese
              </h4>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Preencha os dados semiológicos ao lado ou selecione um modelo de referência para que o copiloto de IA processe o diagnóstico diferencial e verifique sinais de neoplasias.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/60 text-slate-600 text-[11px] font-medium">
                <ShieldAlert className="w-3.5 h-3.5 text-teal-600" />
                <span>Rastreio de Melanoma, CBC, CEC e Farmacodermias</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Histórico de Atendimentos (localStorage) */}
      <ConsultationHistory onSelectConsultation={handleLoadFromHistory} />
    </div>
  );
};
