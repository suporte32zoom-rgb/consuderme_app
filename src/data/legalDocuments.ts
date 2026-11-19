export interface LegalDocTemplate {
  id: string;
  title: string;
  category: 'institucional' | 'privacidade_lgpd' | 'tcle' | 'seguranca_cfm';
  shortDesc: string;
  content: string;
}

export const LEGAL_DOCUMENTS: LegalDocTemplate[] = [
  {
    id: 'termos-de-uso',
    title: 'Termos de Uso e Serviço da Plataforma Consuderme',
    category: 'institucional',
    shortDesc: 'Regras de acesso exclusivo para médicos, limitação estrita de responsabilidade da IA e condições dos planos.',
    content: `TERMOS DE USO E PRESTAÇÃO DE SERVIÇOS — CONSUDERME
Última Atualização: 2026

1. ACEITAÇÃO DOS TERMOS E CONDIÇÕES
O presente Termo de Uso e Serviço estabelece as condições jurídicas que regem o acesso e a utilização do ecossistema CONSUDERME, plataforma de consultório virtual, gestão de rotina clínica e copiloto de inteligência artificial voltada a Médicos Dermatologistas e Especialistas da Saúde da Pele. Ao se cadastrar e utilizar a plataforma, o USUÁRIO declara expressamente ter lido, compreendido e aceitado todos os termos aqui estipulados.

2. ELEGIBILIDADE E CADASTRO EXCLUSIVO DE PROFISSIONAIS MÉDICOS
2.1. O acesso ao CONSUDERME é estritamente restrito a profissionais médicos devidamente graduados e portadores de registro ativo junto ao Conselho Regional de Medicina (CRM) do respectivo estado brasileiro de atuação, bem como com Registro de Qualificação de Especialista (RQE) em Dermatologia, quando cabível.
2.2. O médico cadastrado é o único responsável pela veracidade, exatidão e atualização dos dados inseridos, respondendo civil, penal e eticamente por qualquer informação inverídica ou uso de credenciais de terceiros.

3. NATUREZA DA TECNOLOGIA E LIMITAÇÃO EXPRESSA DE RESPONSABILIDADE DA INTELIGÊNCIA ARTIFICIAL
3.1. SUPORTE À DECISÃO CLÍNICA: O CONSUDERME e seus algoritmos de Inteligência Artificial atuam exclusivamente como ferramentas auxiliares e de suporte operacional, bibliográfico e de produtividade à prática médica.
3.2. ATO MÉDICO INDELEGÁVEL: Nenhuma recomendação, cálculo, sugestão de diagnóstico diferencial, proposta de fórmula magistral ou protocolo de procedimento emitido pela plataforma substitui a avaliação clínica presencial, a anamnese física, a semiologia dermatológica, o raciocínio diagnóstico e a decisão terapêutica soberana do médico assistente.
3.3. A responsabilidade civil, ética e penal sobre o ato médico, prescrições farmacológicas, procedimentos invasivos e laudos emitidos é de responsabilidade única e exclusiva do profissional médico portador do CRM cadastrado, nos exatos termos do Código de Ética Médica e das resoluções do Conselho Federal de Medicina (CFM).

4. PLANOS DE ASSINATURA, PAGAMENTO E CANCELAMENTO
4.1. MODELOS DE PLANOS:
   - PLANO MENSAL: No valor de R$ 59,90 (cinquenta e nove reais e noventa centavos) por mês, com renovação automática a cada ciclo de 30 (trinta) dias.
   - PLANO ANUAL: No valor de R$ 599,00 (quinhentos e noventa e nove reais) por ano (equivalente a R$ 49,91/mês), cobrado à vista ou parcelado, com vigência de 12 (doze) meses.
4.2. RENOVAÇÃO E CANCELAMENTO: A renovação ocorre automaticamente na data de vencimento. O cancelamento pode ser solicitado a qualquer momento diretamente pelo painel administrativo ou canal de suporte, suspendendo novas cobranças a partir do ciclo subsequente.
4.3. DIREITO DE ARREPENDIMENTO: Em conformidade com o art. 49 do Código de Defesa do Consumidor, o assinante poderá exercer o direito de arrependimento no prazo de até 7 (sete) dias corridos após a primeira contratação, com estorno integral do valor pago.

5. PROPRIEDADE INTELECTUAL
Todos os softwares, códigos, algoritmos, marcas, logotipos, layouts e conteúdos do CONSUDERME são de titularidade exclusiva de seus desenvolvedores e protegidos pela legislação de propriedade industrial e direitos autorais.

6. FORO E LEGISLAÇÃO APLICÁVEL
Estes termos são regidos pelas leis da República Federativa do Brasil, em especial o Marco Civil da Internet (Lei nº 12.965/2014) e a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Fica eleito o Foro da Comarca de domicílio do prestador para dirimir quaisquer controvérsias oriundas deste instrumento.`
  },
  {
    id: 'politica-de-privacidade-lgpd',
    title: 'Política de Privacidade e Proteção de Dados (LGPD Médica)',
    category: 'privacidade_lgpd',
    shortDesc: 'Diretrizes de conformidade com a Lei 13.709/2018 para tratamento de dados sensíveis de saúde e prontuários.',
    content: `POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS PESSOAIS E SENSÍVEIS (LGPD MÉDICA) — CONSUDERME

1. COMPROMISSO INSTITUCIONAL COM A LGPD
A plataforma CONSUDERME atua em estrita conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei Federal nº 13.709/2018 - LGPD), o Marco Civil da Internet (Lei nº 12.965/2014) e as normas deontológicas do Conselho Federal de Medicina (CFM) referentes ao sigilo médico e guarda de prontuários.

2. DEFINIÇÃO E CATEGORIZAÇÃO DOS DADOS TRATADOS
2.1. DADOS CADASTRAIS DO MÉDICO (CONTROLADOR/OPERADOR): Nome completo, CRM/UF, RQE, CPF, e-mail institucional, endereço do consultório e telefone profissional.
2.2. DADOS SENSÍVEIS DE SAÚDE DOS PACIENTES (ART. 5º, II E ART. 11 DA LGPD): Informações clínicas inseridas pelo médico durante o atendimento (anamnese, histórico patológico, fototipo, dermatoscopia, prescrições e evoluções).

3. PRINCÍPIO DA ANONIMIZAÇÃO E PROCESSAMENTO SEGURO
3.1. Todo processamento de texto ou suporte algorítmico realizado por inteligência artificial é executado sob parâmetros que prezam pela desidentificação prévia dos dados pessoais dos pacientes.
3.2. As imagens clínicas ou lesões enviadas para análise dermatoscópica não devem conter feições faciais identificáveis sem máscara visual prévia, em respeito ao art. 11, § 4º da LGPD.

4. BASES LEGAIS PARA O TRATAMENTO DE DADOS
O tratamento de dados sensíveis de saúde no CONSUDERME fundamenta-se nas seguintes hipóteses legais da LGPD:
a) Tutela da Saúde, em procedimento realizado exclusivamente por profissionais de saúde ou entidades sanitárias (Art. 11, II, 'f');
b) Cumprimento de obrigação legal ou regulatória pelo controlador (Art. 7º, II e Art. 11, II, 'a' c/c Resoluções CFM sobre prontuário médico);
c) Execução de contrato ou de procedimentos preliminares a pedido do titular (Art. 7º, V).

5. CRIPTOGRAFIA E MEDIDAS TÉCNICAS DE SEGURANÇA
5.1. Todos os dados trafegam por canais seguros e criptografados (protocolo TLS 1.3 / HTTPS).
5.2. As credenciais e chaves de acesso são mantidas em ambiente de nuvem seguro com controle rigoroso de privilégios de acesso (Zero Trust Architecture).

6. DIREITOS DOS TITULARES DE DADOS (ART. 18 DA LGPD)
O médico e seus pacientes têm garantidos os direitos de:
- Confirmação da existência de tratamento;
- Acesso aos dados e exportação em formato interoperável;
- Correção de dados incompletos, inexatos ou desatualizados;
- Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;
- Revogação do consentimento, ressalvada a obrigação legal médica de guarda de prontuário por 20 anos (Lei 13.787/2018).

7. ENCARREGADO DE PROTEÇÃO DE DADOS (DPO)
Para exercer seus direitos ou esclarecer dúvidas sobre esta Política, o titular poderá entrar em contato com o Encarregado de Proteção de Dados através do canal oficial de privacidade da plataforma.`
  },
  {
    id: 'tcle-toxina-botulinica',
    title: 'TCLE — Aplicação de Toxina Botulínica Tipo A',
    category: 'tcle',
    shortDesc: 'Termo de Consentimento Livre e Esclarecido completo para aplicação de Toxina Botulínica.',
    content: `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (TCLE)
PROCEDIMENTO: APLICAÇÃO DE TOXINA BOTULÍNICA TIPO A

DADOS DO PACIENTE:
Nome Completo: [NOME DO PACIENTE]
CPF: [CPF DO PACIENTE]      Data de Nasc.: [DATA DE NASCIMENTO]
Médico(a) Responsável: [NOME DO MÉDICO] — CRM/[UF]: [CRM]

1. ESCLARECIMENTOS SOBRE O PROCEDIMENTO
Declaro que fui devidamente informado(a) pelo(a) médico(a) acima qualificado(a) sobre a aplicação de Toxina Botulínica Tipo A. Fui esclarecido(a) de que se trata de uma medicação biológica injetável que atua bloqueando temporariamente a liberação de acetilcolina na junção neuromuscular, reduzindo a contração muscular excessiva e suavizando rugas dinâmicas e linhas de expressão (ex: testa, glabela, pés de galinha).

2. TEMPORALIDADE E RESULTADOS ESPERADOS
Fui informado(a) de que:
a) O início de ação do produto ocorre entre 48 a 72 horas, com pico de efeito máximo entre 14 e 21 dias;
b) A duração média do efeito é de aproximadamente 3 a 5 meses, variando conforme metabolismo individual, dose administrada e prática de atividade física intensa;
c) O procedimento NÃO é definitivo e exige reaplicações periódicas para manutenção do resultado;
d) Poderá haver necessidade de consulta de revisão entre o 15º e o 21º dia para eventuais ajustes pontuais.

3. RISCOS, EFEITOS ADVERSOS E REAÇÕES ESPERADAS
Estou ciente de que, embora seja um procedimento seguro, podem ocorrer os seguintes efeitos transitórios:
- Eritema (vermelhidão), edema (inchaço) leve e pequenas pápulas nos pontos de puntura;
- Hematomas, equimoses (manchas roxas) e dor local passageira;
- Cefaleia (dor de cabeça) leve nas primeiras 24-48 horas;
- Em casos raros: assimetria facial temporária, ptose palpebral (queda temporária da pálpebra superior) ou ptose de sobrancelha (reversíveis com colírios específicos e tempo).

4. CONTRAINDICAÇÕES CONFIRMADAS
Declaro expressamente que NÃO sou portador(a) de doenças neuromusculares (como Miastenia Gravis, Síndrome de Eaton-Lambert, ELA), NÃO estou gestante nem em período de amamentação, e NÃO possuo infecção ativa na pele no local da aplicação.

5. ORIENTAÇÕES PÓS-PROCEDIMENTO
Comprometo-me a seguir rigorosamente as orientações:
- NÃO deitar ou inclinar a cabeça bruscamente nas primeiras 4 horas;
- NÃO massagear ou esfregar com força a região tratada nas primeiras 24 horas;
- NÃO praticar exercícios físicos intensos nas primeiras 24 horas;
- Evitar exposição solar direta e calor intenso (sauna) enquanto houver hematomas.

DECLARAÇÃO FINAL:
Tive a oportunidade de fazer todas as perguntas necessárias, as quais foram respondidas com clareza. Estando plenamente consciente e de acordo, firmo o presente termo.

Local e Data: _______________________, _____ de ______________ de 2026.

________________________________________          ________________________________________
Assinatura do(a) Paciente / Responsável             Assinatura e Carimbo do(a) Médico(a)`
  },
  {
    id: 'tcle-acido-hialuronico',
    title: 'TCLE — Preenchimento com Ácido Hialurônico',
    category: 'tcle',
    shortDesc: 'Termo de Consentimento para preenchimento dérmico e volumização com Ácido Hialurônico.',
    content: `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (TCLE)
PROCEDIMENTO: PREENCHIMENTO CUTÂNEO COM ÁCIDO HIALURÔNICO

DADOS DO PACIENTE:
Nome Completo: [NOME DO PACIENTE]
CPF: [CPF DO PACIENTE]      Data de Nasc.: [DATA DE NASCIMENTO]
Médico(a) Responsável: [NOME DO MÉDICO] — CRM/[UF]: [CRM]

1. NATUREZA DO PROCEDIMENTO
Declaro que fui informado(a) sobre o preenchimento com Ácido Hialurônico reticulado, um gel biocompatível e reabsorvível utilizado para restauração de volumes perdidos, sustentação facial, contorno mandibular, melhora de sulcos (ex: nasogeniano/marionete) e volumização labial.

2. DURABILIDADE E MANUTENÇÃO
O produto é reabsorvido naturalmente pelo organismo. Sua durabilidade varia de 9 a 18 meses, dependendo da densidade do gel, plano anatômico de injeção, área anatômica e taxa metabólica individual.

3. RISCOS E EFEITOS COLATERAIS
Fui esclarecido(a) de que podem ocorrer:
- Edema (inchaço), eritema, sensibilidade dolorosa local e equimoses/hematomas nos primeiros dias;
- Assimetrias temporárias secundárias ao edema;
- Nódulos palpáveis ou visíveis (efeito Tyndall), passíveis de dissolução com hialuronidase;
- RISCO DE COMPLICAÇÃO VASCULAR: Em casos raros, a injeção intravascular ou compressão de vasos sanguíneos pode causar isquemia tecidual, necrose cutânea ou alterações visuais. O(A) médico(a) dispõe de treinamento e estoque de Hialuronidase para intervenção imediata caso ocorra qualquer sinal de alerta.

4. CUIDADOS PÓS-APLICAÇÃO
- Evitar manipulação vigorosa do local por 48 horas;
- Não praticar atividade física intensa por 24-48 horas;
- Aplicar compressas frias conforme prescrição médica;
- Entrar em contato IMEDIATO com a clínica caso sinta dor intensa progressiva, note palidez extrema da pele, manchas arroxeadas ou vesículas.

Local e Data: _______________________, _____ de ______________ de 2026.

________________________________________          ________________________________________
Assinatura do(a) Paciente / Responsável             Assinatura e Carimbo do(a) Médico(a)`
  },
  {
    id: 'tcle-bioestimuladores',
    title: 'TCLE — Bioestimuladores de Colágeno (PLLA / CaHA)',
    category: 'tcle',
    shortDesc: 'Termo de Consentimento para bioestimulação de colágeno (Ácido Poli-L-Lático e Hidroxiapatita de Cálcio).',
    content: `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (TCLE)
PROCEDIMENTO: BIOESTIMULADOR DE COLÁGENO (ÁCIDO POLI-L-LÁTICO / HIDROXIAPATITA DE CÁLCIO)

DADOS DO PACIENTE:
Nome Completo: [NOME DO PACIENTE]
CPF: [CPF DO PACIENTE]      Data de Nasc.: [DATA DE NASCIMENTO]
Médico(a) Responsável: [NOME DO MÉDICO] — CRM/[UF]: [CRM]

1. ESPECIFICAÇÕES DO TRATAMENTO
Declaro que compreendi que os bioestimuladores de colágeno (como PLLA ou CaHA) são substâncias biocompatíveis que estimulam fibroblastos autólogos a produzir novo colágeno tipo I e III ao longo de semanas a meses. O resultado não é imediato, desenvolvendo-se progressivamente a partir de 30 a 90 dias após a sessão, podendo exigir de 1 a 3 sessões conforme plano de tratamento.

2. CUIDADOS ESPECÍFICOS (REGRA DA MASSAGEM)
Para produtos à base de PLLA, fui orientado(a) a realizar a regra de massagem domiciliar (ex: 5 minutos, 5 vezes ao dia, durante 5 dias) para garantir distribuição uniforme das micropartículas e prevenir formação de nódulos ou granulomas.

3. REAÇÕES ADVERSAS
São esperados edema transitório, eritema, hematomas nos orifícios de entrada de cânula. Formação de pápulas ou pequenos nódulos dérmicos tardios podem ocorrer raramente e devem ser avaliados pelo médico.

Local e Data: _______________________, _____ de ______________ de 2026.

________________________________________          ________________________________________
Assinatura do(a) Paciente / Responsável             Assinatura e Carimbo do(a) Médico(a)`
  },
  {
    id: 'tcle-peelings-quimicos',
    title: 'TCLE — Peelings Químicos Faciais e Corporais',
    category: 'tcle',
    shortDesc: 'Termo de Consentimento para aplicação de peelings superficiais, médios e combinados.',
    content: `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (TCLE)
PROCEDIMENTO: PEELING QUÍMICO DERMATOLÓGICO

DADOS DO PACIENTE:
Nome Completo: [NOME DO PACIENTE]
CPF: [CPF DO PACIENTE]      Data de Nasc.: [DATA DE NASCIMENTO]
Médico(a) Responsável: [NOME DO MÉDICO] — CRM/[UF]: [CRM]

1. DESCRIÇÃO
O peeling químico consiste na aplicação controlada de agentes esfoliantes químicos (ex: Ácido Retinóico, Glicólico, Salicílico, Mandélico, TCA ou Solução de Jessner) para promover renovação celular, tratamento de acne, hiperpigmentações (melasma), textura e fotoenvelhecimento.

2. EVOLUÇÃO PÓS-PEELING
A pele apresentará eritema, sensação de calor/ardência e processo de descamação visível que dura em média de 3 a 10 dias.
PROIBIÇÃO RIGOROSA: Fui instruído(a) a JAMAIS puxar ou arrancar as crostas/peles que estiverem descamando, sob risco de hiperpigmentação pós-inflamatória (manchas escuras) ou cicatrizes.

3. FOTOPROTEÇÃO E RESTRIÇÃO SOLAR
A proteção solar rigorosa é indispensável (FPS 50+ de amplo espectro com reaplicação a cada 2-3 horas). É proibida qualquer exposição solar intencional ou bronzeamento durante todo o período de tratamento.

Local e Data: _______________________, _____ de ______________ de 2026.

________________________________________          ________________________________________
Assinatura do(a) Paciente / Responsável             Assinatura e Carimbo do(a) Médico(a)`
  },
  {
    id: 'tcle-pequenas-cirurgias-biopsia',
    title: 'TCLE — Biópsias Cutâneas e Pequenas Cirurgias Dermatológicas',
    category: 'tcle',
    shortDesc: 'Termo para biópsia por punch/shave, excisão de lesões neoplásicas/benignas e eletrocauterização.',
    content: `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (TCLE)
PROCEDIMENTO: BIÓPSIA CUTÂNEA / PEQUENA CIRURGIA DERMATOLÓGICA (PUNCH / SHAVE / EXCISÃO)

DADOS DO PACIENTE:
Nome Completo: [NOME DO PACIENTE]
CPF: [CPF DO PACIENTE]      Data de Nasc.: [DATA DE NASCIMENTO]
Médico(a) Responsável: [NOME DO MÉDICO] — CRM/[UF]: [CRM]

1. OBJETIVO DO PROCEDIMENTO
Declaro que fui informado(a) sobre a necessidade da realização de biópsia cutânea / exérese cirúrgica de lesão de pele para diagnóstico histopatológico definitivo e/ou tratamento curativo de lesões cutâneas suspeitas (benignas, pré-malignas ou neoplásicas como CBC, CEC, Melanoma).

2. ANESTESIA LOCAL E TÉCNICA CIRÚRGICA
Será administrada anestesia infiltrativa local (Lidocaína com ou sem vasoconstritor). Fui advertido(a) de que todo procedimento cirúrgico cutâneo resulta em uma cicatriz definitiva, cuja qualidade estética depende de fatores intrínsecos de cicatrização (podendo ocorrer queloides ou cicatrizes hipertróficas).

3. EXAME ANATOMOPATOLÓGICO
Estou ciente de que a peça cirúrgica removida será encaminhada a laboratório de patologia para laudo microscópico, cujos custos laboratoriais são independentes do ato cirúrgico inicial.

Local e Data: _______________________, _____ de ______________ de 2026.

________________________________________          ________________________________________
Assinatura do(a) Paciente / Responsável             Assinatura e Carimbo do(a) Médico(a)`
  },
  {
    id: 'quem-somos-sobre',
    title: 'Página "Quem Somos / Sobre o Consuderme"',
    category: 'institucional',
    shortDesc: 'Apresentação institucional da plataforma, autoridade tecnológica, precisão clínica e transparência.',
    content: `QUEM SOMOS — CONSUDERME: A PLATAFORMA INTEGRADA DO DERMATOLOGISTA

O CONSUDERME nasceu da convergência entre a excelência da prática dermatológica brasileira e as fronteiras mais avançadas da inteligência artificial aplicada à medicina.

NOSSA MISSÃO:
Capacitar médicos dermatologistas e especialistas da saúde da pele com uma infraestrutura tecnológica completa, segura e 100% regulamentada, elevando a produtividade do consultório, reduzindo o tempo despendido em tarefas burocráticas e fornecendo suporte analítico de alta fidelidade para o raciocínio clínico.

PILARES FUNDAMENTAIS:
1. RIGOR ÉTICO E MÉDICO (CFM & SBD): Toda a arquitetura do Consuderme foi concebida sob os preceitos do Código de Ética Médica e das resoluções do Conselho Federal de Medicina sobre telemedicina e uso de tecnologia em saúde. A soberania do diagnóstico e da conduta permanece integralmente sob a autoridade do médico.
2. PRIVACIDADE E SEGURANÇA MÁXIMA (LGPD SENSÍVEL): Protegemos os dados de saúde com criptografia militar de ponta a ponta e fluxos de desidentificação de lesões, assegurando sigilo profissional inabalável.
3. COPILOTO CLÍNICO DE ALTA PRECISÃO: Inteligência artificial afinada com semiologia dermatológica, fototipos de Fitzpatrick, farmácia galênica magistral, dosimetria de injetáveis e protocolos de segurança em oncologia cutânea.
4. GESTÃO E CONFORMIDADE SEM FRICÇÃO: Geração instantânea de termos de consentimento (TCLE), prontuários padronizados, atestados, receituários especiais e controle financeiro de procedimentos.`
  },
  {
    id: 'politica-seguranca-disclaimer-cfm',
    title: 'Política de Segurança da Informação e Disclaimer CFM',
    category: 'seguranca_cfm',
    shortDesc: 'Aviso regulatório obrigatório sobre o uso de IA na medicina conforme Resolução CFM nº 2.314/2022.',
    content: `POLÍTICA DE SEGURANÇA DA INFORMAÇÃO E ISENÇÃO DE RESPONSABILIDADE MÉDICA (DISCLAIMER REGULATÓRIO CFM)

AVISO LEGAL OBRIGATÓRIO CONFORME DIRETRIZES DO CONSELHO FEDERAL DE MEDICINA (CFM):

1. NATUREZA EXCLUSIVAMENTE AUXILIAR DA INTELIGÊNCIA ARTIFICIAL:
O CONSUDERME integra algoritmos de inteligência artificial generativa e redes neurais que operam estritamente como ferramenta de apoio à decisão clínica e otimização da rotina de documentação do consultório médico.

2. VEDAÇÃO DE CONSULTA AUTOMATIZADA DIRETA A LEIGOS:
Esta plataforma NÃO fornece atendimento médico autônomo a pacientes nem realiza consultas médicas automatizadas. O uso da plataforma é privativo de médicos devidamente habilitados e credenciados junto ao CRM.

3. INDEPENDÊNCIA E SOBERANIA DO ATO MÉDICO:
Nos termos da Resolução CFM nº 2.314/2022 (Regulamentação da Telemedicina) e pareceres correlatos:
a) A inteligência artificial não possui registro profissional nem autonomia jurídica para prescrever, laudar ou determinar condutas;
b) Qualquer informação sugerida pelo sistema (incluindo hipóteses diagnósticas, formulações magistrais, dosagens de toxina e mapas anatômicos) deve ser criticada, revisada, validada e assumida pelo médico assistente antes de qualquer aplicação em pacientes reais;
c) O médico assistente assume integral responsabilidade técnica, cível e ético-disciplinar sobre todas as decisões clínicas e documentos assinados.

4. SEGURANÇA CIBERNÉTICA E BACKUPS:
A plataforma adota padrões internacionais de segurança da informação (ISO/IEC 27001 e SOC 2), com rotinas automatizadas de redundância e salvaguarda contínua de integridade de dados.`
  }
];
