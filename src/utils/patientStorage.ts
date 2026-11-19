import { FitzpatrickType, PatientRecord } from '../types';
import { safeStorageGet, safeStorageSet, safeString } from './safeHelpers';

export const PATIENT_DB_STORAGE_KEY = 'consuderme_patients_db';
const VALID_FITZPATRICK: FitzpatrickType[] = ['I', 'II', 'III', 'IV', 'V', 'VI'];

function sanitizePatientRecord(raw: any): PatientRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const fullName = safeString(raw.fullName).trim();
  if (!fullName) return null;

  const fitz = VALID_FITZPATRICK.includes(raw.fitzpatrick) ? raw.fitzpatrick : 'III';
  const now = new Date().toISOString();

  return {
    id: safeString(raw.id) || `pat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fullName,
    phone: safeString(raw.phone).trim(),
    email: safeString(raw.email).trim(),
    birthDate: safeString(raw.birthDate).trim(),
    cpf: safeString(raw.cpf).trim(),
    fitzpatrick: fitz,
    allergies: safeString(raw.allergies).trim(),
    comorbidities: safeString(raw.comorbidities).trim(),
    previousTreatments: safeString(raw.previousTreatments).trim(),
    medicalHistoryNotes: safeString(raw.medicalHistoryNotes).trim(),
    lastVisitAt: safeString(raw.lastVisitAt).trim() || undefined,
    createdAt: safeString(raw.createdAt) || now,
    updatedAt: safeString(raw.updatedAt) || now
  };
}

export function loadPatients(): PatientRecord[] {
  const rawList = safeStorageGet<unknown[]>(PATIENT_DB_STORAGE_KEY, []);
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map(sanitizePatientRecord)
    .filter((item): item is PatientRecord => item !== null)
    .sort((a, b) => safeString(b.updatedAt).localeCompare(safeString(a.updatedAt)));
}

export function savePatientRecord(
  input: Omit<PatientRecord, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    createdAt?: string;
  }
): { patients: PatientRecord[]; saved: PatientRecord | null } {
  const current = loadPatients();
  const existing = input.id ? current.find((p) => p.id === input.id) : undefined;
  const now = new Date().toISOString();

  const record = sanitizePatientRecord({
    ...existing,
    ...input,
    id: input.id || `pat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: existing?.createdAt || input.createdAt || now,
    updatedAt: now
  });

  if (!record) {
    return { patients: current, saved: null };
  }

  const updated = [record, ...current.filter((p) => p.id !== record.id)];
  safeStorageSet(PATIENT_DB_STORAGE_KEY, updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('consuderme:patients-updated'));
  }
  return { patients: updated, saved: record };
}

export function deletePatientRecord(id: string): PatientRecord[] {
  const current = loadPatients();
  const updated = current.filter((p) => p.id !== id);
  safeStorageSet(PATIENT_DB_STORAGE_KEY, updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('consuderme:patients-updated'));
  }
  return updated;
}

export function markPatientLastVisit(id: string): PatientRecord[] {
  const current = loadPatients();
  const now = new Date().toISOString();
  const updated = current.map((p) =>
    p.id === id ? { ...p, lastVisitAt: now, updatedAt: now } : p
  );
  safeStorageSet(PATIENT_DB_STORAGE_KEY, updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('consuderme:patients-updated'));
  }
  return updated;
}
