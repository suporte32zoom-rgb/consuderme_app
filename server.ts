import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const GEMINI_MODEL = 'gemini-4-hydrogen';

// Lazy initializer for Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

class UpstreamAIError extends Error {
  status: number;
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'UpstreamAIError';
    this.status = status;
  }
}

async function withExponentialBackoff<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastErr: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const status = err?.status || err?.code || 0;
      const isRetryable = status === 429 || status === 503 || String(err?.message || '').includes('RESOURCE_EXHAUSTED');
      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }
      const delayMs = 400 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastErr;
}

// Helper to extract JSON cleanly even if wrapped in markdown blocks
function extractJsonFromText(rawText: string): any {
  if (!rawText) return null;
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch (e) {
        // fallback
      }
    }
    return null;
  }
}

// Multi-Provider AI Calling Engine (Google Gemini Server-Side, Groq Llama 3.3 70B, OpenRouter)
interface AIExecutionOptions {
  systemInstruction: string;
  prompt: string;
  isJson?: boolean;
  jsonSchema?: any;
  preferredProvider?: 'auto' | 'gemini' | 'groq' | 'deepseek' | 'openrouter' | 'clinical_engine';
}

interface AIExecutionResult {
  text: string;
  jsonData?: any;
  providerUsed: string;
  model: string;
  isFreeTier: boolean;
}

async function executeMultiProviderAI(options: AIExecutionOptions): Promise<AIExecutionResult> {
  const { systemInstruction, prompt, isJson, jsonSchema, preferredProvider = 'auto' } = options;

  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  let lastErrorMessage = '';
  let lastErrorStatus = 500;

  // 1. Try Groq (Llama 3.3 70B or DeepSeek R1) if explicitly requested or if Gemini is absent
  if (groqKey && (preferredProvider === 'groq' || preferredProvider === 'deepseek' || (preferredProvider === 'auto' && !geminiKey))) {
    try {
      const model = preferredProvider === 'deepseek' ? 'deepseek-r1-distill-llama-70b' : 'llama-3.3-70b-versatile';
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemInstruction + (isJson ? '\nATENÇÃO: Responda ESTRITAMENTE em formato JSON válido, sem comentários adicionais.' : '') },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          ...(isJson ? { response_format: { type: 'json_object' } } : {})
        })
      });

      if (groqResponse.ok) {
        const data = await groqResponse.json();
        const outputText = data.choices?.[0]?.message?.content || '';
        if (outputText.trim().length > 0) {
          const parsed = isJson ? extractJsonFromText(outputText) : null;
          return {
            text: outputText,
            jsonData: parsed,
            providerUsed: `Groq Cloud (${model})`,
            model: model,
            isFreeTier: true
          };
        }
      } else {
        lastErrorStatus = groqResponse.status;
        lastErrorMessage = await groqResponse.text();
        console.warn(`Groq request returned status ${groqResponse.status}: ${lastErrorMessage}`);
      }
    } catch (groqErr: any) {
      lastErrorMessage = groqErr?.message || String(groqErr);
      console.warn('Groq API attempt failed, cascading to next provider:', lastErrorMessage);
    }
  }

  // 2. Try Google Gemini (Server-side @google/genai SDK with gemini-4-hydrogen)
  if (geminiKey && (preferredProvider === 'gemini' || preferredProvider === 'auto' || !groqKey)) {
    try {
      const ai = getGeminiAI();
      if (ai) {
        const config: any = {
          systemInstruction,
        };
        if (isJson) {
          config.responseMimeType = 'application/json';
          if (jsonSchema) {
            config.responseSchema = jsonSchema;
          }
        }

        const response = await withExponentialBackoff(() =>
          ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config
          })
        );

        const outputText = response.text || '';
        if (outputText.trim().length > 0) {
          const parsed = isJson ? extractJsonFromText(outputText) : null;
          return {
            text: outputText,
            jsonData: parsed,
            providerUsed: 'Google Gemini (Servidor)',
            model: GEMINI_MODEL,
            isFreeTier: true
          };
        }
      }
    } catch (geminiErr: any) {
      lastErrorStatus = typeof geminiErr?.status === 'number' ? geminiErr.status : 502;
      lastErrorMessage = geminiErr?.message || String(geminiErr);
      console.warn('Gemini API attempt failed:', lastErrorMessage);
    }
  }

  // 3. Try OpenRouter (Free tier models) if key exists
  if (openRouterKey && (preferredProvider === 'openrouter' || preferredProvider === 'auto')) {
    try {
      const openRouterModel = 'meta-llama/llama-3.3-70b-instruct:free';
      const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://www.consuderme.com.br',
          'X-Title': 'ConsuDerme Medical Assistant'
        },
        body: JSON.stringify({
          model: openRouterModel,
          messages: [
            { role: 'system', content: systemInstruction + (isJson ? '\nRetorne estritamente em JSON puro.' : '') },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2
        })
      });

      if (orResponse.ok) {
        const data = await orResponse.json();
        const outputText = data.choices?.[0]?.message?.content || '';
        if (outputText.trim().length > 0) {
          const parsed = isJson ? extractJsonFromText(outputText) : null;
          return {
            text: outputText,
            jsonData: parsed,
            providerUsed: 'OpenRouter (Llama 3.3 70B Free)',
            model: openRouterModel,
            isFreeTier: true
          };
        }
      } else {
        lastErrorStatus = orResponse.status;
        lastErrorMessage = await orResponse.text();
      }
    } catch (orErr: any) {
      lastErrorMessage = orErr?.message || String(orErr);
      console.warn('OpenRouter attempt failed:', lastErrorMessage);
    }
  }

  if (!geminiKey && !groqKey && !openRouterKey) {
    throw new UpstreamAIError(
      'Chave da API Gemini não configurada no servidor. Verifique GEMINI_API_KEY em Settings > Secrets.',
      503
    );
  }

  throw new UpstreamAIError(
    lastErrorMessage || 'Falha ao obter resposta do provedor de IA no servidor.',
    lastErrorStatus >= 400 ? lastErrorStatus : 502
  );
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Consuderme Medical Server', timestamp: new Date().toISOString() });
});

// Providers Status & Free Tier Detection
app.get('/api/copilot/providers', (req, res) => {
  const geminiAvailable = !!process.env.GEMINI_API_KEY;
  const groqAvailable = !!process.env.GROQ_API_KEY;
  const openRouterAvailable = !!process.env.OPENROUTER_API_KEY;

  let activeEngine = 'Motor Clínico ConsuDerme (Segurança Local CFM/SBD)';
  if (groqAvailable && geminiAvailable) {
    activeEngine = 'Híbrido Inteligente (Gemini 4 Flash + Groq Llama 3.3 70B)';
  } else if (groqAvailable) {
    activeEngine = 'Groq Cloud (Llama 3.3 70B - Gratuito)';
  } else if (geminiAvailable) {
    activeEngine = 'Google Gemini 4 Flash (Servidor)';
  } else if (openRouterAvailable) {
    activeEngine = 'OpenRouter (Llama 3.3 70B Free)';
  }

  res.json({
    activeEngine,
    providers: [
      {
        id: 'gemini',
        name: 'Google Gemini 4 Flash (Servidor)',
        model: GEMINI_MODEL,
        isFreeTier: true,
        quota: 'Integrado via servidor seguro',
        isConfigured: geminiAvailable,
        setupUrl: 'https://aistudio.google.com'
      },
      {
        id: 'groq',
        name: 'Groq Cloud (Llama 3.3 70B Versatile)',
        isFreeTier: true,
        quota: 'Alta velocidade gratuita (LPU)',
        isConfigured: groqAvailable,
        setupUrl: 'https://console.groq.com'
      },
      {
        id: 'deepseek',
        name: 'Groq Cloud (DeepSeek R1 Distill 70B)',
        isFreeTier: true,
        quota: 'Raciocínio clínico aprofundado gratuito',
        isConfigured: groqAvailable,
        setupUrl: 'https://console.groq.com'
      },
      {
        id: 'openrouter',
        name: 'OpenRouter (Llama 3.3 & DeepSeek :free)',
        isFreeTier: true,
        quota: 'Modelos comunitários gratuitos',
        isConfigured: openRouterAvailable,
        setupUrl: 'https://openrouter.ai'
      },
      {
        id: 'local',
        name: 'Motor Clínico Integrado ConsuDerme',
        isFreeTier: true,
        quota: 'Ilimitado (Offline & Local)',
        isConfigured: true,
        setupUrl: ''
      }
    ]
  });
});

// COPILOTO: Diagnóstico Diferencial & Alerta de Neoplasias
app.post('/api/copilot/differential-diagnosis', async (req, res) => {
  const { fitzpatrick, complaint, evolutionTime, topography, symptoms, previousTreatments, comorbidities, allergies, photoDesc, preferredProvider } = req.body;
  
  const fallbackData = {
    summary: `Quadro dermatológico caracterizado por ${complaint || 'lesões cutâneas'} em ${topography || 'face/corpo'}, com tempo de evolução de ${evolutionTime || 'recente'} em paciente Fototipo ${fitzpatrick || 'III'}.`,
    differentials: [
      {
        disease: (complaint || '').toLowerCase().includes('mancha') || (complaint || '').toLowerCase().includes('melasma') ? 'Melasma Misto / Facial (CID-10: L81.1)' : 'Dermatite Seborreica / Eczema (CID-10: L21.0)',
        probability: 'Alta',
        clinicalRationale: 'Compatibilidade com topografia típica, padrão evolutivo e características semiológicas informadas na anamnese.',
        semiologyFeatures: 'Máculas hiperpigmentadas acastanhadas em áreas fotoexpostas com eritema subjacente.'
      },
      {
        disease: 'Hipercromia Pós-Inflamatória (CID-10: L81.0)',
        probability: 'Média',
        clinicalRationale: 'Frequente em fototipos intermediários a altos após processo inflamatório ou manipulação prévia.',
        semiologyFeatures: 'Pigmentação localizada respeitando o sítio de agressão cutânea prévia.'
      },
      {
        disease: 'Lentigo Solar / Ceratose Seborreica Inicial (CID-10: L82)',
        probability: 'Investigar',
        clinicalRationale: 'Necessidade de confirmação dermatoscópica para exclusão de lesões melanocíticas atípicas.',
        semiologyFeatures: 'Máculas bem delimitadas em áreas de dano solar crônico.'
      }
    ],
    redFlags: [
      {
        warningTitle: 'Rastreio de Lesão Melanocítica / Melanoma',
        severity: 'Atenção',
        actionProtocol: 'Realizar Dermatoscopia Digital com avaliação dos critérios ABCDE e exclusão do sinal do Patinho Feio.'
      }
    ],
    diagnosticWorkup: [
      'Dermatoscopia Digital com luz polarizada',
      'Lâmpada de Wood para mapeamento da profundidade do pigmento (dérmico vs epidérmico)',
      'Biópsia por punch se houver assimetria estrutural ou dúvida diagnóstica'
    ],
    initialManagement: 'Prescrição de fotoproteção física/química de amplo espectro com cor (óxido de ferro), recuperação da barreira cutânea com hidratante fisiológico e introdução gradual de ativos despigmentantes.'
  };

  try {
    const systemInstruction = `Você é o COPILOTO CLÍNICO DERMATOLÓGICO do CONSUDERME, especializado em dermatologia clínica, dermatoscopia e oncologia cutânea conforme diretrizes da Sociedade Brasileira de Dermatologia (SBD) e Conselho Federal de Medicina (CFM).
Sua função é fornecer análise clínica de suporte à decisão médica, de alto rigor técnico, organizada por probabilidade diagnóstica, identificando imediatamente sinais de alarme e neoplasias (Melanoma, Carcinoma Basocelular - CBC, Carcinoma Espinocelular - CEC, Farmacodermias graves como DRESS/NET, etc.).
O médico assistente detém 100% da responsabilidade pelo diagnóstico e conduta.`;

    const normalizedSymptoms = Array.isArray(symptoms) ? symptoms.join(', ') : (symptoms || 'Não informado');

    const prompt = `Analise os dados clínicos dermatológicos do paciente:
- Fototipo de Fitzpatrick: ${fitzpatrick || 'Não informado'}
- Queixa Principal e História da Moléstia Atual (HMA): ${complaint || 'Não informado'}
- Tempo de Evolução: ${evolutionTime || 'Não informado'}
- Topografia / Localização das Lesões: ${topography || 'Não informado'}
- Sintomas Associados (Prurido, Dor, Sangramento, Descamação, etc.): ${normalizedSymptoms}
- Tratamentos Prévios: ${previousTreatments || 'Nenhum'}
- Comorbidades / Histórico Pessoal e Familiar: ${comorbidities || 'Nenhum relatado'}
- Alergias Conhecidas: ${allergies || 'Nega'}
${photoDesc ? `- Descrição Semiológica / Dermatoscópica da Lesão: ${photoDesc}` : ''}

Retorne estritamente em formato JSON estruturado com:
1. "summary": Resumo semiológico conciso da apresentação clínica.
2. "differentials": Lista de diagnósticos diferenciais ordenados por probabilidade decrescente, cada um com "disease" (Nome da patologia com CID-10 sugerido), "probability" ('Alta' | 'Média' | 'Baixa' | 'Investigar'), "clinicalRationale" (Por que pensar nessa hipótese), "semiologyFeatures" (Achados clínicos cardinais).
3. "redFlags": Lista de alertas de urgência / neoplasia ("Melanoma", "CBC", "CEC", "Urgência infecciosa/imunológica"), com "warningTitle", "severity" ('Crítico' | 'Moderado' | 'Atenção') e "actionProtocol" (Conduta imediata recomendada, ex: biópsia excisional com margem de 2mm, dermatoscopia digital).
4. "diagnosticWorkup": Lista de exames complementares sugeridos (ex: Dermatoscopia, Biópsia por Punch/Shave, Micológico Direto + Cultura, Imunofluorescência, Patch Test, etc.).
5. "initialManagement": Sugestão de linha terapêutica inicial e orientações gerais de cuidado da barreira cutânea.`;

    const jsonSchema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        differentials: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              disease: { type: Type.STRING },
              probability: { type: Type.STRING },
              clinicalRationale: { type: Type.STRING },
              semiologyFeatures: { type: Type.STRING },
            },
            required: ['disease', 'probability', 'clinicalRationale'],
          },
        },
        redFlags: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              warningTitle: { type: Type.STRING },
              severity: { type: Type.STRING },
              actionProtocol: { type: Type.STRING },
            },
            required: ['warningTitle', 'severity', 'actionProtocol'],
          },
        },
        diagnosticWorkup: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        initialManagement: { type: Type.STRING },
      },
      required: ['summary', 'differentials', 'redFlags', 'diagnosticWorkup', 'initialManagement'],
    };

    const aiResult = await executeMultiProviderAI({
      systemInstruction,
      prompt,
      isJson: true,
      jsonSchema,
      preferredProvider
    });

    if (aiResult?.jsonData) {
      return res.json({
        success: true,
        data: aiResult.jsonData,
        providerUsed: aiResult.providerUsed,
        model: aiResult.model
      });
    }

    return res.status(502).json({
      success: false,
      error: 'O modelo retornou uma estrutura inválida para diagnóstico diferencial.'
    });
  } catch (error: any) {
    const status = error instanceof UpstreamAIError ? error.status : 500;
    console.error('Differential diagnosis error:', error?.message || error);
    return res.status(status).json({
      success: false,
      error: error?.message || 'Erro ao processar diagnóstico diferencial no servidor.'
    });
  }
});

// COPILOTO: Gerador de Prescrições & Fórmulas Magistrais
app.post('/api/copilot/prescription-generator', async (req, res) => {
  const { indication, fitzpatrick, skinType, vehiclePreference, specialNotes, doctorNotes, preferredProvider } = req.body;
  
  const fallbackPrescription = {
    magistralFormulas: [
      {
        title: `Fórmula Magistral Personalizada (${indication || 'Conduta Dermatológica Especializada'})`,
        vehicle: `${vehiclePreference || 'Sérum Fluido Toque Seco Fosfolipídico'} q.s.p. 30g (pH 5.5)`,
        actives: [
          { name: 'Ácido Tranexâmico', percentage: '3.0%', rationale: 'Inibe a angiogênese dérmica e a liberação de mediadores inflamatórios pelos queratinócitos.' },
          { name: 'Niacinamida (Vitamina B3)', percentage: '4.0%', rationale: 'Bloqueia a transferência de melanossomos para os queratinócitos e fortalece a barreira cutânea.' },
          { name: 'Alfa-Arbutin', percentage: '2.5%', rationale: 'Inibidor competitivo reversível da tirosinase com excelente tolerabilidade.' },
          { name: 'Ácido Kójico Dipalmitato', percentage: '2.0%', rationale: 'Quelante de íons cobre essencial para inibição da síntese de melanina.' }
        ],
        posology: 'Aplicar 4 a 5 gotas na face limpa e seca à noite, massageando suavemente até completa absorção. Iniciar em noites alternadas na 1ª semana.',
        warnings: 'Uso externo. Suspender em caso de eritema intenso ou ardência. Obrigatório o uso diário de protetor solar com cor.'
      }
    ],
    industrialOptions: [
      { name: 'Discoloration Defense (Skinceuticals)', activeIngredient: 'Ácido Tranexâmico 3% + Niacinamida 5% + HEPES 5%', posology: 'Aplicar 3 a 5 gotas pela manhã e à noite antes do hidratante.' },
      { name: 'Pigmentbio C-Concentrate (Bioderma)', activeIngredient: 'Vitamina C fresca 1.7% + Ácido Glicólico 8% + Ácido Salicílico 2%', posology: 'Aplicar 5 gotas à noite em monoterapia por 1 mês.' }
    ],
    photoprotectionStrategy: 'Protetor solar fluido com FPS ≥ 50 e PPD ≥ 16 com cor (contendo óxido de ferro) para bloquear radiação UVA, UVB e luz visível de alta energia (HEV). Reaplicar a cada 3 horas.',
    generalSkincareRoutine: {
      morning: [
        'Higienização suave com gel syndet sem sulfatos',
        'Antioxidante tópico (Vitamina C 10% ou Sérum Niacinamida)',
        'Hidratante leve com Ácido Hialurônico',
        'Protetor Solar FPS 50+ com cor'
      ],
      night: [
        'Dupla limpeza suave com água micelar + gel de limpeza',
        'Aplicação da Fórmula Magistral Despigmentante',
        'Creme reparador calmante com Ceramidas / Pantenol se necessário'
      ]
    }
  };

  try {
    const systemInstruction = `Você é o GERADOR DE PRESCRIÇÕES E FORMULAÇÕES MAGISTRAIS do CONSUDERME, altamente capacitado em farmácia galênica dermatológica brasileira e prescrição alopática médica.
Você deve prescrever formulações magistrais com veículos dermocosméticos precisos (Gel Oil-free, Sérum Toque Seco, Creme com Fosfolipídios / Base Segunda Pele, Loção Fluida não comedogênica, Pomada Lipofílica, Bastão Anidro) com concentrações percentuais farmacológicas seguras para o fototipo de Fitzpatrick do paciente e patologia alvo.`;

    const prompt = `Gere propostas de fórmulas magistrais e conduta farmacológica dermatológica para:
- Indicação Clínica / Patologia: ${indication || 'Melasma / Fotoenvelhecimento'}
- Fototipo do Paciente: ${fitzpatrick || 'III'}
- Tipo de Pele: ${skinType || 'Mista / Sensível'}
- Preferência de Veículo: ${vehiclePreference || 'Sérum Fluido Toque Seco'}
- Particularidades / Alergias: ${specialNotes || 'Nenhuma'}
- Observações do Médico: ${doctorNotes || 'Sem restrições'}

Retorne estritamente em formato JSON estruturado com:
1. "magistralFormulas": Array de formulações magistrais recomendadas contendo:
   - "title": Nome / Objetivo da fórmula (ex: "Fórmula Despigmentante Noturna com Ácido Tranexâmico e Niacinamida")
   - "vehicle": Veículo exato e quantidade (ex: "Sérum Toque Seco q.s.p. 30g" ou "Gel-Creme Não Comedogênico q.s.p. 50g")
   - "actives": Array com { "name": string, "percentage": string, "rationale": string }
   - "posology": Modo de uso diário detalhado (ex: "Aplicar 4 a 5 gotas na face limpa e seca à noite, massageando até absorção. Lavar pela manhã e aplicar protetor solar FPS 50+.")
   - "warnings": Cuidados específicos (ex: "Suspender se eritema excessivo; não associar com outros retinóides sem orientação médica.")
2. "industrialOptions": Array de opções industrializadas consagradas no mercado brasileiro caso o médico prefira não manipular (com Nome comercial / Princípio ativo e posologia).
3. "photoprotectionStrategy": Recomendação precisa de fotoproteção (Filtros químicos/físicos, cor de base para luz visível, reaplicação).
4. "generalSkincareRoutine": Rotina simplificada em etapas: Manhã (Limpeza, Tratamento, Fotoproteção) e Noite (Limpeza, Tratamento Noturno).`;

    const jsonSchema = {
      type: Type.OBJECT,
      properties: {
        magistralFormulas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              vehicle: { type: Type.STRING },
              actives: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    percentage: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                  },
                  required: ['name', 'percentage', 'rationale'],
                },
              },
              posology: { type: Type.STRING },
              warnings: { type: Type.STRING },
            },
            required: ['title', 'vehicle', 'actives', 'posology', 'warnings'],
          },
        },
        industrialOptions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              activeIngredient: { type: Type.STRING },
              posology: { type: Type.STRING },
            },
            required: ['name', 'activeIngredient', 'posology'],
          },
        },
        photoprotectionStrategy: { type: Type.STRING },
        generalSkincareRoutine: {
          type: Type.OBJECT,
          properties: {
            morning: { type: Type.ARRAY, items: { type: Type.STRING } },
            night: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['morning', 'night'],
        },
      },
      required: ['magistralFormulas', 'industrialOptions', 'photoprotectionStrategy', 'generalSkincareRoutine'],
    };

    const aiResult = await executeMultiProviderAI({
      systemInstruction,
      prompt,
      isJson: true,
      jsonSchema,
      preferredProvider
    });

    if (aiResult?.jsonData) {
      return res.json({
        success: true,
        data: aiResult.jsonData,
        providerUsed: aiResult.providerUsed,
        model: aiResult.model
      });
    }

    return res.status(502).json({
      success: false,
      error: 'O modelo retornou uma estrutura inválida para prescrição magistral.'
    });
  } catch (error: any) {
    const status = error instanceof UpstreamAIError ? error.status : 500;
    console.error('Prescription generator error:', error?.message || error);
    return res.status(status).json({
      success: false,
      error: error?.message || 'Erro ao gerar prescrição magistral no servidor.'
    });
  }
});

// COPILOTO: Guia de Procedimentos Injetáveis & Protocolo de Segurança
app.post('/api/copilot/procedure-guide', async (req, res) => {
  const { procedureType, targetArea, patientProfile, preferredProvider } = req.body;
  
  const fallbackProcedure = {
    procedureName: `${procedureType || 'Protocolo de Injetáveis'} - Mapeamento de Segurança & Zonas de Risco`,
    anatomicalPlanes: 'Músculos da mímica facial (intramuscular estrito para toxina) e Camadas 2 e 4 de Mendelson (subcutâneo e supraperiosteal para preenchedores).',
    dosageAndPoints: [
      { area: 'Glabela (Músculo Prócero)', recommendedUnitsOrVolume: '4 a 6 UI', injectionTechnique: 'Ponto único perpendicular 90°, inserção intramuscular profunda.', targetMuscleOrStructure: 'M. Prócero' },
      { area: 'Corrugadores Superciliares (Bilateral)', recommendedUnitsOrVolume: '3 a 5 UI por ponto (2 pontos/lado)', injectionTechnique: 'Ponto medial profundo (90°) e ponto lateral superficial (30°) a 1cm do rebordo orbitário superior para evitar ptose.', targetMuscleOrStructure: 'M. Corrugador do Supercílio' },
      { area: 'Frontal (Linhas Horizontais)', recommendedUnitsOrVolume: '1 a 2 UI por ponto (6 a 8 pontos)', injectionTechnique: 'Intradérmico/Intramuscular superficial em V invertido, respeitando faixa de segurança de 2cm acima das sobrancelhas.', targetMuscleOrStructure: 'M. Ventre Frontal' },
      { area: 'Pés de Galinha (Orbicular dos Olhos)', recommendedUnitsOrVolume: '2 a 4 UI por ponto (3 pontos/lado)', injectionTechnique: 'Subdérmico a 1cm lateral ao rebordo orbitário externo, bisel voltado para fora.', targetMuscleOrStructure: 'M. Orbicular do Olho (parte lateral)' }
    ],
    dangerZonesAndVessels: [
      { vessel: 'Artéria Supratroclear e Supraorbital', dangerLocation: 'Emergência nos forames/incisuras supraorbitais e supratrocleares.', safetyRule: 'Manter injeções de preenchedor em plano supraperiosteal com aspiração prévia de 5-10s ou uso de microcânula 22G/25G.' },
      { vessel: 'Artéria Angular e Facial', dangerLocation: 'Sulco nasogeniano proximal e fossa piriforme.', safetyRule: 'Injeção na fossa piriforme estritamente justaperiosteal (tocar osso) e aspiração obrigatória.' },
      { vessel: 'Artérias Labiais Superior e Inferior', dangerLocation: 'Plano submucoso profundo a 2-4mm da borda do vermelhão.', safetyRule: 'Aplicar preenchedor no plano submucoso superficial com retroinjeção lenta e de baixo volume (< 0,05 mL por passada).' }
    ],
    potentialComplications: [
      'Ptose Palpebral por difusão da toxina para o M. Levantador da Pálpebra Superior (uso de colírio de Apraclonidina 0.5% ou Tartarato de Brimonidina se ocorrer)',
      'Assimetria de elevação da cauda da sobrancelha ("Sinal de Mefisto" - corrigir com 1 UI no ventre lateral do frontal)',
      'Isquemia vascular por embolização arterial em caso de preenchedores de Ácido Hialurônico'
    ],
    emergencyProtocol: 'EMERGÊNCIA POR ÁCIDO HIALURÔNICO (PROTOCOLO HIGH-DOSE HIALURONIDASE): Infiltrar imediatamente 500 a 1.500 UI de Hialuronidase diluída em SF 0.9% na área isquêmica e trajeto vascular. Repetir a cada 60-90min se o tempo de enchimento capilar permanecer > 2 segundos. Aplicar calor local (compressas mornas), massagem vigorosa, AAS 100-300mg VO dose única e corticoterapia oral. Encaminhamento oftalmológico de urgência se houver amaurose.',
    postCareSummary: 'Não deitar nem baixar a cabeça nas primeiras 4 horas; evitar atividades físicas intensas e exposição solar/sauna por 24 horas; não massagear os pontos de aplicação.'
  };

  try {
    const systemInstruction = `Você é o GUIA ANATÔMICO E DE PROCEDIMENTOS INJETÁVEIS do CONSUDERME.
Você domina a anatomia da face (camadas 1 a 5 de Mendelson), zonas de risco vascular (Artéria Angular, Facial, Supratroclear, Supraorbital, Ramo Frontal da Temporal Superficial, Artéria Labial Superior e Inferior), dosimetria de Toxina Botulínica (UI por ponto), planos de aplicação de Preenchedores de Ácido Hialurônico e Bioestimuladores (PLLA/CaHA), além do protocolo imediato de emergência com Hialuronidase em caso de isquemia vascular.`;

    const prompt = `Elabore um guia de procedimento e mapa anatômico para:
- Procedimento: ${procedureType || 'Toxina Botulínica Facial Completa'}
- Área Alvo: ${targetArea || 'Terço Superior (Glabela, Frontal, Orbicular dos Olhos)'}
- Perfil do Paciente: ${patientProfile || 'Feminino, 38 anos, rugas dinâmicas moderadas, sem ptose prévia'}

Retorne estritamente em formato JSON estruturado com:
1. "procedureName": Nome completo do protocolo.
2. "anatomicalPlanes": Plano exato de aplicação (Intramuscular profundo, Subdérmico, Justaperiosteal, Subcutâneo superficial).
3. "dosageAndPoints": Array com { "area": string, "recommendedUnitsOrVolume": string, "injectionTechnique": string, "targetMuscleOrStructure": string }.
4. "dangerZonesAndVessels": Array com { "vessel": string, "dangerLocation": string, "safetyRule": string } (ex: aspirar antes de injetar em bolus, uso de cânula 22G/25G, baixa pressão).
5. "potentialComplications": Array de possíveis complicações e como prevenir (Ptose palpebral, assimetria, edema, equimose, efeito Tyndall).
6. "emergencyProtocol": Passo a passo detalhado para suspeita de isquemia vascular / necrose (Dosagem de Hialuronidase em UI por quadrante, massagem vigorosa, calor local, AAS, Sildenafil/Tadalafila, acompanhamento seriado).
7. "postCareSummary": Resumo rápido de cuidados para repassar ao paciente nas primeiras 24-48 horas.`;

    const jsonSchema = {
      type: Type.OBJECT,
      properties: {
        procedureName: { type: Type.STRING },
        anatomicalPlanes: { type: Type.STRING },
        dosageAndPoints: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              area: { type: Type.STRING },
              recommendedUnitsOrVolume: { type: Type.STRING },
              injectionTechnique: { type: Type.STRING },
              targetMuscleOrStructure: { type: Type.STRING },
            },
            required: ['area', 'recommendedUnitsOrVolume', 'injectionTechnique', 'targetMuscleOrStructure'],
          },
        },
        dangerZonesAndVessels: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              vessel: { type: Type.STRING },
              dangerLocation: { type: Type.STRING },
              safetyRule: { type: Type.STRING },
            },
            required: ['vessel', 'dangerLocation', 'safetyRule'],
          },
        },
        potentialComplications: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        emergencyProtocol: { type: Type.STRING },
        postCareSummary: { type: Type.STRING },
      },
      required: ['procedureName', 'anatomicalPlanes', 'dosageAndPoints', 'dangerZonesAndVessels', 'potentialComplications', 'emergencyProtocol', 'postCareSummary'],
    };

    const aiResult = await executeMultiProviderAI({
      systemInstruction,
      prompt,
      isJson: true,
      jsonSchema,
      preferredProvider
    });

    if (aiResult?.jsonData) {
      return res.json({
        success: true,
        data: aiResult.jsonData,
        providerUsed: aiResult.providerUsed,
        model: aiResult.model
      });
    }

    return res.status(502).json({
      success: false,
      error: 'O modelo retornou uma estrutura inválida para guia de procedimento.'
    });
  } catch (error: any) {
    const status = error instanceof UpstreamAIError ? error.status : 500;
    console.error('Procedure guide error:', error?.message || error);
    return res.status(status).json({
      success: false,
      error: error?.message || 'Erro ao gerar guia de procedimento no servidor.'
    });
  }
});

// COPILOTO: Gerador de Orientações Pós-Procedimento para WhatsApp / Impressão
app.post('/api/copilot/post-care-generator', async (req, res) => {
  const { procedure, patientName, doctorName, clinicPhone, specificNotes, preferredProvider } = req.body;
  
  const fallbackPostCare = {
    whatsappMessage: `✨ *Orientações Pós-Procedimento - ${procedure || 'Procedimento Dermatológico'}* ✨\n\nOlá, *${patientName || 'Paciente'}*! Aqui estão as recomendações do *${doctorName || 'seu dermatologista'}* para garantir o melhor resultado e a sua total segurança:\n\n*Nas primeiras 4 a 6 horas:*\n• Mantenha a cabeça elevada, sem deitar ou abaixar o tronco.\n• Evite tocar, coçar ou pressionar os locais tratados.\n\n*Nas primeiras 24 a 48 horas:*\n• Não pratique exercícios físicos intensos nem frequente saunas/piscinas.\n• Evite exposição solar direta e use protetor solar FPS 50+.\n• Caso surjam pequenos hematomas, aplique compressas geladas delicadamente.\n\n📞 Em caso de dúvidas ou necessidade, entre em contato com nossa equipe: *${clinicPhone || 'ConsuDerme'}*.`,
    printedDocument: `ORIENTAÇÕES MÉDICAS PÓS-PROCEDIMENTO DERMATOLÓGICO\n\nPaciente: ${patientName || 'Paciente'}\nProcedimento Realizado: ${procedure || 'Procedimento Injetável/Clínico'}\nMédico Responsável: ${doctorName || 'Dermatologista Responsável'}\n\n1. CUIDADOS GERAIS IMEDIATOS (PRIMEIRAS 24 HORAS):\n- Não massagear nem manipular vigorosamente a região tratada.\n- Evitar deitar-se em decúbito dorsal ou ventral nas primeiras 4 horas após o procedimento.\n- Não realizar atividade física de alto impacto ou exposição a fontes intensas de calor (fornos, saunas, sol).\n\n2. HIGIENE E FOTOPROTEÇÃO:\n- Lavar o rosto com sabonete neutro ou suave syndet sem esfregar.\n- Aplicar protetor solar de amplo espectro (FPS ≥ 50) e renovar a aplicação a cada 3 horas.\n- Suspender ácidos ou esfoliantes químicos por 5 a 7 dias conforme orientação médica.\n\n3. SINAIS DE ALARME QUE EXIGEM AVALIAÇÃO MÉDICA IMEDIATA:\n- Dor intensa, contínua e desproporcional ao procedimento.\n- Palidez, branqueamento cutâneo ou manchas arroxeadas/marmorizadas no local ou proximidades.\n- Alterações visuais súbitas (visão turva, perda de campo visual ou dor retrobulbar).\n\nContato de Urgência da Clínica: ${clinicPhone || 'Consulte seu médico'}.`,
    urgentWarningSigns: [
      'Dor intensa que não cede com analgésicos comuns',
      'Branqueamento ou coloração acinzentada/aroxeada da pele',
      'Formação de pequenas pústulas ou bolhas na área tratada',
      'Alteração súbita da visão ou dor nos olhos'
    ]
  };

  try {
    const systemInstruction = `Você é o gerador de orientações pós-procedimento dermatológico do CONSUDERME. Seu texto deve ser acolhedor, profissional, em português impecável, fácil de compreender pelo paciente e perfeitamente formatado para envio direto via WhatsApp ou impressão de folheto.`;

    const prompt = `Gere orientações completas de pós-procedimento para:
- Procedimento realizado: ${procedure || 'Aplicação de Toxina Botulínica e Preenchimento Labial'}
- Nome do Paciente: ${patientName || 'Paciente'}
- Nome do Médico: ${doctorName || 'Dr(a). Dermatologista'}
- Contato de Urgência da Clínica: ${clinicPhone || '(XX) XXXXX-XXXX'}
- Recomendações Específicas: ${specificNotes || 'Compressas frias nas primeiras 24h sem pressionar'}

Retorne estritamente em formato JSON com:
1. "whatsappMessage": Texto formatado com emojis adequados e tópicos com negrito WhatsApp (*texto*), pronto para colar e enviar.
2. "printedDocument": Versão formal em parágrafos e tópicos numerados para impressão em folha timbrada do consultório.
3. "urgentWarningSigns": Lista de sinais de alarme que exigem contato imediato (ex: dor intensa desproporcional, branqueamento da pele, manchas violáceas, febre).`;

    const jsonSchema = {
      type: Type.OBJECT,
      properties: {
        whatsappMessage: { type: Type.STRING },
        printedDocument: { type: Type.STRING },
        urgentWarningSigns: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ['whatsappMessage', 'printedDocument', 'urgentWarningSigns'],
    };

    const aiResult = await executeMultiProviderAI({
      systemInstruction,
      prompt,
      isJson: true,
      jsonSchema,
      preferredProvider
    });

    if (aiResult?.jsonData) {
      return res.json({
        success: true,
        data: aiResult.jsonData,
        providerUsed: aiResult.providerUsed,
        model: aiResult.model
      });
    }

    return res.status(502).json({
      success: false,
      error: 'O modelo retornou uma estrutura inválida para orientações pós-procedimento.'
    });
  } catch (error: any) {
    const status = error instanceof UpstreamAIError ? error.status : 500;
    console.error('Post-care generator error:', error?.message || error);
    return res.status(status).json({
      success: false,
      error: error?.message || 'Erro ao gerar orientações pós-procedimento no servidor.'
    });
  }
});

// Comprehensive Fallback Intelligence Engine for DermIA & ConsuDerme
function generateDermiaFallbackResponse(message: string, doctorProfile: any): string {
  const query = (message || '').toLowerCase();
  const docName = doctorProfile?.name || 'Doutor(a)';

  // 1. Melasma / Despigmentantes
  if (query.includes('melasma') || query.includes('despigment') || query.includes('tranex') || query.includes('cisteam') || query.includes('mancha')) {
    return `Olá, **${docName}**! Segue a conduta e orientação farmacotécnica da **DermIA** para o manejo do **Melasma Recalcitrante (Dérmico / Misto)**:

### 🔬 Racional Farmacológico & Abordagem Terapêutica
O melasma é uma hipermelanose crônica adquirida com forte componente vascular, inflamatório e de fotoenvelhecimento (senescência de fibroblastos).

### 📋 Sugestão de Fórmula Magistral de Ataque (Toque Seco):
- **Ácido Tranexâmico**: 3.0% *(Inibidor da via plasminogênio-plasmina e angiogênese dérmica)*
- **Cisteamina HCl**: 5.0% ou **Alfa-Arbutin**: 3.0% *(Inibição da tirosinase)*
- **Niacinamida (Vitamina B3)**: 4.0% *(Bloqueio da transferência de melanossomos e anti-inflamatório)*
- **Ácido Kójico Dipalmitato**: 2.0%
- **Veículo**: Sérum Fluido Fosfolipídico / Toque Seco q.s.p. 30g *(pH 5.5)*

### 📝 Posologia & Modo de Uso:
- Aplicar 4 a 5 gotas na face limpa e seca à noite, iniciando em dias alternados na 1ª semana.
- Uso obrigatório de fotoproteção de amplo espectro (FPS ≥ 50, PPD ≥ 16) com cor (óxido de ferro para proteção contra luz visível azul) a cada 3 horas.

Você pode abrir o **Prescritor de Fórmulas** no menu para personalizar ou imprimir este receituário timbrado!`;
  }

  // 2. Emergência Hialuronidase / Oclusão Vascular
  if (query.includes('hialuroni') || query.includes('isquemia') || query.includes('oclus') || query.includes('necrose') || query.includes('emergência')) {
    return `⚠️ **PROTOCOLO DE EMERGÊNCIA DERMIA: REVERSÃO DE ISQUEMIA POR ÁCIDO HIALURÔNICO**

**${docName}**, a suspeita de oclusão vascular por preenchedor de Ácido Hialurônico exige intervenção imediata (primeiras 24-48h são críticas para evitar necrose e amaurose):

### 🚨 Conduta Imediata no Consultório (Protocolo High-Dose Pulsed):
1. **Interromper Imediatamente a Injeção** e aspirar se ainda estiver com a cânula/agulha inserida.
2. **Infiltração de Hialuronidase (Dose de Ataque):**
   - Infiltrar **500 a 1.500 UI** de Hialuronidase diluída em SF 0.9% (ou anestésico sem vasoconstritor) diretamente na área isquêmica, trajeto vascular e leito capilar.
   - Repetir a aplicação a cada **60 a 90 minutos** se o enchimento capilar não normalizar (< 2 segundos).
3. **Massagem Vigorosa e Calor Local:**
   - Compressas mornas para vasodilatação (evitar gelo!) e massagem digital para difundir a enzima.
4. **Terapia Farmacológica Adjuvante:**
   - **AAS**: 100 mg a 300 mg via oral dose única (antiagregação plaquetária).
   - **Prednisona**: 40 mg a 60 mg/dia por 3 a 5 dias para controle do edema e compressão tecidual.
   - **Sildenafil** (20 mg 8/8h) se isquemia periférica refratária.
5. **Sinais de Alarme Oftalmológico (Amaurose/Dor Retrobulbar):**
   - Encaminhamento emergencial ao oftalmologista / retinólogo para descompressão seletiva e câmara hiperbárica.

*Consulte o módulo **Guia de Injetáveis & Anatomia** para visualizar as zonas de risco arterial.*`;
  }

  // 3. Isotretinoína Oral / Acne / Receita C2
  if (query.includes('isotretino') || query.includes('roacutan') || query.includes('receita c2') || query.includes('c2') || query.includes('portaria 344')) {
    return `Olá, **${docName}**! A prescrição de **Isotretinoína Oral** é regulamentada pela **Portaria SVS/MS nº 344/1998 (Lista C2)** e pelo CFM:

### 📜 Exigências Legais & Regulatórias Obrigatórias:
1. **Notificação de Receita Especial C2** (cor branca, 2 vias, validade de **30 dias** em território nacional, dispensação máxima para 30 dias de tratamento).
2. **Termo de Consentimento e Alerta de Teratogenicidade:**
   - Obrigatório para mulheres em idade fértil (12 a 55 anos).
   - Exigência de **2 métodos contraceptivos complementares** (ex: ACO/DIU + preservativo) 30 dias antes, durante e até 30 dias após o término.
   - **2 testes de gravidez negativos (Beta-HCG quantitativo)** com intervalo de 30 dias antes da 1ª prescrição, e Beta-HCG mensal antes de cada renovação.

### 🧪 Monitoramento Laboratorial Pré e Intra-Tratamento:
- **Baseline**: Hemograma, TGO/TGP, Gama-GT, Bilirrubinas, Perfil Lipídico (Colesterol total, frações, Triglicerídeos), Ureia, Creatinina e Beta-HCG.
- **Controle**: Repetir após 30 a 45 dias de tratamento e a cada 3 meses.

### 💊 Meta Terapêutica de Dose Acumulada:
- Dose diária inicial: **0,5 mg/kg/dia**, titulada até 1,0 mg/kg/dia conforme tolerância.
- Dose acumulada total para cura: **120 a 150 mg/kg**.

*No módulo **Gestão & Documentos**, você pode gerar a Receita C2 com a advertência de teratogenicidade pré-formatada.*`;
  }

  // 4. Oncologia Cutânea / ABCDE / Melanoma
  if (query.includes('melanoma') || query.includes('abcde') || query.includes('carcinoma') || query.includes('cbc') || query.includes('cec') || query.includes('dermatoscop')) {
    return `Olá, **${docName}**! A estratificação de risco de neoplasias cutâneas deve seguir as diretrizes da **SBD** e **CFM**:

### 🔍 Critérios Dermatoscópicos & Regra ABCDE:
- **A - Assimetria**: Em 2 eixos ortogonais na cor e contorno.
- **B - Bordas**: Irregulares, chanfradas ou com término abrupto da rede pigmentada.
- **C - Cores Variadas**: ≥ 3 cores (castanho claro/escuro, preto, cinza-azulado, véu branco, áreas despigmentadas).
- **D - Diâmetro**: > 6 mm (atenção a melanomas iniciais pequenos).
- **E - Evolução**: Mudança de tamanho, relevo, cor, sangramento ou prurido ("Sinal do Patinho Feio").

### 🔬 Sinais Dermatoscópicos de Alto Risco:
- Rede pigmentada atípica espessada.
- Glóbulos castanhos e pontos periféricos irregulares.
- **Véu azul-esbranquiçado** e estruturas de regressão.
- Vasos atípicos em grampo ou polimorfos.

### ✂️ Conduta Padrão-Ouro:
- **Biópsia Excisional** completa com margem de segurança de **1 a 2 mm** de pele sã e tecido celular subcutâneo.
- *Evitar biópsia por shaving ou punch incisional em lesões com forte suspeita de melanoma*, para não comprometer a mensuração do Índice de Breslow.`;
  }

  // 5. Custos / Precificação de Procedimentos
  if (query.includes('custo') || query.includes('preço') || query.includes('precifica') || query.includes('botox') || query.includes('toxina') || query.includes('margem')) {
    return `Olá, **${docName}**! Segue a fórmula de **Formação de Preço e Custo Real** recomendada pela DermIA:

### 📊 Estrutura de Custos para Toxina Botulínica (Exemplo Frasco 100 UI):
- **Custo do Frasco 100 UI**: R$ 750,00 → **R$ 7,50 por UI**
- **Aplicação Típica (Terço Superior)**: 50 UI = **R$ 375,00**
- **Insumos Descartáveis**: R$ 45,00 *(seringas 0.3ml/0.5ml BD Ultra-Fine, agulhas 32G, soro estéril, gaze, álcool 70%, luvas)*
- **Custo Direto Total da Sessão**: R$ 375,00 + R$ 45,00 = **R$ 420,00**

### 💰 Formação de Preço de Venda com Margem de 65%:
- **Fórmula**: \`Preço = Custo Direto / (1 - Margem%)\`
- **Cálculo**: R$ 420,00 / (1 - 0.65) = **R$ 1.200,00**
- **Lucro Bruto**: **R$ 780,00 por paciente** (Margem líquida de 65%).

*Acesse a **Calculadora de Custos** no módulo de Gestão para personalizar os valores reais dos seus fornecedores.*`;
  }

  // 6. Rosácea / Barreira Cutânea
  if (query.includes('rosácea') || query.includes('rosacea') || query.includes('sensível') || query.includes('telangiectasia')) {
    return `Olá, **${docName}**! Para o manejo da **Rosácea (Eritematotelangiectásica e Pápulo-Pustulosa)**, a DermIA recomenda o seguinte protocolo:

### 🛡️ Restauração da Barreira Cutânea & Ação Anti-inflamatória:
1. **Limpeza Suave**: Gel micelar ou loção de limpeza sem sulfatos (Syndet), pH 5.0 a 5.5.
2. **Controle Anti-inflamatório Tópico**:
   - **Ivermectina 1.0%** em Creme Fosfolipídico à noite *(eliminação do ácaro Demodex folliculorum e ação moduladora de citocinas)*.
   - **Ácido Azelaico 10% a 15%** em Gel-Creme (manhã ou dias alternados) para redução do eritema e pápulas.
   - **Niacinamida 4% + Alfa-Bisabolol 1%** para acalmar a hiper-reatividade vascular.
3. **Fotoproteção Física Mineral**: Filtros solares com Óxido de Zinco e Dióxido de Titânio, livres de fragrâncias e álcool.

*Dica clínica: Evitar vasodilatadores tópicos, peelings agressivos, ácidos em altas concentrações e orientar o paciente quanto a gatilhos térmicos, alimentares e estresse.*`;
  }

  // General Technical Answer
  return `Olá, **${docName}**! Sou a **DermIA**, copiloto de inteligência artificial do seu consultório **ConsuDerme**.

Recebi sua solicitação: *" ${message} "*

### 🩺 Diretrizes & Suporte Especializado:
1. **Abordagem Clínica & Diagnóstica**: Para anamneses e investigações com escala de Fitzpatrick e alerta de neoplasias, acesse o módulo **Consulta Clínica**.
2. **Prescrições & Fórmulas Magistrais**: Para formulações galênicas com veículos ideais (Gel, Sérum, Creme, Loção) e posologia completa, acesse o **Prescritor de Fórmulas**.
3. **Injetáveis & Segurança Anatômica**: Para mapas de toxina botulínica, planos de aplicação de preenchedores e reversão de emergência com Hialuronidase, acesse o **Guia de Injetáveis**.
4. **Gestão & Documentos Regulatórios**: Para gerar atestados com CID-10, receitas de controle especial C2 (Isotretinoína), laudos dermatoscópicos e precificação por UI/mL, acesse **Gestão do Consultório**.
5. **Conformidade Legal & TCLEs**: Para termos de consentimento pós-procedimento e políticas LGPD, acesse **Páginas Legais**.

Como posso detalhar melhor a conduta para este caso específico?`;
}

// COPILOTO: DermIA Chat Universal
app.post('/api/copilot/dermia-chat', async (req, res) => {
  const { message, conversationHistory, doctorProfile, preferredProvider } = req.body;
  try {
    if (preferredProvider === 'clinical_engine') {
      const localResponse = generateDermiaFallbackResponse(message, doctorProfile);
      return res.json({
        success: true,
        response: localResponse,
        providerUsed: 'Motor Clínico ConsuDerme (Local)',
        model: 'dermia-clinical-safety-v1',
        isFreeTier: true
      });
    }

    const systemInstruction = `Você é a DERMIA, a Inteligência Artificial e Copiloto Clínico Especializado do consultório CONSUDERME (ConsuDerme).
Você foi desenvolvida para prestar suporte em tempo real a médicos dermatologistas e profissionais de estética médica.
Suas competências incluem:
1. Raciocínio clínico dermatológico, diagnóstico diferencial e oncologia cutânea (Melanoma, CBC, CEC, regra ABCDE, dermatoscopia).
2. Farmacotécnica e formulação magistral galênica (veículos ideais, compatibilidade química, posologia e concentrações seguras por fototipo de Fitzpatrick I a VI).
3. Anatomia facial de injetáveis, zonas de perigo vascular (artérias facial, angular, supratroclear, labiais), planos de aplicação (Mendelson) e reversão de emergência com Hialuronidase em caso de oclusão.
4. Gestão de consultório, precificação por UI/mL e documentação regulatória em estrita conformidade com a Resolução CFM 2.314/2022, Portaria SVS/MS 344/98 e LGPD (Lei 13.709/2018).

Sempre responda de forma elegante, técnica, acolhedora, objetiva e formatada com clareza em tópicos e negritos.
Identifique-se com orgulho como **DermIA**, a inteligência artificial do ConsuDerme.
Médico atendido: ${doctorProfile?.name || 'Doutor(a)'} (CRM: ${doctorProfile?.crm || '---'}/${doctorProfile?.uf || 'UF'}).`;

    let formattedContents = '';
    if (conversationHistory && Array.isArray(conversationHistory)) {
      formattedContents += conversationHistory.map((msg: any) => `${msg.sender === 'user' ? 'Médico' : 'DermIA'}: ${msg.text}`).join('\n') + '\n';
    }
    formattedContents += `Médico: ${message}`;

    const aiResult = await executeMultiProviderAI({
      systemInstruction,
      prompt: formattedContents,
      isJson: false,
      preferredProvider
    });

    return res.json({
      success: true,
      response: aiResult.text,
      providerUsed: aiResult.providerUsed,
      model: aiResult.model,
      isFreeTier: aiResult.isFreeTier
    });
  } catch (error: any) {
    const status = error instanceof UpstreamAIError ? error.status : 500;
    console.error('DermIA chat error:', error?.message || error);
    return res.status(status).json({
      success: false,
      error: error?.message || 'Erro ao comunicar com o servidor da DermIA.'
    });
  }
});

// COPILOTO: DermIA Chat Streaming (SSE via server-side @google/genai)
app.post('/api/copilot/dermia-chat/stream', async (req, res) => {
  const { message, conversationHistory, doctorProfile } = req.body;
  const ai = getGeminiAI();
  if (!ai) {
    return res.status(503).json({
      success: false,
      error: 'Chave da API Gemini não configurada no servidor. Verifique GEMINI_API_KEY em Settings > Secrets.'
    });
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  try {
    const systemInstruction = `Você é a DERMIA, a Inteligência Artificial e Copiloto Clínico Especializado do consultório CONSUDERME.
Médico atendido: ${doctorProfile?.name || 'Doutor(a)'} (CRM: ${doctorProfile?.crm || '---'}/${doctorProfile?.uf || 'UF'}).
Responda em Português do Brasil com rigor dermatológico (SBD/CFM).`;

    let formattedContents = '';
    if (conversationHistory && Array.isArray(conversationHistory)) {
      formattedContents += conversationHistory.map((msg: any) => `${msg.sender === 'user' ? 'Médico' : 'DermIA'}: ${msg.text}`).join('\n') + '\n';
    }
    formattedContents += `Médico: ${message}`;

    const stream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: formattedContents,
      config: { systemInstruction }
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text, model: GEMINI_MODEL })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('DermIA stream error:', error?.message || error);
    res.write(`data: ${JSON.stringify({ error: error?.message || 'Erro no streaming da DermIA.' })}\n\n`);
    res.end();
  }
});

// PWA Static Assets & Service Worker Configuration
const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir));

// Service worker special route with Service-Worker-Allowed header and no-cache
app.get('/sw.js', (req, res) => {
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(publicDir, 'sw.js'));
});

// WebManifest special route
app.get('/manifest.webmanifest', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.sendFile(path.join(publicDir, 'manifest.webmanifest'));
});

// Vite middleware or Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Consuderme server running on port ${PORT}`);
  });
}

startServer();
