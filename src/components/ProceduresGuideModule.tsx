import React, { useState } from 'react';
import { 
  Syringe, 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  Layers, 
  Send, 
  Printer, 
  Copy, 
  Check, 
  HeartHandshake, 
  Activity, 
  Loader2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { INJECTABLE_ZONES, InjectableZoneReference } from '../data/clinicalTemplates';
import { DoctorProfile, ProcedureGuideResponse, PostCareResponse } from '../types';
import { directProcedureGuide, directPostCareGenerator } from '../services/geminiDirect';

interface ProceduresGuideModuleProps {
  doctorProfile: DoctorProfile;
}

export const ProceduresGuideModule: React.FC<ProceduresGuideModuleProps> = ({ doctorProfile }) => {
  const [selectedZoneIndex, setSelectedZoneIndex] = useState<number>(0);
  const [customProcedureType, setCustomProcedureType] = useState('Toxina Botulínica Terço Superior e Masseter');
  const [targetArea, setTargetArea] = useState('Fronte, Glabela e Ângulo Mandibular');
  const [patientProfile, setPatientProfile] = useState('Feminino, 42 anos, hipertrofia de masseter e rugas dinâmicas acentuadas');

  // AI State for Procedure Guide
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [guideData, setGuideData] = useState<ProcedureGuideResponse | null>(null);
  const [guideError, setGuideError] = useState<string | null>(null);

  // Post Care State
  const [postCarePatient, setPostCarePatient] = useState('');
  const [loadingPostCare, setLoadingPostCare] = useState(false);
  const [postCareData, setPostCareData] = useState<PostCareResponse | null>(null);
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);

  const currentZone = INJECTABLE_ZONES[selectedZoneIndex];

  // Request custom procedure protocol via direct Gemini 3.7 Flash REST
  const handleGenerateCustomGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingGuide(true);
    setGuideError(null);

    try {
      const data = await directProcedureGuide({
        procedureType: customProcedureType,
        targetArea,
        patientProfile
      });

      setGuideData(data as any);
    } catch (err: any) {
      console.error(err);
      setGuideError(err.message || 'Erro ao gerar guia de procedimento.');
    } finally {
      setLoadingGuide(false);
    }
  };

  // Generate Post Care Instructions for WhatsApp / Print via direct REST
  const handleGeneratePostCare = async () => {
    setLoadingPostCare(true);
    try {
      const data = await directPostCareGenerator({
        procedure: customProcedureType,
        patientName: postCarePatient || 'Paciente',
        doctorName: doctorProfile.name || 'Dr(a). Dermatologista',
        clinicPhone: doctorProfile.phone || '(11) 99999-9999',
        specificNotes: 'Evitar manipular a área tratada nas primeiras 24 horas.'
      });

      setPostCareData(data as any);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPostCare(false);
    }
  };

  const handleCopyWhatsapp = () => {
    if (!postCareData) return;
    navigator.clipboard.writeText(postCareData.whatsappMessage);
    setCopiedWhatsapp(true);
    setTimeout(() => setCopiedWhatsapp(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title Header */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 border border-purple-800/40 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 text-xs font-semibold mb-2 border border-purple-500/30">
              <Syringe className="w-3.5 h-3.5" />
              <span>GUIA DE PROCEDIMENTOS INJETÁVEIS & ANATOMIA SEGURA</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Dosimetria, Planos Anatômicos & Protocolo de Emergência
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl mt-1 leading-relaxed">
              Mapeamento de doses recomendadas de <strong>Toxina Botulínica (UI)</strong>, planos de <strong>Ácido Hialurônico / Bioestimuladores</strong>, delimitação de vasos de risco e protocolo imediato de <strong>Hialuronidase</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 2-Columns layout: Reference Zones & AI Custom Protocol */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Visual Quick Reference Table & Zones */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" />
                Zonas Faciais & Dosimetria Padrão
              </span>
              <span className="text-[10px] text-slate-400">Consenso SBD</span>
            </div>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {INJECTABLE_ZONES.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedZoneIndex(idx)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition flex items-center justify-between ${
                    selectedZoneIndex === idx
                      ? 'bg-purple-50 border border-purple-400 font-bold text-purple-950'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{item.zone}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Selected Zone Deep Anatomical Card */}
          <div className="bg-white rounded-xl border-2 border-purple-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2">
              <h3 className="text-sm font-extrabold text-purple-950">
                {currentZone.zone}
              </h3>
              <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                Referência Anatômica
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="font-bold text-slate-800 block">Músculos / Estrutura Alvo:</span>
                <span className="text-slate-600">{currentZone.targetMuscles}</span>
              </div>

              <div>
                <span className="font-bold text-slate-800 block">Dose Média Recomendada:</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                  {currentZone.botoxUnitsAverage}
                </span>
              </div>

              <div>
                <span className="font-bold text-slate-800 block">Plano Anatômico de Injeção:</span>
                <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] block mt-0.5">
                  {currentZone.injectionPlane}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200">
                <span className="font-bold text-red-900 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  Vasos de Risco Vascular:
                </span>
                <span className="text-[11px] text-red-800 block mt-0.5">
                  {currentZone.dangerVessels}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                <strong>Regra de Segurança:</strong> {currentZone.safetyTips}
              </div>
            </div>
          </div>

          {/* Emergency Vascular Occlusion Protocol Box */}
          <div className="bg-red-900 text-white rounded-xl p-4 shadow-md space-y-2 border border-red-700">
            <div className="flex items-center space-x-2 text-red-200 font-extrabold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Protocolo Imediato de Oclusão Vascular (Hialuronidase)</span>
            </div>
            <p className="text-[11px] text-red-100 leading-relaxed">
              <strong>1. Parada Imediata</strong> da injeção ao menor sinal de branqueamento da pele (blanching), livedo reticular ou dor intensa.
            </p>
            <p className="text-[11px] text-red-100 leading-relaxed">
              <strong>2. Hialuronidase em Alta Dose:</strong> Injetar 500 a 1500 UI de Hialuronidase por quadrante afetado e em todo o trajeto arterial suspeito a cada hora, repetindo até retorno do enchimento capilar (&lt; 2 seg).
            </p>
            <p className="text-[11px] text-red-100 leading-relaxed">
              <strong>3. Medidas Adjuvantes:</strong> Massagem vigorosa, compressas mornas, AAS 100-300mg oral, vasodilatador (Sildenafila 20-50mg).
            </p>
          </div>
        </div>

        {/* Right Column (7 cols): AI Custom Protocol Builder + Post-care */}
        <div className="lg:col-span-7 space-y-4">
          {/* Custom Guide Builder Form */}
          <form onSubmit={handleGenerateCustomGuide} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Gerador de Protocolo de Procedimento Personalizado
              </h3>
              <span className="text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Copiloto Anatômico
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Procedimento</label>
                <input
                  type="text"
                  value={customProcedureType}
                  onChange={(e) => setCustomProcedureType(e.target.value)}
                  placeholder="Ex: Toxina Botulínica Facial Completa"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Área Alvo</label>
                <input
                  type="text"
                  value={targetArea}
                  onChange={(e) => setTargetArea(e.target.value)}
                  placeholder="Ex: Terço Superior e Terço Médio"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Perfil do Paciente e Histórico</label>
              <input
                type="text"
                value={patientProfile}
                onChange={(e) => setPatientProfile(e.target.value)}
                placeholder="Ex: Feminino, 38 anos, rugas dinâmicas acentuadas, sem ptose prévia..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {guideError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {guideError}
              </div>
            )}

            <button
              type="submit"
              disabled={loadingGuide}
              className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loadingGuide ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mapeando Anatomia & Doses com IA...</span>
                </>
              ) : (
                <>
                  <Syringe className="w-4 h-4" />
                  <span>Gerar Guia & Mapa de Pontos de Injeção</span>
                </>
              )}
            </button>
          </form>

          {/* AI Guide Output Result */}
          {guideData && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-extrabold text-slate-900">
                  {guideData.procedureName}
                </h4>
                <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  {guideData.anatomicalPlanes}
                </span>
              </div>

              {/* Dosage & Injection points */}
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Pontos e Dosagens Recomendadas:
                </div>
                <div className="space-y-2">
                  {guideData.dosageAndPoints?.map((dp, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{dp.area}</span>
                        <span className="text-purple-700 bg-purple-100 px-2 py-0.5 rounded text-[11px]">
                          {dp.recommendedUnitsOrVolume}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">
                        <strong>Técnica:</strong> {dp.injectionTechnique} • <em>Alvo: {dp.targetMuscleOrStructure}</em>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger zones */}
              <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg text-xs space-y-1.5">
                <div className="font-bold text-red-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  <span>Vasos e Zonas de Risco Vascular:</span>
                </div>
                {guideData.dangerZonesAndVessels?.map((dz, i) => (
                  <div key={i} className="text-[11px] text-red-800">
                    <strong>{dz.vessel} ({dz.dangerLocation}):</strong> {dz.safetyRule}
                  </div>
                ))}
              </div>

              {/* Potential complications */}
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-800">Possíveis intercorrências:</span> {(guideData.potentialComplications || []).join(', ')}
              </div>

              {/* Post Care Quick Trigger */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={postCarePatient}
                  onChange={(e) => setPostCarePatient(e.target.value)}
                  placeholder="Nome do Paciente para WhatsApp"
                  className="w-full sm:w-auto flex-1 text-xs p-2 rounded-lg border border-slate-300"
                />
                <button
                  type="button"
                  onClick={handleGeneratePostCare}
                  disabled={loadingPostCare}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition shrink-0"
                >
                  {loadingPostCare ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Gerar Orientações Pós</span>
                </button>
              </div>
            </div>
          )}

          {/* Post Care Output Card */}
          {postCareData && (
            <div className="bg-white rounded-xl border-2 border-emerald-300 p-5 shadow-sm space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>Orientações Pós-Procedimento para Envio</span>
                </div>

                <button
                  onClick={handleCopyWhatsapp}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                >
                  {copiedWhatsapp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWhatsapp ? 'Copiado!' : 'Copiar p/ WhatsApp'}</span>
                </button>
              </div>

              {/* WhatsApp Message Preview */}
              <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-200 font-sans text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {postCareData.whatsappMessage}
              </div>

              {/* Warning Signs */}
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <strong>Sinais de Alerta para Contato Imediato:</strong>
                <ul className="list-disc list-inside mt-1 text-[11px]">
                  {postCareData.urgentWarningSigns?.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
