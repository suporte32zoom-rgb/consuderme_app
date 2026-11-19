import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Copy, 
  Check, 
  Printer, 
  Code, 
  Search, 
  FileSignature, 
  Download, 
  Building2, 
  User, 
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { LEGAL_DOCUMENTS, LegalDocTemplate } from '../data/legalDocuments';
import { DoctorProfile } from '../types';

interface LegalDocumentsModuleProps {
  doctorProfile: DoctorProfile;
}

export const LegalDocumentsModule: React.FC<LegalDocumentsModuleProps> = ({ doctorProfile }) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(LEGAL_DOCUMENTS[0].id);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Customization fields for TCLEs & docs
  const [patientName, setPatientName] = useState<string>('');
  const [patientCpf, setPatientCpf] = useState<string>('');
  const [patientBirth, setPatientBirth] = useState<string>('');

  const selectedDoc = LEGAL_DOCUMENTS.find(d => d.id === selectedDocId) || LEGAL_DOCUMENTS[0];

  const filteredDocs = LEGAL_DOCUMENTS.filter(doc => {
    if (filterCategory === 'all') return true;
    return doc.category === filterCategory;
  });

  // Dynamically replace placeholders with Doctor and Patient data
  const getProcessedContent = (rawContent: string) => {
    let text = rawContent;
    text = text.replace(/\[NOME DO MÉDICO\]/g, doctorProfile.name || 'Dr(a). Dermatologista');
    text = text.replace(/\[CRM\]/g, `${doctorProfile.crm || '00000'}/${doctorProfile.uf || 'UF'}${doctorProfile.rqe ? ` • RQE ${doctorProfile.rqe}` : ''}`);
    text = text.replace(/\[NOME DA CLÍNICA\]/g, doctorProfile.clinicName || 'Consultório de Dermatologia');
    text = text.replace(/\[NOME DO PACIENTE\]/g, patientName || '________________________________________');
    text = text.replace(/\[CPF DO PACIENTE\]/g, patientCpf || '___.___.___-__');
    text = text.replace(/\[DATA DE NASCIMENTO\]/g, patientBirth || '__/__/____');
    return text;
  };

  const currentContent = getProcessedContent(selectedDoc.content);

  const handleCopyText = () => {
    navigator.clipboard.writeText(currentContent);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCopyHtml = () => {
    const htmlSnippet = `
<!-- ${selectedDoc.title} - Em conformidade com LGPD / CFM -->
<div class="consuderme-legal-doc">
  <h2>${selectedDoc.title}</h2>
  <div style="white-space: pre-wrap; font-family: sans-serif; line-height: 1.6; color: #1e293b;">
${currentContent}
  </div>
</div>
    `.trim();
    navigator.clipboard.writeText(htmlSnippet);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedDoc.title} — Consuderme</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; font-size: 13px; }
            .header { border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
            .clinic-title { font-size: 18px; font-weight: bold; color: #0f172a; }
            .doctor-sub { font-size: 12px; color: #475569; }
            .doc-title { font-size: 15px; font-weight: bold; text-align: center; text-transform: uppercase; margin: 15px 0; color: #0f766e; }
            .content { white-space: pre-wrap; text-align: justify; }
            .footer { margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="clinic-title">${doctorProfile.clinicName || 'Consultório de Dermatologia'}</div>
              <div class="doctor-sub">${doctorProfile.name || 'Médico(a) Responsável'} — CRM ${doctorProfile.crm || ''}/${doctorProfile.uf || ''} ${doctorProfile.rqe ? `• RQE ${doctorProfile.rqe}` : ''}</div>
              <div class="doctor-sub">${doctorProfile.address || ''} • ${doctorProfile.phone || ''}</div>
            </div>
            <div style="font-size: 11px; color: #0d9488; font-weight: bold; text-align: right;">
              CONSU<span style="color:#0f172a">DERME</span><br>
              <span style="font-size: 9px; color: #64748b;">Documento Médico Regulamentado</span>
            </div>
          </div>

          <div class="doc-title">${selectedDoc.title}</div>
          <div class="content">${currentContent}</div>

          <div class="footer">
            <span>Emissão: ${new Date().toLocaleDateString('pt-BR')}</span>
            <span>Documento em conformidade com as diretrizes do CFM e Lei nº 13.709/2018 (LGPD)</span>
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
      {/* Header Info */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 border border-blue-800/40 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>MÓDULO 1: GERADOR DE PÁGINAS INSTITUCIONAIS E LEGAIS</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Documentos Regulatórios, LGPD e TCLEs Médicos
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl mt-1 leading-relaxed">
              Estruturas jurídicas completas e auditadas em conformidade com o <strong>Marco Civil da Internet</strong>, <strong>LGPD Sensível de Saúde (Art. 11)</strong>, <strong>Resoluções do CFM</strong> e planos comerciais de assinatura (R$ 59,90/mês e R$ 599,00/ano).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF Timbrado</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Document List + Viewer/Customizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Document Navigation & Filters */}
        <div className="lg:col-span-4 space-y-4">
          {/* Category Tabs */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Categorias Regulatórias</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                onClick={() => setFilterCategory('all')}
                className={`py-1.5 px-2.5 rounded-lg font-medium text-left transition ${
                  filterCategory === 'all'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Todos ({LEGAL_DOCUMENTS.length})
              </button>
              <button
                onClick={() => setFilterCategory('tcle')}
                className={`py-1.5 px-2.5 rounded-lg font-medium text-left transition ${
                  filterCategory === 'tcle'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                TCLEs Pacientes (5)
              </button>
              <button
                onClick={() => setFilterCategory('institucional')}
                className={`py-1.5 px-2.5 rounded-lg font-medium text-left transition ${
                  filterCategory === 'institucional'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Termos & Quem Somos
              </button>
              <button
                onClick={() => setFilterCategory('privacidade_lgpd')}
                className={`py-1.5 px-2.5 rounded-lg font-medium text-left transition ${
                  filterCategory === 'privacidade_lgpd'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                LGPD & CFM
              </button>
            </div>
          </div>

          {/* Document list */}
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-sm max-h-[550px] overflow-y-auto">
            {filteredDocs.map((doc) => {
              const isSelected = doc.id === selectedDocId;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-blue-50/80 border-l-4 border-blue-600' 
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      doc.category === 'tcle' 
                        ? 'bg-amber-100 text-amber-800' 
                        : doc.category === 'privacidade_lgpd' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {doc.category === 'tcle' ? 'TCLE Clínico' : doc.category === 'privacidade_lgpd' ? 'LGPD Médica' : 'Institucional'}
                    </span>
                    {isSelected && <CheckCircle className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <h4 className={`text-xs font-bold mt-1.5 ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                    {doc.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {doc.shortDesc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Quick TCLE Patient Auto-fill panel */}
          {selectedDoc.category === 'tcle' && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <FileSignature className="w-4 h-4 text-amber-700" />
                <span>Preenchimento Rápido do TCLE para o Paciente</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Os dados preenchidos abaixo serão inseridos diretamente nas linhas do Termo para assinatura presencial.
              </p>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Nome do Paciente</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Ex: Maria Fernandes da Silva"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">CPF</label>
                    <input
                      type="text"
                      value={patientCpf}
                      onChange={(e) => setPatientCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Data Nasc.</label>
                    <input
                      type="text"
                      value={patientBirth}
                      onChange={(e) => setPatientBirth(e.target.value)}
                      placeholder="DD/MM/AAAA"
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Area: Document Viewer & Action Toolbar */}
        <div className="lg:col-span-8 space-y-4">
          {/* Action Toolbar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {selectedDoc.title}
              </h3>
              <p className="text-xs text-slate-500">
                Com dados vinculados a: <strong>{doctorProfile.name || 'Médico Cadastrado'}</strong> (CRM {doctorProfile.crm || '---'})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyText}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition border border-slate-300"
                title="Copiar texto integral"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                onClick={handleCopyHtml}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition border border-slate-300"
                title="Copiar HTML pronto para site"
              >
                {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Code className="w-3.5 h-3.5" />}
                <span>{copiedHtml ? 'HTML Copiado!' : 'Copiar HTML (Site)'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>

          {/* Document Content Paper View */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm font-sans">
            {/* Timbre Header */}
            <div className="border-b-2 border-teal-600 pb-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-base font-extrabold text-slate-900">
                  {doctorProfile.clinicName || 'CONSULTÓRIO DE DERMATOLOGIA'}
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  {doctorProfile.name || 'Dr(a). Dermatologista'} — CRM {doctorProfile.crm || '00000'}/{doctorProfile.uf || 'UF'}
                  {doctorProfile.rqe ? ` • RQE ${doctorProfile.rqe}` : ''}
                </div>
                <div className="text-[11px] text-slate-400">
                  {doctorProfile.address || 'Endereço Profissional'} {doctorProfile.phone ? `• Contato: ${doctorProfile.phone}` : ''}
                </div>
              </div>

              <div className="text-right sm:block hidden">
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                  Documento Oficial Consuderme
                </span>
                <div className="text-[10px] text-slate-400 mt-1">Conformidade CFM / LGPD</div>
              </div>
            </div>

            {/* Document Body */}
            <div className="prose prose-sm max-w-none text-slate-800 leading-relaxed font-mono sm:font-sans whitespace-pre-wrap text-xs md:text-sm bg-slate-50/50 p-4 sm:p-6 rounded-lg border border-slate-100">
              {currentContent}
            </div>

            {/* Timbre Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
              <div>Consuderme — Sistema de Gestão Dermatológica e Conformidade Regulatória</div>
              <div>Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
