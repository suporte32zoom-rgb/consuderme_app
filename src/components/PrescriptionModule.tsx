import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Printer, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Beaker, 
  Pill, 
  Send, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { FitzpatrickType, DoctorProfile, PrescriptionResponse, MagistralFormula } from '../types';
import { directPrescriptionGenerator } from '../services/geminiDirect';

interface PrescriptionModuleProps {
  doctorProfile: DoctorProfile;
  initialData?: {
    indication?: string;
    fitzpatrick?: FitzpatrickType;
    complaint?: string;
  };
}

export const PrescriptionModule: React.FC<PrescriptionModuleProps> = ({
  doctorProfile,
  initialData
}) => {
  // Prescription Input States
  const [patientName, setPatientName] = useState('');
  const [indication, setIndication] = useState(initialData?.indication || 'Melasma Recalcitrante / Hiperpigmentação Facial');
  const [fitzpatrick, setFitzpatrick] = useState<FitzpatrickType>(initialData?.fitzpatrick || 'III');
  const [skinType, setSkinType] = useState('Mista a Oleosa, Sensível');
  const [vehiclePreference, setVehiclePreference] = useState('Sérum Fluido Toque Seco q.s.p. 30g');
  const [specialNotes, setSpecialNotes] = useState('Evitar veículos comedogênicos; paciente trabalha em frente a telas de computador.');
  const [doctorNotes, setDoctorNotes] = useState('');

  // AI Generation State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionResponse | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Generate Prescription via Gemini API
  const handleGeneratePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!indication.trim()) {
      setError('Por favor, informe a indicação clínica ou patologia alvo.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await directPrescriptionGenerator({
        indication,
        fitzpatrick,
        skinType,
        vehiclePreference,
        specialNotes,
        doctorNotes
      });

      setPrescriptionData(data as any);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao gerar formulação.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrescription = () => {
    if (!prescriptionData) return;

    let text = `
RECEITUÁRIO MÉDICO DERMATOLÓGICO
${doctorProfile.clinicName || 'CONSULTÓRIO DE DERMATOLOGIA'}
${doctorProfile.name || 'Dr(a). Dermatologista'} — CRM ${doctorProfile.crm || ''}/${doctorProfile.uf || ''}
Paciente: ${patientName || '________________________'} | Data: ${new Date().toLocaleDateString('pt-BR')}

--- FÓRMULAS MAGISTRAIS (MANIPULAÇÃO) ---
`;

    (prescriptionData.magistralFormulas || []).forEach((f, i) => {
      text += `\n${i + 1}. USO TÓPICO: ${f.title}\n`;
      (f.actives || []).forEach(a => {
        text += `   - ${a.name} ................... ${a.percentage}\n`;
      });
      text += `   - ${f.vehicle}\n`;
      text += `   Posologia: ${f.posology}\n`;
      text += `   Observações: ${f.warnings}\n`;
    });

    if (prescriptionData.industrialOptions && prescriptionData.industrialOptions.length > 0) {
      text += `\n--- MEDICAMENTOS INDUSTRIAIS / DERMOCOSMÉTICOS ---\n`;
      prescriptionData.industrialOptions.forEach((ind, i) => {
        text += `${i + 1}. ${ind.name} (${ind.activeIngredient})\n   Posologia: ${ind.posology}\n`;
      });
    }

    text += `\n--- ROTINA DIÁRIA DE CUIDADOS (HOMECARE) ---\n`;
    text += `MANHÃ:\n${(prescriptionData.generalSkincareRoutine?.morning || []).map(m => ` • ${m}`).join('\n')}\n`;
    text += `NOITE:\n${(prescriptionData.generalSkincareRoutine?.night || []).map(n => ` • ${n}`).join('\n')}\n`;
    text += `\nFOTOPROTEÇÃO: ${prescriptionData.photoprotectionStrategy || ''}\n`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !prescriptionData) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receituário Médico — ${patientName || 'Paciente'}</title>
          <style>
            @page { size: A4; margin: 18mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; font-size: 13px; line-height: 1.5; }
            .header { border-bottom: 2px solid #0d9488; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-start; }
            .clinic-title { font-size: 17px; font-weight: bold; color: #0f172a; }
            .doctor-sub { font-size: 11px; color: #475569; }
            .patient-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; font-size: 12px; }
            .section-title { font-size: 13px; font-weight: bold; color: #0f766e; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin: 16px 0 10px 0; }
            .formula-card { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; }
            .formula-title { font-weight: bold; color: #0f172a; font-size: 13px; }
            .actives-list { margin: 6px 0; font-family: monospace; font-size: 12px; }
            .posology { background: #f1f5f9; padding: 6px 10px; border-radius: 4px; font-size: 12px; color: #334155; margin-top: 6px; }
            .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 15px; display: flex; justify-content: space-between; align-items: flex-end; }
            .signature-line { width: 220px; border-top: 1px solid #0f172a; text-align: center; font-size: 11px; padding-top: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="clinic-title">${doctorProfile.clinicName || 'CONSULTÓRIO DE DERMATOLOGIA'}</div>
              <div class="doctor-sub">${doctorProfile.name || 'Médico(a) Assistente'} — CRM ${doctorProfile.crm || ''}/${doctorProfile.uf || ''} ${doctorProfile.rqe ? `• RQE ${doctorProfile.rqe}` : ''}</div>
              <div class="doctor-sub">${doctorProfile.address || ''} • ${doctorProfile.phone || ''}</div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #0d9488; font-weight: bold;">
              RECEITUÁRIO DERMATOLÓGICO<br>
              <span style="font-size: 9px; color: #64748b;">Consuderme • Prescrição Oficial</span>
            </div>
          </div>

          <div class="patient-box">
            <strong>Paciente:</strong> ${patientName || '________________________________________'} &nbsp;&nbsp;|&nbsp;&nbsp; 
            <strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')} &nbsp;&nbsp;|&nbsp;&nbsp;
            <strong>Fototipo:</strong> Fitzpatrick ${fitzpatrick}
          </div>

          <div class="section-title">1. Fórmulas Magistrais (Manipulação Farmacêutica)</div>
          ${(prescriptionData.magistralFormulas || []).map((f, i) => `
            <div class="formula-card">
              <div class="formula-title">${i + 1}. USO TÓPICO: ${f.title}</div>
              <div class="actives-list">
                ${(f.actives || []).map(a => `<div>• ${a.name} ................................... <strong>${a.percentage}</strong> <span style="color:#64748b; font-size:10px;">(${a.rationale})</span></div>`).join('')}
                <div style="margin-top: 4px;">• ${f.vehicle}</div>
              </div>
              <div class="posology"><strong>Modo de Uso:</strong> ${f.posology}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;"><em>Atenção:</em> ${f.warnings}</div>
            </div>
          `).join('')}

          ${prescriptionData.industrialOptions && prescriptionData.industrialOptions.length > 0 ? `
            <div class="section-title">2. Produtos Industriais / Complementares</div>
            ${prescriptionData.industrialOptions.map((ind, i) => `
              <div style="margin-bottom: 8px; font-size: 12px;">
                <strong>${i + 1}. ${ind.name}</strong> (${ind.activeIngredient})<br>
                <span>Posologia: ${ind.posology}</span>
              </div>
            `).join('')}
          ` : ''}

          <div class="section-title">3. Fotoproteção & Recomendações</div>
          <div style="font-size: 12px; margin-bottom: 10px;">${prescriptionData.photoprotectionStrategy || ''}</div>

          <div class="footer">
            <div style="font-size: 10px; color: #64748b;">
              Receita válida em todo o território nacional.<br>
              Uso estritamente sob orientação médica.
            </div>
            <div class="signature-line">
              <strong>${doctorProfile.name || 'Médico(a) Responsável'}</strong><br>
              CRM ${doctorProfile.crm || ''}/${doctorProfile.uf || ''}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white rounded-2xl p-6 border border-emerald-800/40 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/30">
              <Beaker className="w-3.5 h-3.5" />
              <span>MÓDULO DE PRESCRIÇÃO E GALÊNICA DERMATOLÓGICA</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Gerador de Fórmulas Magistrais & Receituário
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl mt-1 leading-relaxed">
              Criação de formulações individualizadas com <strong>veículos galênicos adequados</strong> (Gel Oil-free, Sérum Fluido, Creme Segunda Pele, Loção Hidratante, Pomada) e posologias seguras para cada fototipo.
            </p>
          </div>

          {prescriptionData && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Receita Timbrada</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Formulation Builder + Generated Prescription */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Builder Form */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleGeneratePrescription} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Parâmetros da Formulação Magistral
              </h3>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Farmácia Galênica SBD
              </span>
            </div>

            {/* Patient Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nome do Paciente
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Ex: Beatriz Albuquerque"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            {/* Indication / Disease */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Indicação Clínica / Patologia Alvo *
              </label>
              <input
                type="text"
                required
                value={indication}
                onChange={(e) => setIndication(e.target.value)}
                placeholder="Ex: Melasma misto resistente, Acne grau II, Rosácea, Fotoenvelhecimento"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            {/* Fitzpatrick & Skin Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Fototipo
                </label>
                <select
                  value={fitzpatrick}
                  onChange={(e) => setFitzpatrick(e.target.value as FitzpatrickType)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="I">Fototipo I (Muito Clara)</option>
                  <option value="II">Fototipo II (Clara)</option>
                  <option value="III">Fototipo III (Morena Clara)</option>
                  <option value="IV">Fototipo IV (Morena Média)</option>
                  <option value="V">Fototipo V (Morena Escura)</option>
                  <option value="VI">Fototipo VI (Negra)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tipo de Pele
                </label>
                <select
                  value={skinType}
                  onChange={(e) => setSkinType(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Oleosa / Acneica">Oleosa / Acneica</option>
                  <option value="Mista a Oleosa, Sensível">Mista / Sensível</option>
                  <option value="Seca / Alípica">Seca / Alípica</option>
                  <option value="Madura / Fotoenvelhecida">Madura / Fotoenvelhecida</option>
                  <option value="Com Rosácea / Reativa">Reativa / Rosácea</option>
                </select>
              </div>
            </div>

            {/* Vehicle Preference */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Veículo Dermocosmético Preferencial
              </label>
              <select
                value={vehiclePreference}
                onChange={(e) => setVehiclePreference(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Sérum Fluido Toque Seco q.s.p. 30g">Sérum Fluido Toque Seco q.s.p. 30g (Rápida Absorção)</option>
                <option value="Gel Oil-free não comedogênico q.s.p. 30g">Gel Oil-Free Não Comedogênico q.s.p. 30g</option>
                <option value="Creme Base Fosfolipídica / Segunda Pele q.s.p. 30g">Creme Fosfolipídico / Segunda Pele (Pele Seca/Sensível)</option>
                <option value="Loção Fluida Hidratante q.s.p. 50g">Loção Fluida Hidratante q.s.p. 50g</option>
                <option value="Pomada Lipofílica Oclusiva q.s.p. 30g">Pomada Lipofílica Oclusiva q.s.p. 30g (Alta Potência)</option>
                <option value="Bastão / Stick Anidro q.s.p. 15g">Bastão / Stick Anidro q.s.p. 15g (Áreas Localizadas)</option>
              </select>
            </div>

            {/* Special Notes & Sensitivities */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Restrições, Sensibilidades ou Alergias
              </label>
              <textarea
                rows={2}
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="Ex: Não tolera ácido retinóico; preferência por ativos clareadores não citotóxicos (ácido tranexâmico, cisteamina)..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Calculando Ativos e Concentrações com IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Gerar Formulação & Prescrição Inteligente</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Output Area */}
        <div className="lg:col-span-7 space-y-4">
          {prescriptionData ? (
            <div className="space-y-4 animate-fadeIn">
              {/* Toolbar */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Prescrição Formulada pelo Consuderme
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Paciente: <strong>{patientName || 'Não identificado'}</strong> (Fototipo {fitzpatrick})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyPrescription}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 border border-slate-300 transition"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText ? 'Copiado!' : 'Copiar Texto'}</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir</span>
                  </button>
                </div>
              </div>

              {/* Magistral Formulas Cards */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Beaker className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fórmulas Magistrais Indicadas</span>
                </div>

                {prescriptionData.magistralFormulas?.map((formula, idx) => (
                  <div key={idx} className="bg-white rounded-xl border-2 border-emerald-200/80 p-4 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Fórmula Magistral {idx + 1}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-1">
                          {formula.title}
                        </h4>
                      </div>
                    </div>

                    {/* Actives table */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Composição Galênica & Concentrações Ativas:
                      </div>
                      <div className="space-y-1.5 divide-y divide-slate-200/60 font-mono text-xs">
                        {formula.actives?.map((act, i) => (
                          <div key={i} className="pt-1.5 first:pt-0 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{act.name}</span>
                              <span className="text-[10px] text-slate-500 font-sans">({act.rationale})</span>
                            </div>
                            <span className="font-extrabold text-emerald-700">{act.percentage}</span>
                          </div>
                        ))}
                        <div className="pt-2 text-xs font-sans text-slate-700 font-semibold flex items-center justify-between">
                          <span>Veículo Dermocosmético:</span>
                          <span className="text-teal-800">{formula.vehicle}</span>
                        </div>
                      </div>
                    </div>

                    {/* Posology & Warnings */}
                    <div className="space-y-1 text-xs">
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 font-medium">
                        <strong>Modo de Usar / Posologia:</strong> {formula.posology}
                      </div>
                      <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        <strong>Avisos / Precauções:</strong> {formula.warnings}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Skincare Routine & Photoprotection */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Estratégia de Fotoproteção & Rotina de Cuidados</span>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
                  <strong>Diretriz de Fotoproteção:</strong> {prescriptionData.photoprotectionStrategy}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Rotina Matinal</span>
                    </div>
                    <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                      {prescriptionData.generalSkincareRoutine?.morning?.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Rotina Noturna</span>
                    </div>
                    <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                      {prescriptionData.generalSkincareRoutine?.night?.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Industrial Alternatives if available */}
              {prescriptionData.industrialOptions && prescriptionData.industrialOptions.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-blue-600" />
                    <span>Opções Industrializadas de Referência</span>
                  </div>
                  <div className="space-y-2">
                    {prescriptionData.industrialOptions.map((ind, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 text-xs">
                        <div className="font-bold text-blue-950">{ind.name} <span className="text-[10px] font-normal text-slate-600">({ind.activeIngredient})</span></div>
                        <div className="text-[11px] text-slate-700 mt-0.5">Posologia: {ind.posology}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center flex flex-col items-center justify-center min-h-[420px] text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-400">
                <Beaker className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-700 text-sm">
                Aguardando Geração de Prescrição
              </h4>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Configure os parâmetros clínicos ao lado para formular prescrições magistrais com veículos galênicos otimizados e porcentagens seguras.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
