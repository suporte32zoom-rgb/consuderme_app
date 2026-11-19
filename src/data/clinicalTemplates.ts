export interface FitzpatrickInfo {
  type: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
  name: string;
  reaction: string;
  tanning: string;
  colorTone: string;
  skinDescription: string;
  melaninRisk: string;
}

export const FITZPATRICK_SCALE: FitzpatrickInfo[] = [
  {
    type: 'I',
    name: 'Fototipo I — Pele Muito Clara',
    reaction: 'Sempre queima, nunca bronzeia',
    tanning: 'Extremamente sensível ao sol',
    colorTone: '#FDE2D4',
    skinDescription: 'Pele muito branca/albina, sardas frequentes, olhos azuis/claros, cabelos ruivos ou louros claros.',
    melaninRisk: 'Risco altíssimo de queimadura solar e neoplasias cutâneas (Melanoma, CBC, CEC). Baixo risco de hiperpigmentação pós-inflamatória.'
  },
  {
    type: 'II',
    name: 'Fototipo II — Pele Clara',
    reaction: 'Queima facilmente, bronzeia minimamente',
    tanning: 'Muito sensível ao sol',
    colorTone: '#F7D0B9',
    skinDescription: 'Pele branca, olhos claros ou castanhos claros, cabelos louros ou castanhos claros.',
    melaninRisk: 'Alto risco de fotodano e câncer de pele. Risco moderado de eritema persistente.'
  },
  {
    type: 'III',
    name: 'Fototipo III — Pele Morena Clara',
    reaction: 'Queima moderadamente, bronzeia gradualmente',
    tanning: 'Sensibilidade média ao sol',
    colorTone: '#E4B896',
    skinDescription: 'Pele morena clara/caucasiana média, olhos castanhos, cabelos castanhos.',
    melaninRisk: 'Equilíbrio entre resposta inflamatória e pigmentar. Risco moderado de melasma e hiperpigmentação pós-peeling.'
  },
  {
    type: 'IV',
    name: 'Fototipo IV — Pele Morena Média',
    reaction: 'Queima minimamente, bronzeia facilmente',
    tanning: 'Sensibilidade moderada a baixa ao sol',
    colorTone: '#C9936A',
    skinDescription: 'Pele morena típica brasileira/mediterrânea/latina, olhos e cabelos escuros.',
    melaninRisk: 'Risco elevado de hiperpigmentação pós-inflamatória (HPI) e melasma resistente. Cuidado redobrado com peelings profundos e lasers ablativos.'
  },
  {
    type: 'V',
    name: 'Fototipo V — Pele Morena Escura',
    reaction: 'Raramente queima, bronzeia profundamente',
    tanning: 'Pouco sensível ao sol',
    colorTone: '#8C5A3C',
    skinDescription: 'Pele morena escura/parda/indígena, olhos e cabelos pretos.',
    melaninRisk: 'Risco muito alto de HPI e discromias. Proibidos procedimentos térmicos ou químicos agressivos sem preparo despigmentante prévio.'
  },
  {
    type: 'VI',
    name: 'Fototipo VI — Pele Negra',
    reaction: 'Nunca queima, profundamente pigmentada',
    tanning: 'Insensível ao eritema solar comum',
    colorTone: '#4B3124',
    skinDescription: 'Pele negra retinta, rica em eumelanina e proteção natural contra UV.',
    melaninRisk: 'Risco altíssimo de queloides, cicatrizes hipertróficas e discromias pós-trauma. Melanoma acral-lentiginoso deve ser rastreado nas regiões palmoplantares e ungueais.'
  }
];

export interface QuickClinicalCasePreset {
  id: string;
  title: string;
  fitzpatrick: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
  complaint: string;
  evolutionTime: string;
  topography: string;
  symptoms: string;
  previousTreatments: string;
  comorbidities: string;
  allergies: string;
}

export const CLINICAL_PRESETS: QuickClinicalCasePreset[] = [
  {
    id: 'melasma-centrofacial',
    title: 'Melasma Misto Centrofacial Recalcitrante',
    fitzpatrick: 'IV',
    complaint: 'Manchas acastanhadas em fronte, bochechas e buço com piora no verão e após uso de anticoncepcional oral.',
    evolutionTime: '3 anos',
    topography: 'Região frontal, malar bilateral e supralabial.',
    symptoms: 'Assintomático. Desconforto estético acentuado.',
    previousTreatments: 'Hidroquinona 4% em creme há 1 ano com efeito rebote.',
    comorbidities: 'Uso de ACO combinado (Etinilestradiol + Drospirenona).',
    allergies: 'Nega.'
  },
  {
    id: 'acne-inflamatoria-grau-3',
    title: 'Acne Vulgar Pápulo-Pustulosa / Nódulo-Cística (Grau III)',
    fitzpatrick: 'III',
    complaint: 'Lesões inflamatórias dolorosas, pústulas e nódulos com tendência a cicatrizes deprimidas.',
    evolutionTime: '8 meses',
    topography: 'Face (malar, mento) e região escapular superior.',
    symptoms: 'Dor à palpação, calor local e oleosidade excessiva.',
    previousTreatments: 'Sabonete de ácido salicílico e peróxido de benzoíla 5% sem controle satisfatório.',
    comorbidities: 'Nenhuma conhecida. Menarca aos 12 anos, ciclos regulares.',
    allergies: 'Nega.'
  },
  {
    id: 'lesao-suspeita-dorso',
    title: 'Lesão Pigmentada Suspeita em Dorso (Rastreio de Melanoma / CBC)',
    fitzpatrick: 'II',
    complaint: 'Mácula enegrecida assimétrica de bordas irregulares que notou aumento de tamanho e alteração de tonalidade nos últimos meses.',
    evolutionTime: '6 meses de mudança rápida',
    topography: 'Dorso superior direito (interescapular).',
    symptoms: 'Prurido ocasional e pequeno sangramento ao atrito da camisa.',
    previousTreatments: 'Nenhum.',
    comorbidities: 'História familiar de melanoma em parente de 1º grau (pai). Múltiplos nevos melanocíticos.',
    allergies: 'Alergia a Dipirona.'
  },
  {
    id: 'rosacea-papulopustulosa',
    title: 'Rosácea Eritêmato-Telangiectásica / Pápulo-Pustulosa',
    fitzpatrick: 'I',
    complaint: 'Rubor facial (flushing) desencadeado por alimentos quentes, álcool e estresse, associado a pápulas inflamatórias.',
    evolutionTime: '2 anos',
    topography: 'Região malar central, nariz e queixo com preservação periorbital.',
    symptoms: 'Sensação de queimação, ardor ao passar dermocosméticos comuns e ressecamento ocular.',
    previousTreatments: 'Corticóide tópico usado por conta própria com piora rebote.',
    comorbidities: 'Dispepsia / gastrite crônica.',
    allergies: 'Nega.'
  }
];

export interface InjectableZoneReference {
  zone: string;
  targetMuscles: string;
  botoxUnitsAverage: string;
  injectionPlane: string;
  dangerVessels: string;
  safetyTips: string;
}

export const INJECTABLE_ZONES: InjectableZoneReference[] = [
  {
    zone: 'Glabela (Linhas de Bravo)',
    targetMuscles: 'M. Corrugador do Supercílio (medial e lateral) + M. Prócero',
    botoxUnitsAverage: '16 a 24 UI no total (4-6 UI no prócero; 4-6 UI por corrugador medial; 2-3 UI corrugador lateral)',
    injectionPlane: 'Intramuscular profundo no corrugador medial e prócero; Intramuscular superficial no corrugador lateral',
    dangerVessels: 'Artéria Supratroclear e Artéria Supraorbital',
    safetyTips: 'Manter a injeção a pelo menos 1 cm acima da borda orbital superior para evitar difusão para o m. elevador da pálpebra superior (risco de ptose).'
  },
  {
    zone: 'Frontal (Testa / Rugas Horizontais)',
    targetMuscles: 'M. Occipitofrontal (ventre frontal)',
    botoxUnitsAverage: '6 a 15 UI distribuídas em 4 a 8 pontos (1-2 UI por ponto)',
    injectionPlane: 'Intramuscular superficial / Subdérmico alto',
    dangerVessels: 'Ramos frontais da Artéria Temporal Superficial',
    safetyTips: 'Respeitar margem de segurança de 2 cm acima da linha das sobrancelhas para evitar peso/queda da cauda ou arqueamento excessivo (sinal de Spock/Mefisto).'
  },
  {
    zone: 'Orbicular dos Olhos (Pés de Galinha)',
    targetMuscles: 'M. Orbicular do Olho (porção lateral orbital)',
    botoxUnitsAverage: '8 a 16 UI por lado (2-4 UI por ponto, 3 a 4 pontos)',
    injectionPlane: 'Intradérmico superficial (pápula com bisel voltado para fora)',
    dangerVessels: 'Veia e Artéria Zigomático-Facial',
    safetyTips: 'Aplicar a pelo menos 1 a 1,5 cm do rebordo ósseo orbital lateral para evitar diplopia por paresia do m. reto lateral.'
  },
  {
    zone: 'Masseter (Bruxismo / Afinamento Facial)',
    targetMuscles: 'M. Masseter (ventre inferior e médio)',
    botoxUnitsAverage: '20 a 35 UI por lado (divididas em 3 a 5 pontos)',
    injectionPlane: 'Intramuscular profundo perpendicular até contato ósseo mandibular leve',
    dangerVessels: 'Artéria e Veia Faciais, Ducto Parotídeo de Stensen',
    safetyTips: 'Fazer o paciente morder forte para delimitar as bordas anterior e posterior do masseter. Aplicar somente na área de segurança abaixo da linha tragus-comissura labial.'
  },
  {
    zone: 'Preenchimento Malar / Zigomático (Top Model Look)',
    targetMuscles: 'Compartimentos de gordura profunda (SOOF) e eminência malar',
    botoxUnitsAverage: 'Ácido Hialurônico Alta Coesividade (G Prime Alto): 0.5 a 1.5 mL por lado',
    injectionPlane: 'Supraperiosteal (justaperiosteal) em bolus ou retroinjeção com cânula 22G/25G',
    dangerVessels: 'Artéria Infraorbital e Artéria Facial Transversa',
    safetyTips: 'Sempre aspirar por 5-10 segundos se usar agulha antes de injetar bolus supraperiosteal. Preferir cânula para segurança máxima.'
  },
  {
    zone: 'Preenchimento Labial e Contorno',
    targetMuscles: 'Vermelhão do lábio, tubérculos, arco de cupido e filtro labial',
    botoxUnitsAverage: 'Ácido Hialurônico Médio/Baixo G Prime: 0.7 a 1.2 mL no total',
    injectionPlane: 'Submucoso superficial ou intradérmico labial (máx 2-3 mm de profundidade)',
    dangerVessels: 'Artéria Labial Superior e Artéria Labial Inferior (geralmente situadas na camada submucosa posterior entre o m. orbicular e a mucosa)',
    safetyTips: 'Injetar lentamente em plano anterior ao trajeto arterial com baixíssima pressão. Ter hialuronidase à pronta entrega no consultório.'
  }
];
