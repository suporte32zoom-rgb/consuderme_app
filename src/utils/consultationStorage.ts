import { FitzpatrickType } from '../types';
import { safeStorageGet, safeStorageSet, safeString } from './safeHelpers';

export const CONSULTATION_HISTORY_STORAGE_KEY = 'consuderme_consultation_history';
const MAX_HISTORY_ENTRIES = 50;

export interface ConsultationHistoryEntry {
  id: string;
  patientName: string;
  fitzpatrick: FitzpatrickType;
  complaint: string;
  evolutionTime: string;
  topography: string;
  symptoms: string;
  previousTreatments: string;
  comorbidities: string;
  allergies: string;
  photoDesc: string;
  primaryHypothesis: string;
  differentialSummary: string;
  createdAt: string;
}

const VALID_FITZPATRICK: FitzpatrickType[] = ['I', 'II', 'III', 'IV', 'V', 'VI'];

function sanitizeEntry(raw: any): ConsultationHistoryEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const fitz = VALID_FITZPATRICK.includes(raw.fitzpatrick) ? raw.fitzpatrick : 'III';
  return {
    id: safeString(raw.id) || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    patientName: safeString(raw.patientName).trim() || 'Paciente não identificado',
    fitzpatrick: fitz,
    complaint: safeString(raw.complaint),
    evolutionTime: safeString(raw.evolutionTime),
    topography: safeString(raw.topography),
    symptoms: safeString(raw.symptoms),
    previousTreatments: safeString(raw.previousTreatments),
    comorbidities: safeString(raw.comorbidities),
    allergies: safeString(raw.allergies),
    photoDesc: safeString(raw.photoDesc),
    primaryHypothesis: safeString(raw.primaryHypothesis),
    differentialSummary: safeString(raw.differentialSummary),
    createdAt: safeString(raw.createdAt) || new Date().toISOString()
  };
}

export function loadConsultationHistory(): ConsultationHistoryEntry[] {
  const rawList = safeStorageGet<unknown[]>(CONSULTATION_HISTORY_STORAGE_KEY, []);
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map(sanitizeEntry)
    .filter((entry): entry is ConsultationHistoryEntry => entry !== null);
}

export function saveConsultationToHistory(
  input: Omit<ConsultationHistoryEntry, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): ConsultationHistoryEntry[] {
  const current = loadConsultationHistory();
  const entry = sanitizeEntry({
    ...input,
    id: input.id || `cons-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: input.createdAt || new Date().toISOString()
  });

  if (!entry) return current;

  const updated = [entry, ...current.filter((item) => item.id !== entry.id)].slice(
    0,
    MAX_HISTORY_ENTRIES
  );
  safeStorageSet(CONSULTATION_HISTORY_STORAGE_KEY, updated);
  window.dispatchEvent(new CustomEvent('consuderme:history-updated'));
  return updated;
}

export function removeConsultationFromHistory(id: string): ConsultationHistoryEntry[] {
  const current = loadConsultationHistory();
  const updated = current.filter((item) => item.id !== id);
  safeStorageSet(CONSULTATION_HISTORY_STORAGE_KEY, updated);
  window.dispatchEvent(new CustomEvent('consuderme:history-updated'));
  return updated;
}

export function clearConsultationHistory(): ConsultationHistoryEntry[] {
  safeStorageSet(CONSULTATION_HISTORY_STORAGE_KEY, []);
  window.dispatchEvent(new CustomEvent('consuderme:history-updated'));
  return [];
}
