/**
 * Conteúdo fictício para demonstração. Nomes de pessoas e instituições são inventados.
 */
export const SEED_CATEGORIES = [
  { name: "Política", slug: "politica", description: "Poder público, eleições e gestão." },
  { name: "Economia", slug: "economia", description: "Mercado, emprego, negócios e consumo." },
  { name: "Cidades", slug: "cidades", description: "O dia a dia do Recife, Região Metropolitana e interior." },
  { name: "Esportes", slug: "esportes", description: "Futebol pernambucano e outras modalidades." },
  { name: "Cultura", slug: "cultura", description: "Música, festas, cinema e literatura." },
  { name: "Tecnologia", slug: "tecnologia", description: "Inovação, startups e o Porto Digital." },
] as const;

type SeedArticle = {
  category: (typeof SEED_CATEGORIES)[number]["slug"];
  title: string;
  excerpt: string;
  paragraphs: string[];
  tags?: string[];
  featured?: boolean;
  status?: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
  by?: "admin" | "editor" | "reporter";
};

export const SEED_ARTICLES: SeedArticle[] = [
  {
    category: "cidades", featured: true, by: "editor", tags: ["Recife", "Mobilidade"],
    title: "Recife anuncia nova linha de BRT ligando a Zona Oeste ao Centro",
    excerpt: "Corredor de 14 km deve reduzir em até 25 minutos o tempo de deslocamento de quem sai da Várzea em direção ao centro da cidade.",
    paragraphs: [
      "A Prefeitura do Recife apresentou nesta manhã o projeto de uma nova linha de BRT que vai conectar a Zona Oeste ao Centro. O corredor terá 14 quilômetros de extensão e 18 estações, com previsão de início das obras para o primeiro semestre do próximo ano.",
      "Segundo a secretaria responsável, a estimativa é que o novo trajeto reduza em até 25 minutos o tempo médio de deslocamento nos horários de pico. A linha deve atender cerca de 90 mil passageiros por dia útil.",
      "O projeto prevê ainda ciclofaixas ao longo de todo o corredor e a requalificação das calçadas no entorno das estações, atendendo a uma demanda antiga de moradores dos bairros atendidos.",
    ],
  },
  {
    category: "economia", featured: true, by: "editor", tags: ["Emprego", "Indústria"],
    title: "Polo industrial de Suape abre 2 mil vagas temporárias para o fim do ano",
    excerpt: "Oportunidades estão concentradas nas áreas de logística, operação de máquinas e manutenção; inscrições vão até o fim do mês.",
    paragraphs: [
      "Empresas instaladas no complexo industrial portuário de Suape vão contratar cerca de 2 mil trabalhadores temporários até dezembro. A maior parte das vagas está nas áreas de logística, operação de empilhadeiras e manutenção industrial.",
      "De acordo com a associação das empresas do polo, a demanda é puxada pelo aumento da movimentação de cargas no último trimestre. Parte das contratações pode ser efetivada após o período de experiência.",
      "Os interessados devem se cadastrar nas agências de emprego do estado. Há vagas para candidatos sem experiência, com treinamento oferecido pelas próprias empresas.",
    ],
  },
  {
    category: "esportes", featured: true, by: "reporter", tags: ["Futebol", "Série B"],
    title: "Com gol nos acréscimos, Leão do Agreste vence e entra no G-4",
    excerpt: "Vitória por 2 a 1 diante de mais de 20 mil torcedores recoloca o time na briga pelo acesso a três rodadas do fim da competição.",
    paragraphs: [
      "Em uma noite de muita emoção, o Leão do Agreste venceu por 2 a 1 e voltou ao grupo dos quatro primeiros colocados. O gol da vitória saiu aos 49 minutos do segundo tempo, de cabeça, após cobrança de escanteio.",
      "O técnico elogiou a entrega do elenco e destacou a força da torcida, que lotou as arquibancadas mesmo com a chuva que caiu durante boa parte da partida.",
      "Restando três rodadas, a equipe depende apenas de si para garantir o acesso. O próximo compromisso é fora de casa, no sábado.",
    ],
  },
  {
    category: "tecnologia", by: "editor", tags: ["Startups", "Porto Digital", "Inteligência Artificial"],
    title: "Startup pernambucana de IA para o agronegócio recebe aporte de R$ 8 milhões",
    excerpt: "Empresa nascida em incubadora do Porto Digital usa visão computacional para prever pragas em plantações do semiárido.",
    paragraphs: [
      "Uma startup criada no ecossistema do Porto Digital recebeu um aporte de R$ 8 milhões para expandir sua plataforma de inteligência artificial voltada ao agronegócio.",
      "A solução utiliza imagens de drones e satélites para identificar sinais precoces de pragas e estresse hídrico em lavouras, com foco em pequenos e médios produtores do semiárido.",
      "Com os recursos, a empresa pretende dobrar a equipe de engenharia e chegar a outros três estados do Nordeste ao longo do próximo ano.",
    ],
  },
  {
    category: "cultura", by: "reporter", tags: ["Música", "Frevo"],
    title: "Festival reúne 40 orquestras de frevo no Marco Zero neste fim de semana",
    excerpt: "Programação gratuita celebra o gênero, Patrimônio Imaterial da Humanidade, com oficinas de passo e apresentações para crianças.",
    paragraphs: [
      "O Marco Zero recebe neste sábado e domingo um festival com 40 orquestras de frevo de diferentes cidades do estado. A programação é gratuita e começa às 16h nos dois dias.",
      "Além dos shows, o evento terá oficinas de passo, exposição de estandartes e uma tenda dedicada ao público infantil.",
      "A organização espera um público de 60 mil pessoas e recomenda o uso de transporte público para acessar o Bairro do Recife.",
    ],
  },
  {
    category: "politica", by: "editor", tags: ["Assembleia Legislativa", "Educação"],
    title: "Assembleia aprova projeto que amplia ensino integral no interior",
    excerpt: "Proposta prevê 120 novas escolas em tempo integral até 2028, com prioridade para municípios do Agreste e do Sertão.",
    paragraphs: [
      "A Assembleia Legislativa aprovou em segunda votação o projeto que amplia a rede de escolas em tempo integral no interior do estado. O texto segue agora para sanção.",
      "A proposta prevê a criação de 120 novas unidades até 2028, com prioridade para municípios com menores índices de desenvolvimento da educação básica.",
      "Parlamentares da base e da oposição destacaram a importância da medida, mas cobraram transparência no cronograma de obras e na contratação de professores.",
    ],
  },
  {
    category: "cidades", by: "reporter", tags: ["Clima", "Chuvas"],
    title: "Defesa Civil emite alerta de chuvas moderadas para a Região Metropolitana",
    excerpt: "Acumulados podem chegar a 60 mm em 24 horas; moradores de áreas de encosta devem ficar atentos às sirenes.",
    paragraphs: [
      "A Defesa Civil emitiu alerta de chuvas moderadas a fortes para os municípios da Região Metropolitana do Recife nas próximas 48 horas.",
      "A orientação é que moradores de áreas de risco fiquem atentos aos avisos sonoros e, em caso de emergência, procurem os pontos de apoio indicados pelas prefeituras.",
      "O telefone 199 funciona 24 horas para solicitações e denúncias de situações de risco.",
    ],
  },
  {
    category: "economia", by: "editor", tags: ["Consumo", "Varejo"],
    title: "Vendas do varejo crescem 6% no estado e superam a média nacional",
    excerpt: "Setores de móveis, eletrodomésticos e farmácias puxaram o resultado do trimestre, segundo levantamento da federação do comércio.",
    paragraphs: [
      "O varejo pernambucano registrou crescimento de 6% no último trimestre na comparação com o mesmo período do ano anterior, acima da média nacional.",
      "Os segmentos de móveis e eletrodomésticos, farmácias e supermercados foram os principais responsáveis pela alta.",
      "Para o fim do ano, a expectativa da federação do comércio é de contratação de 9 mil trabalhadores temporários.",
    ],
  },
  {
    category: "esportes", by: "reporter", tags: ["Vôlei"],
    title: "Seleção pernambucana de vôlei sub-17 conquista título regional invicta",
    excerpt: "Equipe venceu todas as seis partidas do torneio disputado em Caruaru e garantiu vaga no campeonato brasileiro.",
    paragraphs: [
      "A seleção pernambucana sub-17 de vôlei feminino conquistou o título do campeonato regional sem perder nenhuma partida.",
      "Disputado em Caruaru, o torneio reuniu oito estados do Nordeste. A final foi vencida por 3 sets a 1.",
      "Com o resultado, a equipe garantiu vaga no campeonato brasileiro da categoria, previsto para março.",
    ],
  },
  {
    category: "tecnologia", by: "reporter", tags: ["Educação", "Programação"],
    title: "Escolas técnicas do interior lançam trilha gratuita de programação para jovens",
    excerpt: "Curso de 200 horas é voltado a estudantes do ensino médio e inclui projeto prático com empresas parceiras.",
    paragraphs: [
      "Escolas técnicas de cidades do Agreste e do Sertão vão oferecer uma trilha gratuita de programação para estudantes do ensino médio da rede pública.",
      "O curso tem 200 horas e aborda lógica, desenvolvimento web e banco de dados. Ao final, os alunos desenvolvem um projeto real proposto por empresas parceiras.",
      "As inscrições abrem na próxima semana e são limitadas a 600 vagas.",
    ],
  },
  {
    category: "cultura", by: "editor", tags: ["Cinema"],
    title: "Filme gravado no Sertão é selecionado para festival internacional",
    excerpt: "Longa de diretora estreante acompanha três gerações de mulheres em uma comunidade rural e foi filmado com elenco local.",
    paragraphs: [
      "Um longa-metragem gravado inteiramente no Sertão pernambucano foi selecionado para a mostra competitiva de um festival internacional de cinema.",
      "Dirigido por uma cineasta estreante, o filme acompanha três gerações de mulheres de uma mesma família e conta com elenco formado majoritariamente por moradores da região.",
      "A produção recebeu apoio de editais estaduais de fomento ao audiovisual.",
    ],
  },
  {
    category: "politica", by: "editor", tags: ["Saúde", "Orçamento"],
    title: "Governo do estado anuncia R$ 300 milhões para hospitais regionais",
    excerpt: "Recursos serão aplicados em reforma, compra de equipamentos e abertura de 400 novos leitos ao longo de dois anos.",
    paragraphs: [
      "O governo estadual anunciou investimento de R$ 300 milhões na rede de hospitais regionais. O plano inclui reformas estruturais, compra de equipamentos e abertura de leitos.",
      "Ao todo, devem ser criados 400 novos leitos, sendo 80 de UTI, distribuídos entre as macrorregiões de saúde.",
      "A primeira etapa contempla unidades do Agreste e tem início previsto para o próximo mês.",
    ],
  },
  {
    category: "cidades", by: "editor", tags: ["Recife", "Meio ambiente"],
    title: "Parque linear às margens do Capibaribe ganha novo trecho de 3 km",
    excerpt: "Área conta com pista de caminhada, ciclovia, mirantes e espaços de convivência; entrega foi feita após 18 meses de obras.",
    paragraphs: [
      "Um novo trecho de 3 quilômetros do parque linear às margens do rio Capibaribe foi entregue à população.",
      "O espaço tem pista de caminhada, ciclovia, mirantes, academias ao ar livre e áreas de convivência com iluminação em LED.",
      "Ambientalistas destacam o ganho de áreas verdes e a recuperação de parte da mata ciliar ao longo do percurso.",
    ],
  },
  {
    category: "economia", by: "reporter", tags: ["Turismo"],
    title: "Taxa de ocupação hoteleira deve passar de 85% no litoral sul no verão",
    excerpt: "Setor projeta temporada aquecida com aumento de voos para o Recife e eventos programados para dezembro e janeiro.",
    paragraphs: [
      "A rede hoteleira do litoral sul projeta ocupação acima de 85% durante a alta temporada de verão.",
      "O aumento da oferta de voos diretos para o Recife e a agenda de eventos estão entre os fatores que explicam o otimismo do setor.",
      "Empresários recomendam que turistas antecipem reservas, especialmente para o período de festas de fim de ano.",
    ],
  },
  {
    category: "esportes", by: "editor", tags: ["Corrida", "Recife"],
    title: "Meia maratona do Recife deve reunir 12 mil corredores em dezembro",
    excerpt: "Percurso passa pela orla de Boa Viagem e pelo Bairro do Recife; inscrições estão no último lote.",
    paragraphs: [
      "A meia maratona do Recife, marcada para dezembro, deve reunir 12 mil corredores, recorde da prova.",
      "O percurso de 21 km passa pela orla de Boa Viagem, pela Avenida Agamenon Magalhães e termina no Bairro do Recife.",
      "Haverá ainda provas de 5 e 10 km, além de uma corrida infantil no dia anterior.",
    ],
  },
  {
    category: "tecnologia", by: "editor", tags: ["Segurança digital"],
    title: "Golpes por mensagem crescem 30%; especialistas dão dicas de proteção",
    excerpt: "Ativar a verificação em duas etapas e desconfiar de pedidos urgentes de dinheiro são as principais recomendações.",
    paragraphs: [
      "O número de golpes aplicados por aplicativos de mensagem cresceu 30% no último ano, segundo levantamento de delegacias especializadas.",
      "Especialistas recomendam ativar a verificação em duas etapas, não compartilhar códigos recebidos por SMS e confirmar por ligação qualquer pedido de dinheiro feito por familiares.",
      "Vítimas devem registrar boletim de ocorrência e comunicar imediatamente o banco.",
    ],
  },
  {
    category: "cultura", by: "reporter", tags: ["Literatura", "Caruaru"],
    title: "Feira literária de Caruaru homenageia cordelistas do Agreste",
    excerpt: "Evento terá 80 autores convidados, rodas de repente e lançamento de antologia com textos de estudantes da rede pública.",
    paragraphs: [
      "A feira literária de Caruaru deste ano homenageia os cordelistas do Agreste, com exposições e lançamentos de folhetos.",
      "A programação reúne 80 autores convidados, rodas de repente e oficinas de xilogravura.",
      "Uma antologia com textos de estudantes da rede pública será lançada na abertura do evento.",
    ],
  },
  {
    category: "politica", by: "admin", status: "ARCHIVED", tags: ["Eleições"],
    title: "Câmara do Recife divulga calendário de audiências do orçamento",
    excerpt: "População poderá sugerir prioridades para o próximo ano em encontros presenciais nas seis regiões da cidade.",
    paragraphs: [
      "A Câmara Municipal divulgou o calendário de audiências públicas para discussão do orçamento do próximo ano.",
      "Serão seis encontros, um em cada região político-administrativa da cidade, abertos à participação da população.",
      "As sugestões serão sistematizadas e encaminhadas à comissão de finanças.",
    ],
  },
  {
    category: "cidades", by: "reporter", status: "IN_REVIEW", tags: ["Saneamento"],
    title: "Obras de saneamento chegam a mais 12 bairros de Olinda",
    excerpt: "Investimento vai beneficiar cerca de 40 mil moradores com coleta e tratamento de esgoto até o fim de 2027.",
    paragraphs: [
      "Mais 12 bairros de Olinda vão receber obras de esgotamento sanitário, beneficiando cerca de 40 mil moradores.",
      "O cronograma prevê a conclusão das intervenções até o fim de 2027, com instalação de redes coletoras e uma nova estação elevatória.",
      "Durante as obras, haverá desvios de trânsito que serão informados com antecedência.",
    ],
  },
  {
    category: "economia", by: "reporter", status: "IN_REVIEW", tags: ["Agricultura"],
    title: "Safra de uva do Vale do São Francisco deve crescer 15%",
    excerpt: "Produtores apostam em novas variedades sem semente para ampliar exportações para a Europa e os Estados Unidos.",
    paragraphs: [
      "A safra de uva do Vale do São Francisco deve crescer 15% neste ano, segundo associações de produtores.",
      "O avanço se deve principalmente à adoção de novas variedades sem semente, mais valorizadas no mercado externo.",
      "Petrolina e cidades vizinhas concentram a maior parte da produção do estado.",
    ],
  },
  {
    category: "esportes", by: "reporter", status: "DRAFT",
    title: "Rascunho: bastidores da preparação para o clássico de domingo",
    excerpt: "Matéria em construção com entrevistas de jogadores e comissão técnica sobre a semana de treinos.",
    paragraphs: [
      "Texto em produção. Faltam as entrevistas com a comissão técnica e a confirmação da escalação provável.",
      "A equipe deve fazer o último treino fechado na sexta-feira.",
    ],
  },
  {
    category: "tecnologia", by: "reporter", status: "DRAFT",
    title: "Rascunho: como funcionam os semáforos inteligentes testados no Recife",
    excerpt: "Pauta sobre o piloto de semáforos que ajustam o tempo de abertura de acordo com o fluxo de veículos.",
    paragraphs: [
      "Texto em produção. Aguardando retorno da autarquia de trânsito com os dados do período de testes.",
      "O sistema usa sensores e câmeras para ajustar automaticamente os ciclos de cada cruzamento.",
    ],
  },
];
