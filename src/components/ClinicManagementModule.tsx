import React, { useState } from 'react';
import { 
  Calculator, 
  FileText, 
  ScrollText, 
  CheckCircle2, 
  DollarSign, 
  Printer, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Copy, 
  Check, 
  TrendingUp, 
  Clock, 
  Search,
  Eye,
  ShieldCheck,
  Building
} from 'lucide-react';
import { DoctorProfile, ClinicalFollowUp, ProcedureCostItem } from '../types';

interface ClinicManagementModuleProps {
  doctorProfile: DoctorProfile;
}

export const ClinicManagementModule: React.FC<ClinicManagementModuleProps> = ({ doctorProfile }) => {
  const [subTab, setSubTab] = useState<'documents' | 'calculator' | 'followup'>('documents');
  
  // Document Generator States
  const [docType, setDocType] = useState<'atestado' | 'receita_c2' | 'laudo_dermatoscopico'>('atestado');
  const [docPatientName, setDocPatientName] = useState('');
  const [docPatientCpf, setDocPatientCpf] = useState('');
  const [docCid, setDocCid] = useState('L70.0 (Acne vulgar)');
  const [docDaysOff, setDocDaysOff] = useState('2');
  const [docContentText, setDocContentText] = useState('');
  
  // Dermatoscopy Fields
  const [lesionLocation, setLesionLocation] = useState('Região interescapular');
  const [pigmentPattern, setPigmentPattern] = useState('Rede pigmentada atípica, assimétrica, com término abrupto');
  const [globulesPattern, setGlobulesPattern] = useState('Glóbulos periféricos irregulares');
  const [blueWhiteVeil, setBlueWhiteVeil] = useState('Presente focal');
  const [vascularPattern, setVascularPattern] = useState('Vasos pontilhados e em grampo');
  const [dermatoscopyConclusion, setDermatoscopyConclusion] = useState('Lesão melanocítica atípica de alto risco (Suspeita de Melanoma Inicial). Indicação de Exérese Excisional com margem de 2mm para exame histopatológico.');

  // Special Control C2 Form fields
  const [c2Drug, setC2Drug] = useState('Isotretinoína Oral 20mg');
  const [c2Quantity, setC2Quantity] = useState('60 cápsulas (Tratamento para 30 dias)');
  const [c2Posology, setC2Posology] = useState('Tomar 1 cápsula por via oral 2 vezes ao dia, junto às principais refeições.');
  const [c2PregnancyTestDate, setC2PregnancyTestDate] = useState('Beta-HCG quantitativo negativo em ' + new Date().toLocaleDateString('pt-BR'));

  // Procedure Cost Calculator State
  const [costItems, setCostItems] = useState<ProcedureCostItem[]>([
    {
      id: '1',
      name: 'Toxina Botulínica (Frasco 100 UI)',
      type: 'toxina',
      vialCost: 750, // Custo do frasco
      totalUnitsOrMl: 100, // Total de UI
      usedUnitsOrMl: 50, // UI aplicadas
      suppliesCost: 45, // Seringas 0.3ml, agulhas 32G, soro, gaze, álcool
      desiredMarginPercent: 65,
      suggestedPrice: 1200
    },
    {
      id: '2',
      name: 'Preenchedor Ácido Hialurônico (1.0 mL)',
      type: 'preenchedor',
      vialCost: 480,
      totalUnitsOrMl: 1.0,
      usedUnitsOrMl: 1.0,
      suppliesCost: 55, // Cânula 25G, anestésico tópico, gaze, micropore
      desiredMarginPercent: 60,
      suggestedPrice: 1350
    },
    {
      id: '3',
      name: 'Bioestimulador de Colágeno (CaHA / PLLA)',
      type: 'bioestimulador',
      vialCost: 950,
      totalUnitsOrMl: 1.0,
      usedUnitsOrMl: 1.0,
      suppliesCost: 80, // Água para injeção, cânula 22G, seringas luer lock, anestésico
      desiredMarginPercent: 60,
      suggestedPrice: 2600
    }
  ]);

  // Active Follow-up State
  const [followUps, setFollowUps] = useState<ClinicalFollowUp[]>([]);
  const [newPatientFollowUp, setNewPatientFollowUp] = useState('');
  const [newDiagnosisFollowUp, setNewDiagnosisFollowUp] = useState('Melasma Facial Recalcitrante');
  const [newNotesFollowUp, setNewNotesFollowUp] = useState('Início de tratamento com protocolo despigmentante noturno.');
  const [newScoreFollowUp, setNewScoreFollowUp] = useState<number>(30);

  // Recalculate Procedure Cost
  const handleUpdateCost = (id: string, updates: Partial<ProcedureCostItem>) => {
    setCostItems(prev => prev.map(item => {
      if (item.id === id) {
        const merged = { ...item, ...updates };
        const productUnitCost = (merged.vialCost / merged.totalUnitsOrMl) * merged.usedUnitsOrMl;
        const totalDirectCost = productUnitCost + merged.suppliesCost;
        // Price = Cost / (1 - Margin/100)
        const marginMultiplier = 1 - (merged.desiredMarginPercent / 100);
        const calculatedPrice = marginMultiplier > 0 ? Math.round(totalDirectCost / marginMultiplier) : totalDirectCost * 2;
        return { ...merged, suggestedPrice: calculatedPrice };
      }
      return item;
    }));
  };

  // Add Follow up session
  const handleAddFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientFollowUp.trim()) return;

    const newRecord: ClinicalFollowUp = {
      id: Date.now().toString(),
      patientName: newPatientFollowUp,
      diagnosis: newDiagnosisFollowUp,
      startDate: new Date().toLocaleDateString('pt-BR'),
      targetArea: 'Face',
      treatmentPlan: 'Protocolo Farmacológico + Homecare',
      sessions: [
        {
          date: new Date().toLocaleDateString('pt-BR'),
          sessionNumber: 1,
          notes: newNotesFollowUp,
          improvementScore: newScoreFollowUp,
          nextReturnDays: 30
        }
      ]
    };

    setFollowUps([newRecord, ...followUps]);
    setNewPatientFollowUp('');
    setNewNotesFollowUp('');
  };

  // Print Official Document
  const handlePrintDocument = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let docTitle = 'Atestado Médico';
    let docBody = '';

    if (docType === 'atestado') {
      docTitle = 'ATESTADO MÉDICO';
      docBody = `
        <div style="font-size: 14px; line-height: 1.8; text-align: justify; margin: 30px 0;">
          Atesto para os devidos fins que o(a) Sr(a). <strong>${docPatientName || '________________________________________'}</strong>, 
          ${docPatientCpf ? `inscrito(a) no CPF sob o nº ${docPatientCpf}, ` : ''}esteve sob meus cuidados médicos dermatológicos nesta data, necessitando de 
          <strong>${docDaysOff} dia(s)</strong> de afastamento de suas atividades laborais e/ou escolares para tratamento de saúde e recuperação clínica.
          <br><br>
          <strong>Diagnóstico Clínico (CID-10):</strong> ${docCid}
          ${docContentText ? `<br><br><strong>Observações Médicas:</strong> ${docContentText}` : ''}
        </div>
      `;
    } else if (docType === 'receita_c2') {
      docTitle = 'RECEITUÁRIO DE CONTROLE ESPECIAL (LISTA C2 - RETINÓIDES)';
      docBody = `
        <div style="font-size: 13px; line-height: 1.6; margin: 20px 0;">
          <div style="border: 2px solid #dc2626; background: #fef2f2; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 11px; color: #991b1b;">
            <strong>ALERTA DE TERATOGENICIDADE (PORTARIA SVS/MS Nº 344/98):</strong><br>
            A medicação prescrita abaixo é estritamente teratogênica, provocando graves defeitos congênitos no feto. É proibida a gravidez durante e até 30 dias após o término do tratamento.
          </div>

          <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; margin-bottom: 15px;">
            <strong>Paciente:</strong> ${docPatientName || '________________________________________'}<br>
            <strong>CPF:</strong> ${docPatientCpf || '___.___.___-__'}<br>
            <strong>Controle de Gravidez:</strong> ${c2PregnancyTestDate}
          </div>

          <div style="border-left: 4px solid #0d9488; padding-left: 12px; margin: 15px 0;">
            <div style="font-size: 15px; font-weight: bold; color: #0f172a;">1. ${c2Drug}</div>
            <div style="font-size: 12px; color: #475569;">Quantidade: ${c2Quantity}</div>
            <div style="font-size: 13px; margin-top: 6px;"><strong>Posologia:</strong> ${c2Posology}</div>
          </div>
        </div>
      `;
    } else {
      docTitle = 'LAUDO DE DERMATOSCOPIA DIGITAL E MAPA CORPORAL';
      docBody = `
        <div style="font-size: 13px; line-height: 1.6; margin: 20px 0;">
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; margin-bottom: 15px;">
            <strong>Paciente:</strong> ${docPatientName || '________________________________________'} | <strong>Topografia da Lesão:</strong> ${lesionLocation}
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px;">
            <tr style="background: #f1f5f9;">
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Estrutura Dermatoscópica</th>
              <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: left;">Achado Observado</th>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">Padrão da Rede Pigmentada</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px;">${pigmentPattern}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">Glóbulos e Pontos</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px;">${globulesPattern}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">Véu Azul-Esbranquiçado</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px;">${blueWhiteVeil}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">Padrão Vascular</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px;">${vascularPattern}</td>
            </tr>
          </table>

          <div style="border: 1px solid #0d9488; background: #f0fdfa; padding: 12px; border-radius: 6px;">
            <strong style="color: #0f766e;">CONCLUSÃO E CONDUTA DERMATOLÓGICA:</strong><br>
            <div style="margin-top: 4px;">${dermatoscopyConclusion}</div>
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTitle} — Consuderme</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; }
            .header { border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
            .clinic-title { font-size: 18px; font-weight: bold; color: #0f172a; }
            .doctor-sub { font-size: 12px; color: #475569; }
            .doc-heading { font-size: 16px; font-weight: bold; text-align: center; text-transform: uppercase; margin: 25px 0; color: #0f766e; letter-spacing: 0.5px; }
            .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
            .sig-box { text-align: center; width: 250px; border-top: 1px solid #0f172a; padding-top: 6px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="clinic-title">${doctorProfile.clinicName || 'CONSULTÓRIO DE DERMATOLOGIA'}</div>
              <div class="doctor-sub">${doctorProfile.name || 'Médico(a) Assistente'} — CRM ${doctorProfile.crm || ''}/${doctorProfile.uf || ''} ${doctorProfile.rqe ? `• RQE ${doctorProfile.rqe}` : ''}</div>
              <div class="doctor-sub">${doctorProfile.address || ''} • ${doctorProfile.phone || ''}</div>
            </div>
            <div style="font-size: 11px; color: #0d9488; font-weight: bold; text-align: right;">
              CONSU<span style="color:#0f172a">DERME</span><br>
              <span style="font-size: 9px; color: #64748b;">Prontuário e Gestão Médica</span>
            </div>
          </div>

          <div class="doc-heading">${docTitle}</div>
          ${docBody}

          <div class="footer">
            <div style="font-size: 10px; color: #64748b;">
              Emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}<br>
              Conforme Código de Ética Médica e Resoluções do CFM.
            </div>
            <div class="sig-box">
              <strong>${doctorProfile.name || 'Médico(a) Responsável'}</strong><br>
              CRM ${doctorProfile.crm || ''}/${doctorProfile.uf || ''} ${doctorProfile.rqe ? `• RQE ${doctorProfile.rqe}` : ''}
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
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 text-white rounded-2xl p-6 border border-amber-800/40 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2 border border-amber-500/30">
              <Calculator className="w-3.5 h-3.5" />
              <span>MÓDULO 3: ADMINISTRAÇÃO E GESTÃO DO CONSULTÓRIO</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Documentos Oficiais, Acompanhamento & Precificação
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl mt-1 leading-relaxed">
              Geração de <strong>Atestados com CID-10</strong>, <strong>Receituários de Controle Especial C2</strong>, <strong>Laudos Dermatoscópicos</strong> e <strong>Calculadora de Custos por UI de Toxina / mL de Preenchedor</strong>.
            </p>
          </div>

          {/* Subtabs Switcher */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setSubTab('documents')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                subTab === 'documents'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Documentos & Laudos
            </button>
            <button
              onClick={() => setSubTab('calculator')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                subTab === 'calculator'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Calculadora de Custos
            </button>
            <button
              onClick={() => setSubTab('followup')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                subTab === 'followup'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Evolução do Tratamento
            </button>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: DOCUMENT GENERATOR */}
      {subTab === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Document Settings */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ScrollText className="w-4 h-4 text-amber-600" />
                  Tipo de Documento Médico
                </h3>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Padrão CFM
                </span>
              </div>

              {/* Doc type selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDocType('atestado')}
                  className={`p-2 rounded-lg text-xs font-semibold text-center border transition ${
                    docType === 'atestado'
                      ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Atestado CID-10
                </button>
                <button
                  type="button"
                  onClick={() => setDocType('receita_c2')}
                  className={`p-2 rounded-lg text-xs font-semibold text-center border transition ${
                    docType === 'receita_c2'
                      ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Receita C2 (Retinóides)
                </button>
                <button
                  type="button"
                  onClick={() => setDocType('laudo_dermatoscopico')}
                  className={`p-2 rounded-lg text-xs font-semibold text-center border transition ${
                    docType === 'laudo_dermatoscopico'
                      ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Laudo Dermatoscópico
                </button>
              </div>

              {/* Patient Name & CPF */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nome do Paciente</label>
                <input
                  type="text"
                  value={docPatientName}
                  onChange={(e) => setDocPatientName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo de Souza"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">CPF do Paciente</label>
                <input
                  type="text"
                  value={docPatientCpf}
                  onChange={(e) => setDocPatientCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Fields specific to Atestado */}
              {docType === 'atestado' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Dias de Afastamento</label>
                      <input
                        type="text"
                        value={docDaysOff}
                        onChange={(e) => setDocDaysOff(e.target.value)}
                        placeholder="Ex: 2 dias / 1 dia"
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">CID-10</label>
                      <input
                        type="text"
                        value={docCid}
                        onChange={(e) => setDocCid(e.target.value)}
                        placeholder="Ex: L70.0 / L81.1"
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Observações Médicas Adicionais</label>
                    <textarea
                      rows={2}
                      value={docContentText}
                      onChange={(e) => setDocContentText(e.target.value)}
                      placeholder="Ex: Procedimento cirúrgico dermatológico realizado nesta data..."
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50"
                    />
                  </div>
                </>
              )}

              {/* Fields specific to Receita C2 */}
              {docType === 'receita_c2' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Medicamento Retinóide (C2)</label>
                    <input
                      type="text"
                      value={c2Drug}
                      onChange={(e) => setC2Drug(e.target.value)}
                      placeholder="Ex: Isotretinoína Oral 20mg"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Quantidade Total</label>
                      <input
                        type="text"
                        value={c2Quantity}
                        onChange={(e) => setC2Quantity(e.target.value)}
                        placeholder="Ex: 60 cápsulas"
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Teste Gravidez</label>
                      <input
                        type="text"
                        value={c2PregnancyTestDate}
                        onChange={(e) => setC2PregnancyTestDate(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Posologia Detalhada</label>
                    <input
                      type="text"
                      value={c2Posology}
                      onChange={(e) => setC2Posology(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50"
                    />
                  </div>
                </>
              )}

              {/* Fields specific to Laudo Dermatoscópico */}
              {docType === 'laudo_dermatoscopico' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Localização da Lesão</label>
                    <input
                      type="text"
                      value={lesionLocation}
                      onChange={(e) => setLesionLocation(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Rede Pigmentada</label>
                    <input
                      type="text"
                      value={pigmentPattern}
                      onChange={(e) => setPigmentPattern(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Conclusão e Conduta</label>
                    <textarea
                      rows={2}
                      value={dermatoscopyConclusion}
                      onChange={(e) => setDermatoscopyConclusion(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50"
                    />
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={handlePrintDocument}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Documento Médico Timbrado</span>
              </button>
            </div>
          </div>

          {/* Right Preview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <div className="border-b-2 border-amber-600 pb-3 mb-6 flex items-center justify-between">
                <div>
                  <div className="text-base font-bold text-slate-900">{doctorProfile.clinicName || 'CONSULTÓRIO DE DERMATOLOGIA'}</div>
                  <div className="text-xs text-slate-600">{doctorProfile.name || 'Dr(a). Dermatologista'} — CRM {doctorProfile.crm}/{doctorProfile.uf}</div>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  Pré-visualização Oficial
                </span>
              </div>

              <div className="text-center font-bold text-sm text-amber-950 uppercase mb-6 tracking-wide">
                {docType === 'atestado' ? 'ATESTADO MÉDICO' : docType === 'receita_c2' ? 'RECEITUÁRIO DE CONTROLE ESPECIAL' : 'LAUDO DERMATOSCÓPICO ESTATÍSTICO'}
              </div>

              {docType === 'atestado' && (
                <div className="space-y-4 text-xs text-slate-800 leading-relaxed bg-slate-50 p-5 rounded-lg border border-slate-200">
                  <p>
                    Atesto para os devidos fins que o(a) Sr(a). <strong>{docPatientName || '________________________________________'}</strong>, 
                    ${docPatientCpf ? `inscrito(a) no CPF nº ${docPatientCpf}, ` : ''}esteve sob cuidados médicos dermatológicos nesta data, necessitando de 
                    <strong>{docDaysOff} dia(s)</strong> de afastamento de suas atividades.
                  </p>
                  <p><strong>CID-10:</strong> {docCid}</p>
                  {docContentText && <p><strong>Observações:</strong> {docContentText}</p>}
                </div>
              )}

              {docType === 'receita_c2' && (
                <div className="space-y-3 text-xs text-slate-800 bg-slate-50 p-5 rounded-lg border border-slate-200">
                  <div className="p-2.5 bg-red-100/70 border border-red-300 rounded text-red-900 font-semibold text-[11px]">
                    NOTIFICAÇÃO DE RETINÓIDE SISTÊMICO (LISTA C2 / PORTARIA 344/98) — RISCO DE MÁS-FORMAÇÕES FETAIS GRAVES.
                  </div>
                  <p><strong>Paciente:</strong> {docPatientName || '________________________'} | <strong>CPF:</strong> {docPatientCpf || '___.___.___-__'}</p>
                  <div className="p-3 bg-white border border-slate-200 rounded">
                    <div className="font-bold text-slate-900 text-sm">1. {c2Drug}</div>
                    <div className="text-slate-600">Qtd: {c2Quantity}</div>
                    <div className="mt-1"><strong>Posologia:</strong> {c2Posology}</div>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Controle Gravídico: {c2PregnancyTestDate}
                  </div>
                </div>
              )}

              {docType === 'laudo_dermatoscopico' && (
                <div className="space-y-3 text-xs text-slate-800 bg-slate-50 p-5 rounded-lg border border-slate-200">
                  <p><strong>Paciente:</strong> {docPatientName || '________________________'} | <strong>Topografia:</strong> {lesionLocation}</p>
                  <div className="bg-white p-3 rounded border border-slate-200 space-y-1">
                    <div><strong>Rede Pigmentada:</strong> {pigmentPattern}</div>
                    <div><strong>Glóbulos:</strong> {globulesPattern}</div>
                    <div><strong>Véu:</strong> {blueWhiteVeil}</div>
                  </div>
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded text-teal-900">
                    <strong>Conclusão / Conduta:</strong> {dermatoscopyConclusion}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-400">
                <span>Consuderme Medical Management</span>
                <span className="font-bold text-slate-600">Assinatura Digital CFM</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: PROCEDURE COST CALCULATOR */}
      {subTab === 'calculator' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Calculadora de Custos & Formação de Preço por Procedimento
                </h3>
                <p className="text-xs text-slate-500">
                  Cálculo preciso do custo por UI de Toxina, mL de Preenchedor, insumos descartáveis e margem de contribuição líquida.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {costItems.map((item) => {
                const costPerUnit = (item.vialCost / item.totalUnitsOrMl) * item.usedUnitsOrMl;
                const totalDirect = costPerUnit + item.suppliesCost;
                const grossProfit = item.suggestedPrice - totalDirect;
                const realMargin = item.suggestedPrice > 0 ? ((grossProfit / item.suggestedPrice) * 100).toFixed(1) : 0;

                return (
                  <div key={item.id} className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-xs text-slate-900">{item.name}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                        {item.type}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Custo Frasco / Seringa (R$)</label>
                        <input
                          type="number"
                          value={item.vialCost}
                          onChange={(e) => handleUpdateCost(item.id, { vialCost: parseFloat(e.target.value) || 0 })}
                          className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Qtd Total Frasco</label>
                          <input
                            type="number"
                            value={item.totalUnitsOrMl}
                            onChange={(e) => handleUpdateCost(item.id, { totalUnitsOrMl: parseFloat(e.target.value) || 1 })}
                            className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Qtd Utilizada</label>
                          <input
                            type="number"
                            value={item.usedUnitsOrMl}
                            onChange={(e) => handleUpdateCost(item.id, { usedUnitsOrMl: parseFloat(e.target.value) || 1 })}
                            className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Insumos (Seringas, Cânula, Gaze) R$</label>
                        <input
                          type="number"
                          value={item.suppliesCost}
                          onChange={(e) => handleUpdateCost(item.id, { suppliesCost: parseFloat(e.target.value) || 0 })}
                          className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Margem de Lucro Desejada (%)</label>
                        <input
                          type="number"
                          value={item.desiredMarginPercent}
                          onChange={(e) => handleUpdateCost(item.id, { desiredMarginPercent: parseFloat(e.target.value) || 50 })}
                          className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white"
                        />
                      </div>
                    </div>

                    {/* Result Card */}
                    <div className="pt-2 border-t border-slate-200 space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Custo Direto Total:</span>
                        <strong className="text-slate-900">R$ {totalDirect.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Lucro Bruto Estimado:</span>
                        <strong className="text-emerald-600">+ R$ {grossProfit.toFixed(2)} ({realMargin}%)</strong>
                      </div>
                      <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-100">
                        <span className="text-slate-900">Preço Sugerido:</span>
                        <span className="text-teal-700 font-extrabold text-sm">R$ {item.suggestedPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: CLINICAL FOLLOW-UP */}
      {subTab === 'followup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: New Follow up log */}
          <div className="lg:col-span-5 space-y-4">
            <form onSubmit={handleAddFollowUp} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  Registro de Acompanhamento Evolutivo
                </h3>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nome do Paciente</label>
                <input
                  type="text"
                  required
                  value={newPatientFollowUp}
                  onChange={(e) => setNewPatientFollowUp(e.target.value)}
                  placeholder="Ex: Mariana Castro"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Diagnóstico / Protocolo</label>
                <input
                  type="text"
                  value={newDiagnosisFollowUp}
                  onChange={(e) => setNewDiagnosisFollowUp(e.target.value)}
                  placeholder="Ex: Melasma Misto Facial / Acne Grau II"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Índice de Melhora Estimada: {newScoreFollowUp}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newScoreFollowUp}
                  onChange={(e) => setNewScoreFollowUp(parseInt(e.target.value))}
                  className="w-full accent-amber-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Evolução & Conduta da Sessão</label>
                <textarea
                  rows={3}
                  value={newNotesFollowUp}
                  onChange={(e) => setNewNotesFollowUp(e.target.value)}
                  placeholder="Ex: Paciente relata excelente tolerância ao sérum despigmentante, clareamento visível de 30%..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Salvar Registro de Evolução</span>
              </button>
            </form>
          </div>

          {/* Right: Follow up list */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Histórico de Acompanhamentos Clínicos
              </h4>

              {followUps.length > 0 ? (
                <div className="space-y-3">
                  {followUps.map((rec) => (
                    <div key={rec.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-slate-900 text-sm">{rec.patientName}</span>
                          <span className="text-xs text-slate-500 block">{rec.diagnosis} • Início: {rec.startDate}</span>
                        </div>
                        <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                          Melhora: {rec.sessions[0]?.improvementScore}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                        {rec.sessions[0]?.notes}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-xl">
                  Nenhum acompanhamento registrado ainda. Utilize o formulário para registrar o 1º paciente.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
