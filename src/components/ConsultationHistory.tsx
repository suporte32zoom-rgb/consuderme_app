import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Trash2,
  User,
  Calendar,
  MapPin,
  Stethoscope,
  ArrowUpRight,
  AlertCircle,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import {
  ConsultationHistoryEntry,
  loadConsultationHistory,
  removeConsultationFromHistory,
  clearConsultationHistory
} from '../utils/consultationStorage';
import { safeArray, safeString } from '../utils/safeHelpers';

interface ConsultationHistoryProps {
  onSelectConsultation?: (entry: ConsultationHistoryEntry) => void;
  maxItems?: number;
  compact?: boolean;
}

export const ConsultationHistory: React.FC<ConsultationHistoryProps> = ({
  onSelectConsultation,
  maxItems,
  compact = false
}) => {
  const [entries, setEntries] = useState<ConsultationHistoryEntry[]>(() => loadConsultationHistory());
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const syncHistory = () => {
      setEntries(loadConsultationHistory());
    };

    window.addEventListener('consuderme:history-updated', syncHistory);
    window.addEventListener('storage', syncHistory);
    return () => {
      window.removeEventListener('consuderme:history-updated', syncHistory);
      window.removeEventListener('storage', syncHistory);
    };
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeConsultationFromHistory(id);
    setEntries(updated);
    if (expandedId === id) {
      setExpandedId(null);
    }
  };

  const handleClearAll = () => {
    const updated = clearConsultationHistory();
    setEntries(updated);
    setConfirmClearAll(false);
    setExpandedId(null);
  };

  const formatDateTime = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      if (Number.isNaN(date.getTime())) return 'Data recente';
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data recente';
    }
  };

  const safeEntries = safeArray<ConsultationHistoryEntry>(entries);
  const filtered = safeEntries.filter((item) => {
    const term = safeString(searchTerm).trim().toLowerCase();
    if (!term) return true;
    return (
      safeString(item.patientName).toLowerCase().includes(term) ||
      safeString(item.complaint).toLowerCase().includes(term) ||
      safeString(item.topography).toLowerCase().includes(term) ||
      safeString(item.primaryHypothesis).toLowerCase().includes(term)
    );
  });

  const visibleEntries = typeof maxItems === 'number' ? filtered.slice(0, maxItems) : filtered;

  return (
    <section className="w-full max-w-full box-border bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">
                Histórico de Atendimentos
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                {safeEntries.length} {safeEntries.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Persistência local segura no navegador (localStorage • LGPD)</span>
            </p>
          </div>
        </div>

        {/* Actions: Search & Clear */}
        {safeEntries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {!compact && (
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar paciente ou queixa..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}

            {!confirmClearAll ? (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-red-200 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 text-[11px] font-semibold transition flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
                <span className="text-[10px] font-bold text-red-800">Confirmar limpeza?</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 transition"
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold hover:bg-slate-100 transition"
                >
                  Não
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {visibleEntries.length === 0 ? (
        <div className="py-8 px-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/70 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-200/70 text-slate-400 flex items-center justify-center mx-auto">
            <Stethoscope className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-700">
            {safeEntries.length === 0
              ? 'Nenhuma consulta registrada ainda'
              : 'Nenhum atendimento encontrado para a busca informada'}
          </p>
          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
            {safeEntries.length === 0
              ? 'As consultas analisadas ou salvas no módulo de Anamnese Clínica aparecerão aqui automaticamente para consulta rápida.'
              : 'Tente limpar ou ajustar o termo de busca.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visibleEntries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            return (
              <div
                key={entry.id}
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                className="rounded-xl border border-slate-200 hover:border-teal-300 bg-slate-50/60 hover:bg-white p-3.5 transition cursor-pointer space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-900 truncate">
                          {safeString(entry.patientName, 'Paciente não identificado')}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                          Fitzpatrick {safeString(entry.fitzpatrick, 'III')}
                        </span>
                        {entry.primaryHypothesis && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1 max-w-full truncate">
                            <Sparkles className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{entry.primaryHypothesis}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                        {safeString(entry.complaint, 'Sem queixa detalhada')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDateTime(entry.createdAt)}
                    </span>

                    {onSelectConsultation && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectConsultation(entry);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold flex items-center gap-1 transition"
                        title="Carregar dados deste atendimento na ficha clínica"
                      >
                        <span>Reabrir</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleDelete(entry.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Remover registro do histórico"
                      aria-label="Remover registro do histórico"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="pt-2.5 mt-2 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700 animate-fadeIn">
                    {entry.topography && (
                      <div className="bg-white p-2 rounded-lg border border-slate-200/80 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900">Topografia:</strong> {entry.topography}
                        </div>
                      </div>
                    )}
                    {entry.evolutionTime && (
                      <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                        <strong className="text-slate-900">Evolução:</strong> {entry.evolutionTime}
                      </div>
                    )}
                    {entry.symptoms && (
                      <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                        <strong className="text-slate-900">Sintomas:</strong> {entry.symptoms}
                      </div>
                    )}
                    {entry.allergies && (
                      <div className="bg-white p-2 rounded-lg border border-slate-200/80 flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900">Alergias / Comorbidades:</strong> {entry.allergies}
                        </div>
                      </div>
                    )}
                    {entry.differentialSummary && (
                      <div className="sm:col-span-2 bg-teal-50/60 p-2.5 rounded-lg border border-teal-200/80 text-slate-800">
                        <strong className="text-teal-900">Resumo Semiológico:</strong> {entry.differentialSummary}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
