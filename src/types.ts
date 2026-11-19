export type FitzpatrickType = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';

export type NavigationTab = 'dashboard' | 'clinical' | 'patients' | 'prescriptions' | 'procedures' | 'management' | 'financial' | 'legal';

export interface DoctorProfile {
  name: string;
  crm: string;
  uf: string;
  rqe?: string;
  clinicName: string;
  email: string;
  phone: string;
  address: string;
  logoUrl?: string;
}

export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'bank_slip' | 'bank_transfer';
export type PaymentStatus = 'received' | 'pending' | 'overdue' | 'cancelled';
export type FinancialCategory = 
  | 'consultation'
  | 'procedure_botox'
  | 'procedure_filler'
  | 'procedure_biostimulator'
  | 'procedure_peeling'
  | 'procedure_surgery'
  | 'procedure_laser'
  | 'other_procedure'
  | 'supplies_cosmetics'
  | 'supplies_injectables'
  | 'supplies_disposables'
  | 'clinic_rent'
  | 'utilities'
  | 'staff_salary'
  | 'software_systems'
  | 'marketing'
  | 'taxes_anuidade'
  | 'equipment'
  | 'other_expense';

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  description: string;
  category: FinancialCategory;
  categoryLabel: string;
  amount: number;
  date: string;
  dueDate?: string;
  paymentMethod: PaymentMethod;
  installments?: number;
  status: PaymentStatus;
  patientName?: string;
  notes?: string;
  costOfGoods?: number;
  createdAt: string;
}

export interface DifferentialDiagnosisItem {
  disease: string;
  probability: 'Alta' | 'Média' | 'Baixa' | 'Investigar' | string;
  clinicalRationale: string;
  semiologyFeatures?: string;
}

export interface RedFlagAlert {
  warningTitle: string;
  severity: 'Crítico' | 'Moderado' | 'Atenção' | string;
  actionProtocol: string;
}

export interface DifferentialDiagnosisResponse {
  summary: string;
  differentials: DifferentialDiagnosisItem[];
  redFlags: RedFlagAlert[];
  diagnosticWorkup: string[];
  initialManagement: string;
}

export interface MagistralActive {
  name: string;
  percentage: string;
  rationale: string;
}

export interface MagistralFormula {
  title: string;
  vehicle: string;
  actives: MagistralActive[];
  posology: string;
  warnings: string;
}

export interface IndustrialOption {
  name: string;
  activeIngredient: string;
  posology: string;
}

export interface PrescriptionResponse {
  magistralFormulas: MagistralFormula[];
  industrialOptions: IndustrialOption[];
  photoprotectionStrategy: string;
  generalSkincareRoutine: {
    morning: string[];
    night: string[];
  };
}

export interface ProcedureDosagePoint {
  area: string;
  recommendedUnitsOrVolume: string;
  injectionTechnique: string;
  targetMuscleOrStructure: string;
}

export interface DangerZoneVessel {
  vessel: string;
  dangerLocation: string;
  safetyRule: string;
}

export interface ProcedureGuideResponse {
  procedureName: string;
  anatomicalPlanes: string;
  dosageAndPoints: ProcedureDosagePoint[];
  dangerZonesAndVessels: DangerZoneVessel[];
  potentialComplications: string[];
  emergencyProtocol: string;
  postCareSummary: string;
}

export interface PostCareResponse {
  whatsappMessage: string;
  printedDocument: string;
  urgentWarningSigns: string[];
}

export interface PatientConsultation {
  id: string;
  patientName: string;
  birthDate?: string;
  phone?: string;
  fitzpatrick: FitzpatrickType;
  complaint: string;
  evolutionTime: string;
  topography: string;
  symptoms: string;
  previousTreatments: string;
  comorbidities: string;
  allergies: string;
  photoDesc?: string;
  aiDiagnosis?: DifferentialDiagnosisResponse;
  prescriptions?: MagistralFormula[];
  doctorNotes?: string;
  createdAt: string;
}

export interface PatientRecord {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  birthDate?: string;
  cpf?: string;
  fitzpatrick: FitzpatrickType;
  allergies: string;
  comorbidities: string;
  previousTreatments: string;
  medicalHistoryNotes: string;
  lastVisitAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalFollowUp {
  id: string;
  patientName: string;
  diagnosis: string;
  startDate: string;
  targetArea: string;
  treatmentPlan: string;
  sessions: {
    date: string;
    sessionNumber: number;
    notes: string;
    improvementScore: number; // 0-100%
    nextReturnDays: number;
  }[];
}

export interface ProcedureCostItem {
  id: string;
  name: string;
  type: 'toxina' | 'preenchedor' | 'bioestimulador' | 'peeling' | 'pequena_cirurgia';
  vialCost: number; // Custo do frasco/seringa
  totalUnitsOrMl: number; // ex: 100 UI ou 1.0 mL
  usedUnitsOrMl: number; // ex: 50 UI ou 1.0 mL
  suppliesCost: number; // seringas, cânula, agulha, gaze, anestésico
  desiredMarginPercent: number; // ex: 60%
  suggestedPrice: number;
}
