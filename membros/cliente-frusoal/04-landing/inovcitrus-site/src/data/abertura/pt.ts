import type { AberturaContent } from './types';

export const aberturaPT: AberturaContent = {
  metaTitle: 'Pedro, isto é para si · Frusoal InovCitrus',
  metaDescription:
    'Trabalho preparado por Eurico Alves para Pedro Madeira sobre a Frusoal InovCitrus — sem briefing, sem proposta, só estudo a sério. Acesso integral a site, PDFs, roadmap e fontes.',

  hero: {
    greeting: 'Pedro,',
    message: 'isto é para si.',
    context:
      'Uma curiosidade minha que ganhou corpo. Sem briefing, sem proposta, sem contrato. Só trabalho a sério sobre a Frusoal — para lhe mostrar.'
  },

  beats: [
    {
      number: 1,
      heading: 'Conhecemo-nos há demasiado tempo para eu lhe dar um currículo.',
      paragraphs: [
        'Mas há uma parte do que ando a fazer que provavelmente não lhe chegou. Há alguns anos, dediquei-me a sério a inteligência artificial — não a ler sobre, a aplicar. Construí ferramentas, formei uma comunidade, e ando a ajudar empresas portuguesas a introduzir IA nos seus processos.',
        'É essa parte que falta entre o que sabe de mim e o que está a ler aqui.'
      ]
    },
    {
      number: 2,
      heading: 'O que faço chama-se [IA]AVANÇADA PT.',
      paragraphs: [
        'O propósito é simples: ajudar empresas portuguesas com tradição e dimensão a integrar inteligência artificial nos seus processos — de forma faseada, plurianual, sem disrupção operacional.',
        'Não vendo ferramentas. Não vendo cursos. Trabalho lado a lado com quem decide: estudo o sector, mapeio o que existe, desenho onde a IA pode entrar, e acompanho a implementação. É consultoria. Não é venda.'
      ]
    },
    {
      number: 3,
      heading: 'Para perceber até onde conseguia chegar, escolhi três escalas de empresa.',
      paragraphs: [
        'Pequena, média, grande. Em cada uma, fiz pesquisa de mercado interna — não para vender a essas empresas, para medir-me a mim. Para perceber se o que faço aguenta empresas pequenas, médias e grandes — ou se há um tecto.',
        'Foi assim que cheguei à Frusoal. Não foi a Frusoal que me chegou.'
      ]
    },
    {
      number: 4,
      heading: 'A Frusoal entrou na pesquisa como a "régua difícil".',
      paragraphs: [
        'Maior Organização de Produtores de Citrinos de Portugal. Mais de 150 funcionários. Mil e quinhentos hectares cultivados. Quarenta mil toneladas por ano. Trinta e cinco anos operacionais. Certificações sólidas — GlobalG.A.P., GRASP, IGP Citrinos do Algarve. E, sobretudo, uma empresa que defende causas que respeito: rastreabilidade, qualidade, sustentabilidade do Sotavento.',
        'Não foi escolha leve. Foi escolha consciente.'
      ]
    },
    {
      number: 5,
      heading: 'Quando comecei a estudar a Frusoal, a coisa cresceu.',
      paragraphs: [
        'Encontrei o InovCitrus que acabaram de lançar — o projecto trienal sobre Scirtothrips aurantii, a parceria com a InnovPlantProtect, o desenho científico, a visão a 36 meses. Imaginei como a IA podia encaixar nesse processo — sem disrupção, em horizonte plurianual, alinhada ao desenho científico que já têm.',
        'Comecei a desenhar. E o que era um caso de estudo virou material com algum corpo: site institucional em quatro línguas, fichas técnicas, roadmap a 36 meses, kit imprensa, dezasseis fontes documentadas.',
        'Está tudo abaixo, nesta página. Veja quando quiser.'
      ]
    },
    {
      number: 6,
      heading: 'E aqui estou eu a contar-lhe isto.',
      paragraphs: [
        'Tenho de ser honesto consigo, Pedro: não me pediu nada disto. Ninguém da Frusoal me contactou. Não tenho briefing, não tenho mandato, não tenho proposta a apresentar.',
        'Foi curiosidade minha. Quis perceber até onde conseguíamos chegar a estudar uma empresa como a sua. E quando vi o que tinha em mãos, pensei que fazia sentido mostrar-lhe.'
      ]
    },
    {
      number: 7,
      heading: 'O que peço é simples — veja.',
      paragraphs: [
        'Veja o que tem a ver com a Frusoal e o que não tem. Veja se faz sentido. Se vir potencial em alguma coisa, conversamos.',
        'Se não vir, também está bem. Fez-me um favor por ser quem é, e o trabalho que fiz aqui ficou-me a mim como aprendizagem séria sobre o sector.',
        'Não há pressão. Não há follow-up. Veja quando quiser.'
      ]
    }
  ],

  material: {
    heading: 'Está tudo aqui.',
    intro:
      'Sete dias de trabalho · seis documentos · dezasseis fontes · um site em quatro línguas. Sem login, sem formulário, sem "deixe o seu email". É clicar e ver.',
    items: [
      {
        id: 'site',
        kind: 'web',
        title: 'Site institucional InovCitrus',
        subtitle: 'Quatro línguas · projecto trienal completo',
        href: '/pt',
        external: true
      },
      {
        id: 'ficha-pt',
        kind: 'pdf',
        title: 'Ficha técnica Scirtothrips aurantii',
        subtitle: 'PDF · 6 páginas · Português',
        href: '/material/ficha-tecnica-scirtothrips-pt.pdf',
        external: true
      },
      {
        id: 'ficha-en',
        kind: 'pdf',
        title: 'Ficha técnica Scirtothrips aurantii',
        subtitle: 'PDF · 6 pages · English',
        href: '/material/ficha-tecnica-scirtothrips-en.pdf',
        external: true
      },
      {
        id: 'ficha-es',
        kind: 'pdf',
        title: 'Ficha técnica Scirtothrips aurantii',
        subtitle: 'PDF · 7 páginas · Español',
        href: '/material/ficha-tecnica-scirtothrips-es.pdf',
        external: true
      },
      {
        id: 'ficha-fr',
        kind: 'pdf',
        title: 'Ficha técnica Scirtothrips aurantii',
        subtitle: 'PDF · 7 pages · Français',
        href: '/material/ficha-tecnica-scirtothrips-fr.pdf',
        external: true
      },
      {
        id: 'roadmap',
        kind: 'pdf',
        title: 'Roadmap 36 meses',
        subtitle: 'PDF · A4 paisagem · 12 marcos',
        href: '/material/roadmap-36-meses.pdf',
        external: true
      },
      {
        id: 'press-release',
        kind: 'pdf',
        title: 'Press release inicial',
        subtitle: 'PDF · 1-2 páginas · modelo editável Frusoal',
        href: '/material/press-release-pt.pdf',
        external: true
      },
      {
        id: 'kit',
        kind: 'kit',
        title: 'Kit imprensa',
        subtitle: 'Wordmarks · paleta · press releases editáveis',
        href: '/pt/kit-imprensa',
        external: true
      },
      {
        id: 'sources',
        kind: 'sources',
        title: 'Fontes documentadas',
        subtitle: 'F01 a F16 · com URL e data de verificação',
        href: '#fontes'
      }
    ]
  },

  sources: {
    heading: 'Dezasseis fontes documentadas.',
    intro:
      'Toda a informação utilizada neste trabalho está rastreada. Cada afirmação aponta para uma fonte pública verificável. Zero invenção.',
    lines: [
      {
        id: 'F01',
        title: 'Postal do Algarve — Lançamento InovCitrus',
        url: 'https://postal.pt/edicaopapel/frusoal-lanca-centro-de-id-para-a-citricultura-e-avanca-com-estudo-sobre-praga-nos-pomares-do-algarve/',
        date: '04/02/2026'
      },
      {
        id: 'F02',
        title: 'DRAP Algarve — Praga Scirtothrips aurantii',
        url: 'https://www.drapalgarve.gov.pt/images/destaques/Praga_de_introd_recente_-_Citrinos_Algarve.pdf',
        date: '12/11/2023'
      },
      {
        id: 'F03',
        title: 'AJAP — Sessão sobre Scirtothrips aurantii',
        url: 'https://ajap.pt/sessao-sobre-a-nova-praga-de-quarentena-scirtothrips-aurantii/',
        date: '23/04/2026'
      },
      {
        id: 'F04',
        title: 'Site oficial Frusoal',
        url: 'https://www.frusoal.pt/',
        date: '23/04/2026'
      },
      {
        id: 'F05',
        title: 'Site oficial InnovPlantProtect',
        url: 'https://iplantprotect.pt/produtos-e-servicos/',
        date: '24/04/2026'
      },
      {
        id: 'F06',
        title: 'Frusoal — Fruit Fly Protec',
        url: 'https://www.frusoal.pt/fruit-fly-protec/',
        date: '23/04/2026'
      },
      {
        id: 'F07',
        title: 'Prompt original (briefing interno)',
        url: '#',
        date: '23/04/2026'
      },
      {
        id: 'F08',
        title: 'Análise factual InovCitrus consolidada',
        url: '#',
        date: '24/04/2026'
      },
      {
        id: 'F09',
        title: 'EPPO Global Database — Scirtothrips aurantii (SCITAU)',
        url: 'https://gd.eppo.int/taxon/SCITAU',
        date: '25/04/2026'
      },
      {
        id: 'F10',
        title: 'EPPO Global Database — Datasheet',
        url: 'https://gd.eppo.int/taxon/SCITAU/datasheet',
        date: '25/04/2026'
      },
      {
        id: 'F11',
        title: 'EFSA Journal — Pest categorisation Scirtothrips aurantii (2018)',
        url: 'https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2018.5188',
        date: '25/04/2026'
      },
      {
        id: 'F12',
        title: 'Junta de Andalucía — RAIF Scirtothrips aurantii Faure',
        url: 'https://www.juntadeandalucia.es/agriculturapescaaguaydesarrollorural/raif/scirtothrips-aurantii-faure/',
        date: '25/04/2026'
      },
      {
        id: 'F13',
        title: 'BOJA — Resolución 13/12/2020 (Andalucía)',
        url: 'https://www.juntadeandalucia.es/boja/2020/244/40.html',
        date: '25/04/2026'
      },
      {
        id: 'F14',
        title: 'Plan Nacional de Contingencia Scirtothrips aurantii — MAPA ES',
        url: 'https://www.mapa.gob.es/es/agricultura/temas/sanidad-vegetal/organismos-nocivos/otras-plagas-cuarentena/default.aspx',
        date: '25/04/2026'
      },
      {
        id: 'F15',
        title: 'CABI Compendium — Scirtothrips aurantii',
        url: 'https://www.cabidigitallibrary.org/doi/abs/10.1079/cabicompendium.49061',
        date: '25/04/2026'
      },
      {
        id: 'F16',
        title: 'Reglamento (UE) 2019/2072 — Anexo II Parte A',
        url: 'https://eur-lex.europa.eu/legal-content/PT/TXT/?uri=CELEX:32019R2072',
        date: '25/04/2026'
      }
    ]
  },

  contact: {
    heading: 'Quando quiser falar.',
    name: 'Eurico Alves',
    brand: '[IA]AVANÇADA PT',
    phone: null,
    email: null,
    note: 'Sem formulário. Sem agenda automática. Mensagem directa.'
  },

  footer: {
    signature:
      'Esta página foi preparada para Pedro Madeira por Eurico Alves — [IA]AVANÇADA PT · 26 de Abril de 2026.',
    disclaimer:
      'Nenhum dado da Frusoal foi recolhido por meios não-públicos. Toda a informação utilizada está documentada em fontes públicas verificáveis (F01–F16).'
  }
};
