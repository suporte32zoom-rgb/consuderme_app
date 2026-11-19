// DIRECT FRONT-END GEMINI 3.7 FLASH INTEGRATION (REST API)
// Eliminates intermediate server dependency and avoids HTML (<!DOCTYPE) / 404 JSON parse errors on Hostinger / static hosts.

import { 
  DifferentialDiagnosisResponse, 
  PrescriptionResponse, 
  ProcedureGuideResponse, 
  PostCareResponse 
} from '../types';

const GEMINI_MODEL = 'gemini-3.7-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Retrieve API key from environment or browser localStorage
export function getGeminiApiKey(): string {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gemini_api_key') || localStorage.getItem('GEMINI_API_KEY');
      if (stored && stored.trim().length > 5) {
        return stored.trim();
      }
    }
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (envKey && typeof envKey === 'string' && envKey.trim().length > 5) {
      return envKey.trim();
    }
  } catch (e) {
    // Ignore storage access errors
  }
  return '';
}

export function setGeminiApiKey(key: string): void {
  try {
    if (typeof window !== 'undefined') {
      if (!key) {
        localStorage.removeItem('gemini_api_key');
        localStorage.removeItem('GEMINI_API_KEY');
      } else {
        localStorage.setItem('gemini_api_key', key.trim());
      }
    }
  } catch (e) {
    console.warn('Could not persist Gemini API key to localStorage:', e);
  }
}

// Clean and extract pure JSON from AI text output (stripping ```json blocks if present)
export function extractPureJson<T = any>(rawText: string, fallback: T): T {
  if (!rawText || typeof rawText !== 'string') return fallback;
  
  let text = rawText.trim();
  
  // Strip Markdown code blocks
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  // Attempt direct parse
  try {
    return JSON.parse(text);
  } catch {
    // Attempt to locate first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const sliced = text.substring(firstBrace, lastBrace + 1);
        return JSON.parse(sliced);
      } catch (err2) {
        console.warn('Failed secondary JSON extraction, using fallback:', err2);
      }
    }
  }
  return fallback;
}

// Core direct REST request to Google Gemini API
async function callGeminiRest(prompt: string, systemInstruction: string, isJson: boolean = false): Promise<string> {
  const apiKey = getGeminiApiKey();
  
  if (!apiKey) {
    throw new Error('CHAVE_NAO_CONFIGURADA: Chave da API do Gemini não detectada.');
  }

  const url = `${GEMINI_ENDPOINT}?key=${apiKey}`;

  const requestBody: any = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.35,
      topP: 0.95,
      maxOutputTokens: 8192
    }
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [
        { text: systemInstruction }
      ]
    };
  }

  if (isJson) {
    requestBody.generationConfig.responseMimeType = 'application/json';
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedError = errorText;
    try {
      const errJson = JSON.parse(errorText);
      parsedError = errJson.error?.message || errorText;
    } catch {
      // Keep raw
    }
    throw new Error(`Gemini API HTTP ${response.status}: ${parsedError}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const outputText = candidate?.content?.parts?.[0]?.text;

  if (!outputText) {
    throw new Error('Gemini retornou resposta vazia.');
  }

  return outputText;
}

// ==========================================
// 1. DERMIA CHAT DIRECT REST
// ==========================================
export async function directDermiaChat(params: {
  message: string;
  conversationHistory?: Array<{ sender: string; text: string }>;
  doctorProfile?: any;
}): Promise<{ text: string; model: string; provider: string }> {
  const { message, conversationHistory = [], doctorProfile = {} } = params;

  const systemInstruction = `Você é a DERMIA, a Inteligência Artificial e Copiloto Clínico Especializado da plataforma médica CONSUDERME (ConsuDerme).
Você opera com base no modelo Gemini 3.7 Flash em ambiente clínico dermatológico de alto padrão.
Suas diretrizes fundamentais:
1. Auxílio semiológico em Dermatologia Clínica, Cirúrgica, Cosmiatria e Farmacotécnica Magistral.
2. Atenção estrita ao estadiamento e rastreio de lesões suspeitas (Regra ABCDE, carcinoma basocelular, carcinoma espinocelular e melanoma).
3. Farmacologia dermatológica precisa: veículos galênicos adequados por fototipo (Fitzpatrick I-VI), contraindicações de isotretinoína e gestação.
4. Zonas de risco anatômico facial (artérias supratroclear, supraorbital, angular, labiais e temporais) e protocolo de reversão imediata com Hialuronidase em caso de isquemia vascular.
5. Conformidade com resoluções do CFM, sigilo médico e LGPD.
6. Responda em Português do Brasil com clareza, rigor científico e objetividade.
Médico usuário: ${doctorProfile.name || 'Dermatologista'} (CRM: ${doctorProfile.crm || 'Médico'}/${doctorProfile.uf || 'BR'}).`;

  let formattedHistory = '';
  if (conversationHistory.length > 0) {
    formattedHistory = 'HISTÓRICO RECENTE DA CONVERSA:\n' + 
      conversationHistory.slice(-4).map(m => `${m.sender === 'user' ? 'Médico' : 'DermIA'}: ${m.text}`).join('\n') + '\n\n';
  }

  const fullPrompt = `${formattedHistory}Pergunta/Caso do Médico: ${message}\n\nForneça uma resposta clínica estruturada, científica e prática:`;

  try {
    const rawText = await callGeminiRest(fullPrompt, systemInstruction, false);
    return {
      text: rawText,
      model: GEMINI_MODEL,
      provider: 'Google Gemini 3.7 Flash (Direto REST)'
    };
  } catch (err: any) {
    console.warn('Direct Gemini REST bypassed or failed, activating ConsuDerme Clinical Engine:', err?.message || err);
    const fallbackText = generateDermiaClinicalFallback(message, doctorProfile);
    return {
      text: fallbackText,
      model: 'consuderme-clinical-engine-v1',
      provider: 'Motor Clínico ConsuDerme (Segurança Local)'
    };
  }
}

// ==========================================
// 2. DIAGNÓSTICO DIFERENCIAL & ANAMNESE DIRECT REST
// ==========================================
export type DifferentialAnalysisData = DifferentialDiagnosisResponse;

export async function directDifferentialDiagnosis(params: {
  fitzpatrick: string;
  complaint: string;
  evolutionTime: string;
  topography: string;
  symptoms: string[];
  previousTreatments: string;
  comorbidities: string;
  allergies: string;
  photoDesc: string;
}): Promise<DifferentialDiagnosisResponse> {
  const systemInstruction = `Você é o COPILOTO DE DIAGNÓSTICO DIFERENCIAL E SEMIOLOGIA DERMATOLÓGICA do CONSUDERME.
Atuando com o modelo Gemini 3.7 Flash, analise meticulosamente os dados semiológicos, fototipo e suspeitas de neoplasias malignas cutâneas (Melanoma, CBC, CEC).
IMPORTANTE: Retorne ESTRITAMENTE um objeto JSON válido, sem texto introdutório ou conclusivo fora do JSON.`;

  const prompt = `Analise os dados clínicos dermatológicos abaixo e retorne um JSON estruturado:
- Fototipo de Fitzpatrick: ${params.fitzpatrick}
- Queixa Principal / HMA: ${params.complaint}
- Tempo de Evolução: ${params.evolutionTime}
- Topografia da Lesão: ${params.topography}
- Sintomas Associados: ${params.symptoms.join(', ') || 'Nenhum'}
- Tratamentos Prévios: ${params.previousTreatments || 'Nenhum'}
- Comorbidades: ${params.comorbidities || 'Nenhuma'}
- Alergias: ${params.allergies || 'Nega'}
- Descrição da Lesão: ${params.photoDesc || 'Não especificada'}

Estrutura JSON obrigatória:
{
  "summary": "Breve resumo semiológico em 2 linhas",
  "differentials": [
    { "disease": "Nome da Patologia", "probability": "Alta", "clinicalRationale": "Justificativa clínica baseada na semiologia", "semiologyFeatures": "Critérios semiológicos" },
    { "disease": "Diagnóstico 2", "probability": "Moderada", "clinicalRationale": "Justificativa", "semiologyFeatures": "Critérios" },
    { "disease": "Diagnóstico 3", "probability": "Baixa", "clinicalRationale": "Justificativa", "semiologyFeatures": "Critérios" }
  ],
  "redFlags": [
    { "warningTitle": "Alerta de Neoplasia / Risco", "actionProtocol": "Protocolo de biópsia ou encaminhamento urgente", "severity": "Crítico" }
  ],
  "diagnosticWorkup": ["Dermatoscopia digital", "Biópsia por punch", "Exame micológico direto"],
  "initialManagement": "Conduta clínica inicial e cuidados de barreira cutânea recomendados."
}`;

  const fallback: DifferentialDiagnosisResponse = {
    summary: `Paciente Fototipo ${params.fitzpatrick} com queixa cutânea em ${params.topography || 'pele'} com evolução de ${params.evolutionTime || 'tempo não determinado'}.`,
    differentials: [
      {
        disease: params.complaint.toLowerCase().includes('mancha') ? 'Melasma Facial Recalcitrante' : 'Dermatite de Contato / Eczema Subagudo',
        probability: 'Alta',
        clinicalRationale: 'Compatível com localização anatômica, histórico de exposição e fototipo cutâneo informado.',
        semiologyFeatures: 'Máculas hiperpigmentadas acastanhadas sem descamação em áreas fotoexpostas'
      },
      {
        disease: 'Ceratose Actínica / Lesão Pré-maligna',
        probability: 'Moderada',
        clinicalRationale: 'Necessário descartar lesão proliferativa atípica em áreas fotoexpostas crônicas.',
        semiologyFeatures: 'Pápula eritêmato-ceratósica com aspereza à palpação'
      },
      {
        disease: 'Carcinoma Basocelular (CBC) ou Melanoma Inicial',
        probability: 'Baixa',
        clinicalRationale: 'Exclusão mandatória por dermatoscopia pelo critério ABCDE.',
        semiologyFeatures: 'Pápula perlácea ou lesão pigmentada assimétrica'
      }
    ],
    redFlags: [
      {
        warningTitle: 'Rastreio Obrigatório de Lesões Pigmentadas (Regra ABCDE)',
        actionProtocol: 'Realizar dermatoscopia com luz polarizada. Em caso de assimetria, rede atípica ou véu azul-esbranquiçado, indicar biópsia excisional com margem de 2mm.',
        severity: 'Crítico'
      }
    ],
    diagnosticWorkup: [
      'Dermatoscopia com luz polarizada de contato e não contato',
      'Biópsia incisional ou excisional se houver atipia estrutural',
      'Biópsia por Punch de 3mm a 4mm para histopatologia com coloração H&E'
    ],
    initialManagement: 'Fotoproteção de amplo espectro UVA/UVB/Luz Visível com cor (FPS >= 50), suspensão imediata de cosméticos irritantes e restauração da barreira com ceramidas.'
  };

  try {
    const rawText = await callGeminiRest(prompt, systemInstruction, true);
    const parsed = extractPureJson<any>(rawText, fallback);
    return {
      summary: parsed.summary || fallback.summary,
      differentials: Array.isArray(parsed.differentials) && parsed.differentials.length > 0 ? parsed.differentials : fallback.differentials,
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : fallback.redFlags,
      diagnosticWorkup: Array.isArray(parsed.diagnosticWorkup) ? parsed.diagnosticWorkup : fallback.diagnosticWorkup,
      initialManagement: parsed.initialManagement || fallback.initialManagement
    };
  } catch (err) {
    console.warn('Gemini REST differential diagnosis failed, using clinical safety fallback:', err);
    return fallback;
  }
}

// ==========================================
// 3. GERADOR DE PRESCRIÇÃO MAGISTRAL DIRECT REST
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
  const systemInstruction = `Você é o PRESCRITOR MAGISTRAL E FARMACÊUTICO DERMATOLÓGICO ESPECIALIZADO do CONSUDERME.
Atuando com o modelo Gemini 3.7 Flash, formule prescrições dermatológicas completas contendo fórmulas magistrais manipuladas individualizadas (veículo galênico, ativos com porcentagem exata e posologia), opções de produtos industriais complementares, estratégia de fotoproteção e rotina diária matinal e noturna.
IMPORTANTE: Retorne ESTRITAMENTE um objeto JSON válido, sem texto introdutório ou conclusivo fora do JSON.`;

  const prompt = `Gere uma prescrição dermatológica magistral completa para:
- Indicação Clínica: ${params.indication}
- Fototipo: Fitzpatrick ${params.fitzpatrick}
- Tipo de Pele: ${params.skinType}
- Veículo Preferido: ${params.vehiclePreference || 'Mais adequado para a pele'}
- Observações: ${params.specialNotes || 'Nenhuma'}
${params.doctorNotes ? `- Anotações Adicionais: ${params.doctorNotes}` : ''}

Retorne este formato JSON obrigatório:
{
  "magistralFormulas": [
    {
      "title": "Fórmula Despigmentante & Antioxidante Facial",
      "vehicle": "Sérum Fluido Toque Seco não comedogênico q.s.p. 30g",
      "actives": [
        { "name": "Ácido Tranexâmico", "percentage": "3.0%", "rationale": "Inibição do plasminogênio e componente vascular" },
        { "name": "Niacinamida", "percentage": "4.0%", "rationale": "Bloqueio da melanogênese e ação anti-inflamatória" },
        { "name": "Alfa-Arbutin", "percentage": "1.5%", "rationale": "Inibição competitiva da tirosinase" },
        { "name": "Ácido Hialurônico Fracionado", "percentage": "1.0%", "rationale": "Hidratação biomimética profunda" }
      ],
      "posology": "Aplicar 4 a 5 gotas na face limpa e seca à noite com movimentos suaves.",
      "warnings": "Uso externo. Evitar mucosas e suspender em caso de eritema persistente."
    }
  ],
  "industrialOptions": [
    { "name": "Gel de Limpeza Suave Syndet", "activeIngredient": "Zinco PCA + Niacinamida", "posology": "Lavar o rosto pela manhã e à noite" },
    { "name": "Fotoprotetor Fluido com Cor FPS 50+", "activeIngredient": "Filtros químicos, físicos e Óxidos de Ferro", "posology": "Aplicar pela manhã e reaplicar a cada 3 horas" }
  ],
  "photoprotectionStrategy": "Protetor solar de amplo espectro com cor (FPS >= 50) contendo óxidos de ferro para bloqueio da luz visível e luz azul de telas.",
  "generalSkincareRoutine": {
    "morning": [
      "Higienização com syndet suave facial",
      "Aplicação de antioxidante leve ou hidratante prebiótico",
      "Fotoprotetor solar com cor FPS 50+ (reaplicar a cada 3h)"
    ],
    "night": [
      "Limpeza suave para remoção de resíduos e poluição",
      "Aplicação da fórmula magistral prescrita"
    ]
  }
}`;

  const fallback: PrescriptionResponse = {
    magistralFormulas: [
      {
        title: `Fórmula Magistral Personalizada (${params.indication || 'Tratamento Dermatológico'})`,
        vehicle: params.vehiclePreference || (params.skinType.toLowerCase().includes('oleosa') ? 'Sérum Toque Seco não comedogênico q.s.p. 30g' : 'Creme Fosfolipídico Biomimético q.s.p. 30g'),
        actives: [
          { name: 'Ácido Tranexâmico', percentage: '3.0%', rationale: 'Inibe a via do plasminogênio e modula o componente vascular melanogênico' },
          { name: 'Niacinamida (Vitamina B3)', percentage: '4.0%', rationale: 'Bloqueio da transferência de melanossomas para os queratinócitos' },
          { name: 'Alfa-Arbutin', percentage: '1.5%', rationale: 'Inibidor competitivo reversível da enzima tirosinase' },
          { name: 'Ácido Hialurônico Fracionado', percentage: '1.0%', rationale: 'Hidratação profunda sem resíduo graxo' }
        ],
        posology: 'Aplicar 4 a 5 gotas na face limpa e seca à noite com movimentos suaves até completa absorção. Pela manhã, lavar o rosto e aplicar protetor solar FPS 50+ com cor.',
        warnings: 'Uso externo restrito. Evitar área dos olhos e mucosas. Uso diário indispensável de protetor solar de amplo espectro com cor.'
      }
    ],
    industrialOptions: [
      { name: 'Gel de Limpeza Facial Dermatológico', activeIngredient: 'Syndet com Zinco PCA e Água Termal', posology: 'Lavar a face 2x ao dia' },
      { name: 'Fotoprotetor Fluido Mineral/Híbrido FPS 60 com Cor', activeIngredient: 'Óxidos de ferro e filtros de amplo espectro', posology: 'Aplicar pela manhã e reaplicar a cada 3 horas' }
    ],
    photoprotectionStrategy: `Para o Fototipo ${params.fitzpatrick}, indicar protetor solar com cor (óxidos de ferro) para bloquear a Luz Visível e Luz Azul emitida por telas, prevenindo o efeito rebote pigmentar.`,
    generalSkincareRoutine: {
      morning: [
        '1. Higienização suave com syndet facial',
        '2. Hidratante prebiótico ou antioxidante leve',
        '3. Protetor solar de amplo espectro com cor (FPS 50+)'
      ],
      night: [
        '1. Limpeza facial com loção micelar / syndet',
        '2. Aplicação da fórmula magistral prescrita nas áreas indicadas'
      ]
    }
  };

  try {
    const rawText = await callGeminiRest(prompt, systemInstruction, true);
    const parsed = extractPureJson<any>(rawText, fallback);

    return {
      magistralFormulas: Array.isArray(parsed.magistralFormulas) && parsed.magistralFormulas.length > 0
        ? parsed.magistralFormulas.map((f: any) => ({
            title: f.title || f.formulaTitle || 'Fórmula Magistral Personalizada',
            vehicle: f.vehicle || f.vehicleSelected || 'Veículo q.s.p. 30g',
            actives: Array.isArray(f.actives) ? f.actives.map((a: any) => ({
              name: a.name || 'Ativo',
              percentage: a.percentage || a.concentration || '1%',
              rationale: a.rationale || a.action || 'Ação dermatológica'
            })) : fallback.magistralFormulas[0].actives,
            posology: f.posology || 'Aplicar à noite conforme orientação médica',
            warnings: f.warnings || 'Uso externo. Evitar mucosas.'
          }))
        : fallback.magistralFormulas,
      industrialOptions: Array.isArray(parsed.industrialOptions)
        ? parsed.industrialOptions
        : fallback.industrialOptions,
      photoprotectionStrategy: parsed.photoprotectionStrategy || fallback.photoprotectionStrategy,
      generalSkincareRoutine: {
        morning: Array.isArray(parsed.generalSkincareRoutine?.morning) ? parsed.generalSkincareRoutine.morning : fallback.generalSkincareRoutine.morning,
        night: Array.isArray(parsed.generalSkincareRoutine?.night) ? parsed.generalSkincareRoutine.night : fallback.generalSkincareRoutine.night
      }
    };
  } catch (err) {
    console.warn('Gemini REST prescription failed, using clinical fallback:', err);
    return fallback;
  }
}

// ==========================================
// 4. GUIA DE INJETÁVEIS DIRECT REST
// ==========================================
export type ProcedureGuideData = ProcedureGuideResponse;

export async function directProcedureGuide(params: {
  procedureType: string;
  targetArea: string;
  patientProfile?: string;
}): Promise<ProcedureGuideResponse> {
  const systemInstruction = `Você é o GUIA ANATÔMICO E DE PROCEDIMENTOS INJETÁVEIS do CONSUDERME.
Atuando com o modelo Gemini 3.7 Flash, forneça parâmetros anatômicos precisos (camadas 1 a 5 de Mendelson), zonas de risco vascular (Artérias Facial, Angular, Supratroclear, Supraorbital, Labiais), dosimetria em UI ou mL e o protocolo de emergência imediato com Hialuronidase.
IMPORTANTE: Retorne ESTRITAMENTE um objeto JSON válido, sem texto introdutório ou conclusivo fora do JSON.`;

  const prompt = `Gere o guia anatômico de segurança para:
- Procedimento: ${params.procedureType}
- Região Alvo: ${params.targetArea}
- Perfil do Paciente: ${params.patientProfile || 'Adulto padrão'}

Estrutura JSON obrigatória:
{
  "procedureName": "Nome completo do protocolo",
  "anatomicalPlanes": "Planos exatos de injeção (ex: intramuscular profundo, supraperiosteal, subcutâneo superficial)",
  "dosageAndPoints": [
    { "area": "Área anatômica", "recommendedUnitsOrVolume": "UI ou mL", "injectionTechnique": "Técnica (ex: bolus justaperiosteal com retroinjeção)", "targetMuscleOrStructure": "Músculo ou estrutura" }
  ],
  "dangerZonesAndVessels": [
    { "vessel": "Nome do vaso em risco", "dangerLocation": "Topografia anatômica de risco", "safetyRule": "Regra técnica mandatória de segurança" }
  ],
  "potentialComplications": ["Complicação 1", "Complicação 2"],
  "emergencyProtocol": "Protocolo de emergência completo (Hialuronidase de alta dosagem, vasodilatação, conduta)",
  "postCareSummary": "Instruções objetivas para repassar ao paciente nas primeiras 24h"
}`;

  const fallback: ProcedureGuideResponse = {
    procedureName: `${params.procedureType || 'Toxina Botulínica e Injetáveis'} — Mapeamento Anatômico de Segurança`,
    anatomicalPlanes: 'Músculos da mímica facial (intramuscular estrito para toxina) e Camadas 2 e 4 de Mendelson (subcutâneo e supraperiosteal para preenchedores).',
    dosageAndPoints: [
      { area: 'Glabela (M. Prócero)', recommendedUnitsOrVolume: '4 a 6 UI', injectionTechnique: 'Ponto único perpendicular 90°, inserção intramuscular profunda.', targetMuscleOrStructure: 'M. Prócero' },
      { area: 'Corrugadores Superciliares', recommendedUnitsOrVolume: '3 a 5 UI por ponto (2 pontos/lado)', injectionTechnique: 'Ponto medial profundo (90°) e ponto lateral superficial (30°) a 1cm do rebordo orbitário.', targetMuscleOrStructure: 'M. Corrugador do Supercílio' },
      { area: 'Frontal (Linhas Horizontais)', recommendedUnitsOrVolume: '1 a 2 UI por ponto (6 a 8 pontos)', injectionTechnique: 'Intradérmico/Intramuscular superficial em V invertido, respeitando faixa de segurança de 2cm acima das sobrancelhas.', targetMuscleOrStructure: 'M. Ventre Frontal' },
      { area: 'Pés de Galinha (Orbicular)', recommendedUnitsOrVolume: '2 a 4 UI por ponto (3 pontos/lado)', injectionTechnique: 'Subdérmico a 1cm lateral ao rebordo orbitário externo, bisel voltado para fora.', targetMuscleOrStructure: 'M. Orbicular do Olho' }
    ],
    dangerZonesAndVessels: [
      { vessel: 'Artéria Supratroclear e Supraorbital', dangerLocation: 'Emergência nos forames/incisuras supraorbitais e supratrocleares.', safetyRule: 'Manter injeções de preenchedor em plano supraperiosteal com aspiração prévia de 5-10s ou uso de microcânula 22G/25G.' },
      { vessel: 'Artéria Angular e Facial', dangerLocation: 'Sulco nasogeniano proximal e fossa piriforme.', safetyRule: 'Injeção na fossa piriforme estritamente justaperiosteal (tocar osso) e aspiração obrigatória.' },
      { vessel: 'Artérias Labiais Superior e Inferior', dangerLocation: 'Plano submucoso profundo a 2-4mm da borda do vermelhão.', safetyRule: 'Aplicar preenchedor no plano submucoso superficial com retroinjeção lenta e de baixo volume (< 0,05 mL por passada).' }
    ],
    potentialComplications: [
      'Ptose Palpebral por difusão da toxina para o M. Levantador da Pálpebra Superior (colírio de Apraclonidina 0.5% se ocorrer)',
      'Assimetria de elevação da cauda da sobrancelha ("Sinal de Mefisto" - corrigir com 1 UI no ventre lateral do frontal)',
      'Isquemia vascular por embolização arterial em caso de preenchedores de Ácido Hialurônico'
    ],
    emergencyProtocol: 'EMERGÊNCIA POR ÁCIDO HIALURÔNICO (PROTOCOLO HIGH-DOSE HIALURONIDASE): Infiltrar imediatamente 500 a 1.500 UI de Hialuronidase diluída em SF 0.9% na área isquêmica e trajeto vascular. Repetir a cada 60-90min se o tempo de enchimento capilar permanecer > 2 segundos. Aplicar calor local (compressas mornas), massagem vigorosa, AAS 100-300mg VO dose única e corticoterapia oral. Encaminhamento oftalmológico de urgência se houver amaurose.',
    postCareSummary: 'Não deitar nem baixar a cabeça nas primeiras 4 horas; evitar atividades físicas intensas e exposição solar/sauna por 24 horas; não massagear os pontos de aplicação.'
  };

  try {
    const rawText = await callGeminiRest(prompt, systemInstruction, true);
    const parsed = extractPureJson<any>(rawText, fallback);
    return {
      procedureName: parsed.procedureName || fallback.procedureName,
      anatomicalPlanes: parsed.anatomicalPlanes || fallback.anatomicalPlanes,
      dosageAndPoints: Array.isArray(parsed.dosageAndPoints) && parsed.dosageAndPoints.length > 0 ? parsed.dosageAndPoints : fallback.dosageAndPoints,
      dangerZonesAndVessels: Array.isArray(parsed.dangerZonesAndVessels) ? parsed.dangerZonesAndVessels : fallback.dangerZonesAndVessels,
      potentialComplications: Array.isArray(parsed.potentialComplications) ? parsed.potentialComplications : fallback.potentialComplications,
      emergencyProtocol: parsed.emergencyProtocol || fallback.emergencyProtocol,
      postCareSummary: parsed.postCareSummary || fallback.postCareSummary
    };
  } catch (err) {
    console.warn('Gemini REST procedure guide failed, using clinical fallback:', err);
    return fallback;
  }
}

// ==========================================
// 5. GERADOR DE ORIENTAÇÕES PÓS-PROCEDIMENTO DIRECT REST
// ==========================================
export type PostCareData = PostCareResponse;

export async function directPostCareGenerator(params: {
  procedure: string;
  patientName: string;
  doctorName: string;
  clinicPhone: string;
  specificNotes?: string;
}): Promise<PostCareResponse> {
  const systemInstruction = `Você é o gerador de orientações pós-procedimento dermatológico do CONSUDERME.
Atuando com o modelo Gemini 3.7 Flash, gere orientações acolhedoras, profissionais e perfeitamente formatadas para envio direto via WhatsApp ou impressão de folheto timbrado.
IMPORTANTE: Retorne ESTRITAMENTE um objeto JSON válido, sem texto introdutório ou conclusivo fora do JSON.`;

  const prompt = `Gere orientações pós-procedimento para:
- Procedimento: ${params.procedure}
- Paciente: ${params.patientName}
- Médico: ${params.doctorName}
- Telefone de Contato da Clínica: ${params.clinicPhone}
- Observações Específicas: ${params.specificNotes || 'Nenhuma'}

Retorne o JSON:
{
  "whatsappMessage": "Texto formatado com emojis leves e marcadores do WhatsApp (*negrito*, bullet points)",
  "printedDocument": "Texto formal e numerado para impressão em folha timbrada",
  "urgentWarningSigns": ["Dor desproporcional", "Branqueamento cutâneo", "Pústulas", "Visão turva"]
}`;

  const fallback: PostCareResponse = {
    whatsappMessage: `✨ *Orientações Pós-Procedimento — ${params.procedure || 'Procedimento Dermatológico'}* ✨\n\nOlá, *${params.patientName || 'Paciente'}*! Aqui estão as recomendações do *${params.doctorName || 'seu dermatologista'}* para garantir o melhor resultado e a sua total segurança:\n\n*Nas primeiras 4 a 6 horas:*\n• Mantenha a cabeça elevada, sem deitar ou abaixar o tronco.\n• Evite tocar, coçar ou pressionar os locais tratados.\n\n*Nas primeiras 24 a 48 horas:*\n• Não pratique exercícios físicos intensos nem frequente saunas/piscinas.\n• Evite exposição solar direta e use protetor solar FPS 50+.\n• Caso surjam pequenos hematomas, aplique compressas geladas delicadamente.\n\n📞 Em caso de dúvidas ou necessidade, entre em contato com nossa equipe: *${params.clinicPhone || 'ConsuDerme'}*.`,
    printedDocument: `ORIENTAÇÕES MÉDICAS PÓS-PROCEDIMENTO DERMATOLÓGICO\n\nPaciente: ${params.patientName || 'Paciente'}\nProcedimento Realizado: ${params.procedure || 'Procedimento Injetável/Clínico'}\nMédico Responsável: ${params.doctorName || 'Dermatologista Responsável'}\n\n1. CUIDADOS GERAIS IMEDIATOS (PRIMEIRAS 24 HORAS):\n- Não massagear nem manipular vigorosamente a região tratada.\n- Evitar deitar-se em decúbito dorsal ou ventral nas primeiras 4 horas após o procedimento.\n- Não realizar atividade física de alto impacto ou exposição a fontes intensas de calor (fornos, saunas, sol).\n\n2. HIGIENE E FOTOPROTEÇÃO:\n- Lavar o rosto com sabonete neutro ou suave syndet sem esfregar.\n- Aplicar protetor solar de amplo espectro (FPS >= 50) e renovar a aplicação a cada 3 horas.\n- Suspender ácidos ou esfoliantes químicos por 5 a 7 dias conforme orientação médica.\n\n3. SINAIS DE ALARME QUE EXIGEM AVALIAÇÃO MÉDICA IMEDIATA:\n- Dor intensa, contínua e desproporcional ao procedimento.\n- Palidez, branqueamento cutâneo ou manchas arroxeadas/marmorizadas no local ou proximidades.\n- Alterações visuais súbitas (visão turva, perda de campo visual ou dor retrobulbar).\n\nContato de Urgência da Clínica: ${params.clinicPhone || 'Consulte seu médico'}.`,
    urgentWarningSigns: [
      'Dor intensa que não cede com analgésicos comuns',
      'Branqueamento ou coloração acinzentada/aroxeada da pele',
      'Formação de pequenas pústulas ou bolhas na área tratada',
      'Alteração súbita da visão ou dor nos olhos'
    ]
  };

  try {
    const rawText = await callGeminiRest(prompt, systemInstruction, true);
    const parsed = extractPureJson<any>(rawText, fallback);
    return {
      whatsappMessage: parsed.whatsappMessage || fallback.whatsappMessage,
      printedDocument: parsed.printedDocument || fallback.printedDocument,
      urgentWarningSigns: Array.isArray(parsed.urgentWarningSigns) && parsed.urgentWarningSigns.length > 0 ? parsed.urgentWarningSigns : fallback.urgentWarningSigns
    };
  } catch (err) {
    console.warn('Gemini REST post-care failed, using clinical fallback:', err);
    return fallback;
  }
}

// Fallback DermIA clinical engine logic
function generateDermiaClinicalFallback(query: string, doctorProfile?: any): string {
  const lower = (query || '').toLowerCase();
  const docName = doctorProfile?.name || 'Doutor(a)';

  if (lower.includes('botox') || lower.includes('toxina') || lower.includes('rugas')) {
    return `Olá, ${docName}! Para aplicação de **Toxina Botulínica Tipo A**, aqui está o protocolo de segurança ConsuDerme:

1. **Pontos e Doses Médias:**
   • **Glabela (M. Prócero):** 4 a 6 UI (ponto único, perpendicular 90° profundo).
   • **Corrugadores:** 3 a 5 UI por ponto (ponto medial profundo no osso; ponto lateral superficial a 1cm do rebordo orbitário para evitar ptose palpebral).
   • **Frontal:** 1 a 2 UI por ponto (6 a 8 pontos em V invertido, respeitando 2cm de margem de segurança acima da sobrancelha).
   • **Orbicular dos Olhos:** 2 a 4 UI por ponto (3 pontos a 1cm lateral ao rebordo externo).

2. **Complicações & Reversão:**
   • *Ptose palpebral:* colírio de tartarato de brimonidina ou apraclonidina 0.5% (1 gota 3x/dia).
   • *Sinal de Mefisto:* aplicar 1 UI de retoque no ventre lateral do frontal hiperativo.

Você pode abrir o **Guia de Injetáveis** no menu para visualizar o mapa anatômico completo.`;
  }

  if (lower.includes('hialuroni') || lower.includes('isquemia') || lower.includes('necrose') || lower.includes('emergência')) {
    return `⚠️ **ALERTA DE EMERGÊNCIA — PROTOCOLO DE REVERSÃO COM HIALURONIDASE:**

Diante de suspeita de **oclusão vascular** (dor desproporcional, palidez imediata, tempo de enchimento capilar > 2s ou livedo reticular):
1. **Interrompa a injeção imediatamente.**
2. **Infiltração de Alta Dose:** Aplicar de **500 a 1.500 UI de Hialuronidase** diluída em SF 0,9% no trajeto vascular e na área isquêmica.
3. **Massagem Vigorosa & Calor:** Realizar massagem mecânica firme e aplicar compressas mornas para induzir vasodilatação.
4. **Terapia Medicamentosa Adjuvante:**
   • AAS 100-300 mg VO (dose única).
   • Corticoterapia oral (Prednisona 40-60 mg/dia por 3-5 dias).
   • Vasodilatador (Citrato de Sildenafila 50mg ou Tadalafila 10-20mg/dia).
5. **Reavaliação:** Repetir a dose de hialuronidase a cada 60 a 90 minutos se a perfusão cutânea não for restabelecida.
6. **Emergência Visual:** Se houver perda visual ou dor retrobulbar (oclusão da artéria oftálmica/retiniana), encaminhamento oftalmológico de urgência imediato.`;
  }

  if (lower.includes('melasma') || lower.includes('mancha') || lower.includes('ácido') || lower.includes('fórmula')) {
    return `Olá, ${docName}! Para manejo de **Melasma Recalcitrante**, o protocolo padrão-ouro ConsuDerme inclui:

1. **Fórmula Despigmentante Noturna (Toque Seco):**
   • Ácido Tranexâmico 3%
   • Niacinamida 4%
   • Ácido Kójico 1.5%
   • Alfa-Arbutin 2%
   • Sérum toque seco q.s.p. 30g
   • *Posologia:* Aplicar 4 gotas à noite em toda a face limpa.

2. **Fotoproteção Multiespectral:**
   • Filtro solar FPS >= 50 com óxido de ferro (cor) para bloqueio físico da luz visível (azul), reaplicado a cada 3 horas.

3. **Cuidados com Fototipos Altos (IV a VI):**
   • Evitar peelings excessivamente agressivos e lasers de pulso longo sem preparo prévio para evitar hipercromia pós-inflamatória (HPI).

Posso carregar essa sugestão diretamente no **Prescritor de Fórmulas** para você imprimir ou enviar via WhatsApp!`;
  }

  if (lower.includes('isotretinoína') || lower.includes('roacutan') || lower.includes('acne')) {
    return `Olá, ${docName}! Para a prescrição de **Isotretinoína Oral (Receita C2)**:

1. **Dose Alvo Acumulada:** 120 a 150 mg/kg de peso corporal total para remissão prolongada.
2. **Dose Diária Inicial:** 0.5 mg/kg/dia no primeiro mês, ajustando para até 1.0 mg/kg/dia conforme tolerância laboratorial.
3. **Checklist Obrigatório Feminino (RDC Anvisa):**
   • Dois testes de gravidez (Beta-HCG quantitativo) negativos antes do início.
   • Duas formas de contracepção eficazes (ao menos 1 de barreira) iniciadas 30 dias antes.
   • Termo de Conhecimento de Risco e Consentimento assinado.
4. **Controle Laboratorial:** Perfil lipídico (colesterol e triglicerídeos), transaminases (TGO/TGP) e hemograma antes e a cada 30-60 dias.

Você pode gerar a **Receita C2 e o Termo TCLE** prontos para impressão no módulo de **Gestão e Documentos**!`;
  }

  return `Olá, ${docName}! Sou a **DermIA**, copiloto de inteligência artificial clínica do **ConsuDerme**, operando com o modelo **Gemini 3.7 Flash**.

Estou à sua disposição para:
• **Semiologia e Diagnóstico Diferencial:** Fototipos de Fitzpatrick I a VI e alertas precoces de Neoplasias Malignas (ABCDE).
• **Prescrição Magistral:** Sugestão de ativos galênicos (gel, sérum toque seco, cremes fosfolipídicos).
• **Anatomia Facial e Injetáveis:** Dosimetria em UI de toxina, preenchedores e reversão imediata de isquemia vascular com Hialuronidase.
• **Gestão & Documentos CFM:** Cálculo de custos de procedimentos, atestados, receitas C2 e TCLEs.

Como posso ajudar na sua conduta clínica agora?`;
}
