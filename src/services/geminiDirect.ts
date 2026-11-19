// SERVER-SIDE COPILOT API CLIENT
// Routes all Gemini requests through the Express backend (/api/copilot/*) so the API key stays server-only.

import {
  DifferentialDiagnosisResponse,
  PrescriptionResponse,
  ProcedureGuideResponse,
  PostCareResponse
} from '../types';
import { safeArray, safeJoin, safeString } from '../utils/safeHelpers';

async function postCopilotApi<T = any>(endpoint: string, payload: Record<string, any>): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Resposta inválida do servidor (${response.status}).`);
  }

  if (!response.ok || !json?.success) {
    throw new Error(json?.error || `Erro ao consultar o servidor (${response.status}).`);
  }

  return json as T;
}

// ==========================================
// 1. DERMIA CHAT (SERVER-SIDE)
// ==========================================
export async function directDermiaChat(params: {
  message: string;
  conversationHistory?: Array<{ sender: string; text: string }>;
  doctorProfile?: any;
  preferredProvider?: string;
}): Promise<{ text: string; model: string; provider: string; isFreeTier?: boolean }> {
  const { message, conversationHistory = [], doctorProfile = {}, preferredProvider = 'auto' } = params;

  const safeHistory = safeArray<{ sender?: string; text?: string }>(conversationHistory).map((m) => ({
    sender: safeString(m?.sender, 'user'),
    text: safeString(m?.text)
  }));

  const res = await postCopilotApi<{
    success: boolean;
    response: string;
    providerUsed?: string;
    model?: string;
    isFreeTier?: boolean;
  }>('/api/copilot/dermia-chat', {
    message: safeString(message),
    conversationHistory: safeHistory,
    doctorProfile,
    preferredProvider
  });

  return {
    text: safeString(res.response),
    model: safeString(res.model, 'gemini-4-hydrogen'),
    provider: safeString(res.providerUsed, 'Google Gemini (Servidor)'),
    isFreeTier: Boolean(res.isFreeTier)
  };
}

// ==========================================
// 2. DIAGNÓSTICO DIFERENCIAL & ANAMNESE (SERVER-SIDE)
// ==========================================
export type DifferentialAnalysisData = DifferentialDiagnosisResponse;

export async function directDifferentialDiagnosis(params: {
  fitzpatrick: string;
  complaint: string;
  evolutionTime: string;
  topography: string;
  symptoms: string | string[];
  previousTreatments: string;
  comorbidities: string;
  allergies: string;
  photoDesc: string;
}): Promise<DifferentialDiagnosisResponse> {
  const res = await postCopilotApi<{ success: boolean; data: any }>(
    '/api/copilot/differential-diagnosis',
    {
      fitzpatrick: safeString(params?.fitzpatrick, 'III'),
      complaint: safeString(params?.complaint),
      evolutionTime: safeString(params?.evolutionTime),
      topography: safeString(params?.topography),
      symptoms: safeJoin(params?.symptoms) || 'Nenhum',
      previousTreatments: safeString(params?.previousTreatments) || 'Nenhum',
      comorbidities: safeString(params?.comorbidities) || 'Nenhuma',
      allergies: safeString(params?.allergies) || 'Nega',
      photoDesc: safeString(params?.photoDesc)
    }
  );

  const parsed = res?.data || {};
  const rawDiffs = safeArray<any>(parsed.differentials);
  const rawRedFlags = safeArray<any>(parsed.redFlags);
  const rawWorkup = safeArray<string>(parsed.diagnosticWorkup);

  return {
    summary: safeString(parsed.summary),
    differentials: rawDiffs.map((d: any) => ({
      disease: safeString(d?.disease, 'Hipótese Clínica'),
      probability: safeString(d?.probability, 'Investigar'),
      clinicalRationale: safeString(d?.clinicalRationale),
      semiologyFeatures: safeString(d?.semiologyFeatures)
    })),
    redFlags: rawRedFlags.map((r: any) => ({
      warningTitle: safeString(r?.warningTitle, 'Alerta Clínico'),
      severity: safeString(r?.severity, 'Atenção'),
      actionProtocol: safeString(r?.actionProtocol)
    })),
    diagnosticWorkup: rawWorkup.map((w) => safeString(w)),
    initialManagement: safeString(parsed.initialManagement)
  };
}

// ==========================================
// 3. GERADOR DE PRESCRIÇÃO MAGISTRAL (SERVER-SIDE)
// ==========================================
export type PrescriptionData = PrescriptionResponse;

export async function directPrescriptionGenerator(params: {
  indication: string;
  fitzpatrick: string;
  skinType: string;
  vehiclePreference?: string;
  specialNotes?: string;
  doctorNotes?: string;
}): Promise<PrescriptionResponse> {
  const res = await postCopilotApi<{ success: boolean; data: any }>(
    '/api/copilot/prescription-generator',
    {
      indication: safeString(params?.indication, 'Tratamento Dermatológico'),
      fitzpatrick: safeString(params?.fitzpatrick, 'III'),
      skinType: safeString(params?.skinType, 'Mista'),
      vehiclePreference: safeString(params?.vehiclePreference),
      specialNotes: safeString(params?.specialNotes),
      doctorNotes: safeString(params?.doctorNotes)
    }
  );

  const parsed = res?.data || {};
  const rawFormulas = safeArray<any>(parsed.magistralFormulas);
  const rawIndustrial = safeArray<any>(parsed.industrialOptions);
  const morningRoutine = safeArray<string>(parsed.generalSkincareRoutine?.morning);
  const nightRoutine = safeArray<string>(parsed.generalSkincareRoutine?.night);

  return {
    magistralFormulas: rawFormulas.map((f: any) => ({
      title: safeString(f?.title || f?.formulaTitle, 'Fórmula Magistral Personalizada'),
      vehicle: safeString(f?.vehicle || f?.vehicleSelected, 'Veículo q.s.p. 30g'),
      actives: safeArray<any>(f?.actives).map((a: any) => ({
        name: safeString(a?.name, 'Ativo'),
        percentage: safeString(a?.percentage || a?.concentration, '1%'),
        rationale: safeString(a?.rationale || a?.action, 'Ação dermatológica')
      })),
      posology: safeString(f?.posology, 'Aplicar conforme orientação médica'),
      warnings: safeString(f?.warnings, 'Uso externo. Evitar mucosas.')
    })),
    industrialOptions: rawIndustrial.map((ind: any) => ({
      name: safeString(ind?.name, 'Dermocosmético'),
      activeIngredient: safeString(ind?.activeIngredient),
      posology: safeString(ind?.posology)
    })),
    photoprotectionStrategy: safeString(parsed.photoprotectionStrategy),
    generalSkincareRoutine: {
      morning: morningRoutine.map((s) => safeString(s)),
      night: nightRoutine.map((s) => safeString(s))
    }
  };
}

// ==========================================
// 4. GUIA DE INJETÁVEIS (SERVER-SIDE)
// ==========================================
export type ProcedureGuideData = ProcedureGuideResponse;

export async function directProcedureGuide(params: {
  procedureType: string;
  targetArea: string;
  patientProfile?: string;
}): Promise<ProcedureGuideResponse> {
  const res = await postCopilotApi<{ success: boolean; data: any }>(
    '/api/copilot/procedure-guide',
    {
      procedureType: safeString(params?.procedureType, 'Toxina Botulínica e Injetáveis'),
      targetArea: safeString(params?.targetArea, 'Face'),
      patientProfile: safeString(params?.patientProfile, 'Adulto padrão')
    }
  );

  const parsed = res?.data || {};
  const rawDosage = safeArray<any>(parsed.dosageAndPoints);
  const rawDanger = safeArray<any>(parsed.dangerZonesAndVessels);
  const rawComplications = safeArray<string>(parsed.potentialComplications);

  return {
    procedureName: safeString(parsed.procedureName),
    anatomicalPlanes: safeString(parsed.anatomicalPlanes),
    dosageAndPoints: rawDosage.map((dp: any) => ({
      area: safeString(dp?.area),
      recommendedUnitsOrVolume: safeString(dp?.recommendedUnitsOrVolume),
      injectionTechnique: safeString(dp?.injectionTechnique),
      targetMuscleOrStructure: safeString(dp?.targetMuscleOrStructure)
    })),
    dangerZonesAndVessels: rawDanger.map((dz: any) => ({
      vessel: safeString(dz?.vessel),
      dangerLocation: safeString(dz?.dangerLocation),
      safetyRule: safeString(dz?.safetyRule)
    })),
    potentialComplications: rawComplications.map((c) => safeString(c)),
    emergencyProtocol: safeString(parsed.emergencyProtocol),
    postCareSummary: safeString(parsed.postCareSummary)
  };
}

// ==========================================
// 5. GERADOR DE ORIENTAÇÕES PÓS-PROCEDIMENTO (SERVER-SIDE)
// ==========================================
export type PostCareData = PostCareResponse;

export async function directPostCareGenerator(params: {
  procedure: string;
  patientName: string;
  doctorName: string;
  clinicPhone: string;
  specificNotes?: string;
}): Promise<PostCareResponse> {
  const res = await postCopilotApi<{ success: boolean; data: any }>(
    '/api/copilot/post-care-generator',
    {
      procedure: safeString(params?.procedure, 'Procedimento Dermatológico'),
      patientName: safeString(params?.patientName, 'Paciente'),
      doctorName: safeString(params?.doctorName, 'seu dermatologista'),
      clinicPhone: safeString(params?.clinicPhone, 'ConsuDerme'),
      specificNotes: safeString(params?.specificNotes, 'Nenhuma')
    }
  );

  const parsed = res?.data || {};
  const rawWarnings = safeArray<string>(parsed.urgentWarningSigns);

  return {
    whatsappMessage: safeString(parsed.whatsappMessage),
    printedDocument: safeString(parsed.printedDocument),
    urgentWarningSigns: rawWarnings.map((w) => safeString(w))
  };
}
