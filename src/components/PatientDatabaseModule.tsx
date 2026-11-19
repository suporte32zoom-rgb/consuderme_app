import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Edit3,
  Trash2,
  Stethoscope,
  Check,
  X,
  FileText,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { DoctorProfile, FitzpatrickType, PatientRecord } from '../types';
import { FITZPATRICK_SCALE } from '../data/clinicalTemplates';
import {
  loadPatients,
  savePatientRecord,
  deletePatientRecord
} from '../utils/patientStorage';
import { safeArray, safeString } from '../utils/safeHelpers';

interface PatientDatabaseModuleProps {
  doctorProfile: DoctorProfile;
  onStartConsultationWithPatient?: (patient: PatientRecord) => void;
}

export const PatientDatabaseModule: React.FC<PatientDatabaseModuleProps> = ({
  doctorProfile,
  onStartConsultationWithPatient
}) => {
  const [patients, setPatients] = useState<PatientRecord[]>(() => loadPatients());
  const [searchTerm, setSearchTerm] = useState('');
  const [fitzpatrickFilter, setFitzpatrickFilter] = useState<'ALL' | FitzpatrickType>('ALL');

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [cpf, setCpf] = useState('');
  const [fitzpatrick, setFitzpatrick] = useState<FitzpatrickType>('III');
  const [allergies, setAllergies] = useState('');
  const [comorbidities, setComorbidities] = useState('');
  const [previousTreatments, setPreviousTreatments] = useState('');
  const [medicalHistoryNotes, setMedicalHistoryNotes] = useState('');

  // UI feedback states
  const [formError, setFormError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const syncPatients = () => {
      setPatients(loadPatients());
    };
    window.addEventListener('consuderme:patients-updated', syncPatients);
    window.addEventListener('storage', syncPatients);
    return () => {
      window.removeEventListener('consuderme:patients-updated', syncPatients);
      window.removeEventListener('storage', syncPatients);
    };
  }, []);

  const fitzpatrickMap = useMemo(() => {
    const map: Record<string, (typeof FITZPATRICK_SCALE)[number]> = {};
    safeArray<(typeof FITZPATRICK_SCALE)[number]>(FITZPATRICK_SCALE).forEach((item) => {
      map[item.type] = item;
    });
    return map;
  }, []);

  const countsByFitzpatrick = useMemo(() => {
    const counts: Record<FitzpatrickType, number> = {
      I: 0,
      II: 0,
      III: 0,
      IV: 0,
      V: 0,
      VI: 0
    };
    safeArray<PatientRecord>(patients).forEach((p) => {
      if (counts[p.fitzpatrick] !== undefined) {
        counts[p.fitzpatrick] += 1;
      }
    });
    return counts;
  }, [patients]);

  const filteredPatients = useMemo(() => {
    const term = safeString(searchTerm).trim().toLowerCase();
    return safeArray<PatientRecord>(patients).filter((patient) => {
      if (fitzpatrickFilter !== 'ALL' && patient.fitzpatrick !== fitzpatrickFilter) {
        return false;
      }
      if (!term) return true;
      return (
        safeString(patient.fullName).toLowerCase().includes(term) ||
        safeString(patient.phone).toLowerCase().includes(term) ||
        safeString(patient.email).toLowerCase().includes(term) ||
        safeString(patient.allergies).toLowerCase().includes(term) ||
        safeString(patient.comorbidities).toLowerCase().includes(term) ||
        safeString(patient.medicalHistoryNotes).toLowerCase().includes(term)
      );
    });
  }, [patients, searchTerm, fitzpatrickFilter]);

  const resetForm = () => {
    setEditingId(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setBirthDate('');
    setCpf('');
    setFitzpatrick('III');
    setAllergies('');
    setComorbidities('');
    setPreviousTreatments('');
    setMedicalHistoryNotes('');
    setFormError(null);
  };

  const handleEditPatient = (patient: PatientRecord) => {
    setEditingId(patient.id);
    setFullName(safeString(patient.fullName));
    setPhone(safeString(patient.phone));
    setEmail(safeString(patient.email));
    setBirthDate(safeString(patient.birthDate));
    setCpf(safeString(patient.cpf));
    setFitzpatrick(patient.fitzpatrick || 'III');
    setAllergies(safeString(patient.allergies));
    setComorbidities(safeString(patient.comorbidities));
    setPreviousTreatments(safeString(patient.previousTreatments));
    setMedicalHistoryNotes(safeString(patient.medicalHistoryNotes));
    setFormError(null);
    setPendingDeleteId(null);
  };

  const persistPatient = (): PatientRecord | null => {
    if (!safeString(fullName).trim()) {
      setFormError('Informe o nome completo do paciente para salvar o cadastro.');
      return null;
    }

    const { patients: updated, saved } = savePatientRecord({
      id: editingId || undefined,
      fullName: safeString(fullName).trim(),
      phone: safeString(phone).trim(),
      email: safeString(email).trim(),
      birthDate: safeString(birthDate).trim(),
      cpf: safeString(cpf).trim(),
      fitzpatrick: fitzpatrick || 'III',
      allergies: safeString(allergies).trim(),
      comorbidities: safeString(comorbidities).trim(),
      previousTreatments: safeString(previousTreatments).trim(),
      medicalHistoryNotes: safeString(medicalHistoryNotes).trim()
    });

    setPatients(updated);
    setFormError(null);
    return saved;
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = persistPatient();
    if (!saved) return;

    const actionLabel = editingId ? 'Cadastro atualizado' : 'Paciente cadastrado';
    setSavedNotice(`${actionLabel}: ${saved.fullName}`);
    setTimeout(() => setSavedNotice(null), 3000);
    resetForm();
  };

  const handleSaveAndConsult = () => {
    const saved = persistPatient();
    if (!saved) return;
    resetForm();
    if (onStartConsultationWithPatient) {
      onStartConsultationWithPatient(saved);
    }
  };

  const handleConfirmDelete = (id: string) => {
    const updated = deletePatientRecord(id);
    setPatients(updated);
    setPendingDeleteId(null);
    if (editingId === id) {
      resetForm();
    }
  };

  const formatShortDate = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleDateString('pt-BR');
    } catch {
      return '';
    }
  };

  const activeFitzInfo = fitzpatrickMap[fitzpatrick];

  return (
    <div className="space-y-6 animate-fadeIn w-full max-w-full box-border">
      {/* Module Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-6 border border-teal-800/40 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-300">
              <Users className="w-4 h-4" />
              <span>Base de Pacientes & Classificação por Fototipo</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{patients.length} cadastrados</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Prontuário Rápido de Pacientes
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Armazene contatos, histórico médico, alergias e marque o Fototipo de Fitzpatrick (I–VI) de cada paciente para preenchimento imediato durante a consulta clínica de{' '}
              <strong className="text-white">{safeString(doctorProfile?.name, 'Dr(a). Dermatologista')}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Paciente</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Search, Fitzpatrick Filters & Directory */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
            {/* Search & Count */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, telefone, alergia ou histórico médico..."
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label="Limpar busca"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-500 font-medium tabular-nums whitespace-nowrap shrink-0">
                {filteredPatients.length} de {patients.length}{' '}
                {patients.length === 1 ? 'paciente' : 'pacientes'}
              </div>
            </div>

            {/* Interactive Fitzpatrick Filter Segmented Controls */}
            <div className="flex items-center gap-1.5 flex-wrap p-1.5 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setFitzpatrickFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 tabular-nums ${
                  fitzpatrickFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({patients.length})
              </button>

              {safeArray<(typeof FITZPATRICK_SCALE)[number]>(FITZPATRICK_SCALE).map((item) => {
                const count = countsByFitzpatrick[item.type] || 0;
                const isActive = fitzpatrickFilter === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setFitzpatrickFilter(item.type)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 tabular-nums ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: item.colorTone }}
                    />
                    <span>Fitz {item.type}</span>
                    <span className="text-slate-400">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Patient Directory List / Empty States */}
            {patients.length === 0 ? (
              <div className="py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-slate-200/70 text-slate-500 flex items-center justify-center mx-auto">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  Nenhum paciente cadastrado ainda
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Use o formulário ao lado para registrar contatos, alergias, notas clínicas e o fototipo de Fitzpatrick dos seus pacientes. Todos os dados ficam salvos localmente no seu dispositivo.
                </p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-center space-y-2.5">
                <p className="text-sm font-bold text-slate-800">
                  Nenhum paciente encontrado com os filtros atuais
                </p>
                <p className="text-xs text-slate-500">
                  Ajuste o termo de busca ou selecione todos os fototipos.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setFitzpatrickFilter('ALL');
                  }}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {filteredPatients.map((patient) => {
                  const fitzInfo = fitzpatrickMap[patient.fitzpatrick];
                  const isEditingThis = editingId === patient.id;
                  const isConfirmingDelete = pendingDeleteId === patient.id;

                  return (
                    <div
                      key={patient.id}
                      className={`p-4 transition-colors space-y-2.5 ${
                        isEditingThis ? 'bg-teal-50/50' : 'bg-white hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {safeString(patient.fullName)}
                            </h4>
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                              <span
                                className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                                style={{ backgroundColor: fitzInfo?.colorTone || '#D2A17E' }}
                              />
                              <span>Fototipo {safeString(patient.fitzpatrick, 'III')}</span>
                            </span>
                          </div>

                          {/* Clean unboxed contact metadata */}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 tabular-nums">
                            <span className="inline-flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {safeString(patient.phone, 'Sem telefone')}
                            </span>
                            {patient.email && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-1 truncate max-w-[220px]">
                                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                  {patient.email}
                                </span>
                              </>
                            )}
                            {patient.birthDate && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  Nasc.: {patient.birthDate}
                                </span>
                              </>
                            )}
                            {patient.lastVisitAt && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>Última consulta: {formatShortDate(patient.lastVisitAt)}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Row Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {onStartConsultationWithPatient && (
                            <button
                              type="button"
                              onClick={() => onStartConsultationWithPatient(patient)}
                              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap shrink-0"
                              title="Abrir este paciente diretamente na Consulta Clínica"
                            >
                              <Stethoscope className="w-3.5 h-3.5" />
                              <span>Consultar</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleEditPatient(patient)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
                            title="Editar cadastro"
                            aria-label={`Editar ${patient.fullName}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {!isConfirmingDelete ? (
                            <button
                              type="button"
                              onClick={() => setPendingDeleteId(patient.id)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 text-slate-500 hover:text-red-700 transition"
                              title="Excluir paciente"
                              aria-label={`Excluir ${patient.fullName}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                              <button
                                type="button"
                                onClick={() => handleConfirmDelete(patient.id)}
                                className="text-[11px] font-bold text-red-700 hover:text-red-900 whitespace-nowrap"
                              >
                                Confirmar
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                onClick={() => setPendingDeleteId(null)}
                                className="text-[11px] font-medium text-slate-600 hover:text-slate-900"
                              >
                                Não
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Clinical Notes & Allergies Preview */}
                      {(patient.allergies || patient.comorbidities || patient.medicalHistoryNotes) && (
                        <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                          {patient.allergies && (
                            <div className="flex items-start gap-1.5 text-red-800">
                              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                              <span>
                                <strong>Alergias:</strong> {patient.allergies}
                              </span>
                            </div>
                          )}
                          {patient.comorbidities && (
                            <div>
                              <strong className="text-slate-800">Comorbidades:</strong>{' '}
                              {patient.comorbidities}
                            </div>
                          )}
                          {patient.medicalHistoryNotes && (
                            <div className="flex items-start gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{patient.medicalHistoryNotes}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Patient Create / Edit Form */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleSaveSubmit}
            className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingId ? 'Editar Ficha do Paciente' : 'Cadastrar Novo Paciente'}
                </h3>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Salvo localmente no navegador (LGPD)</span>
                </p>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
              )}
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {savedNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{savedNotice}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nome Completo do Paciente *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Juliana Mendes Cavalcanti"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="paciente@email.com"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="text"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 tabular-nums"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  CPF (Opcional)
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 tabular-nums"
                />
              </div>
            </div>

            {/* Fitzpatrick Skin Type Tagging */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Fototipo de Fitzpatrick *
                </label>
                <span className="text-[11px] font-semibold text-teal-700">
                  Tipo {fitzpatrick}
                </span>
              </div>

              <div className="grid grid-cols-6 gap-1.5">
                {safeArray<(typeof FITZPATRICK_SCALE)[number]>(FITZPATRICK_SCALE).map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setFitzpatrick(item.type)}
                    className={`p-2 rounded-lg border text-center transition flex flex-col items-center justify-between ${
                      fitzpatrick === item.type
                        ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-slate-300 shadow-inner mb-1"
                      style={{ backgroundColor: item.colorTone }}
                    />
                    <span className="text-xs font-extrabold text-slate-900">{item.type}</span>
                  </button>
                ))}
              </div>
              {activeFitzInfo && (
                <p className="text-[11px] text-slate-500 mt-1.5">
                  <strong>{activeFitzInfo.description}:</strong> {activeFitzInfo.sunReaction}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Alergias Conhecidas
              </label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="Ex: Lidocaína, Sulfa, Hidroquinona, Nega alergias"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Comorbidades / Histórico Pessoal e Familiar
              </label>
              <input
                type="text"
                value={comorbidities}
                onChange={(e) => setComorbidities(e.target.value)}
                placeholder="Ex: Hipotireoidismo, histórico familiar de melanoma, gestante"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Tratamentos Prévios Realizados
              </label>
              <input
                type="text"
                value={previousTreatments}
                onChange={(e) => setPreviousTreatments(e.target.value)}
                placeholder="Ex: Toxina botulínica 08/2025, Ácido Azelaico 15%"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Notas de Histórico Médico & Observações
              </label>
              <textarea
                rows={3}
                value={medicalHistoryNotes}
                onChange={(e) => setMedicalHistoryNotes(e.target.value)}
                placeholder="Anotações longitudinais relevantes para futuras consultas, tolerância a ácidos, sensibilidade cutânea..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Check className="w-4 h-4" />
                <span>{editingId ? 'Atualizar Paciente' : 'Salvar Paciente'}</span>
              </button>

              {onStartConsultationWithPatient && (
                <button
                  type="button"
                  onClick={handleSaveAndConsult}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <span>Salvar e Consultar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
