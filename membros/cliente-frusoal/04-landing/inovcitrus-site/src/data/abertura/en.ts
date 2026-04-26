import type { AberturaContent } from './types';

export const aberturaEN: AberturaContent = {
  metaTitle: 'Pedro, this is for you · Frusoal InovCitrus',
  metaDescription:
    'Work prepared by Eurico Alves for Pedro Madeira about Frusoal InovCitrus — no brief, no proposal, just serious study. Full access to site, PDFs, roadmap, and sources.',

  hero: {
    greeting: 'Pedro,',
    message: 'this is for you.',
    context:
      'A curiosity of mine that grew into something real. No brief, no proposal, no contract. Just serious work about Frusoal — to show you.'
  },

  beats: [
    {
      number: 1,
      heading: "We've known each other too long for me to give you a CV.",
      paragraphs: [
        "But there's a part of what I do that probably hasn't reached you. A few years ago, I committed seriously to artificial intelligence — not reading about it, applying it. I built tools, formed a community, and I help Portuguese companies introduce AI into their processes.",
        "That's the part that's missing between what you know about me and what you're reading here."
      ]
    },
    {
      number: 2,
      heading: 'What I do is called [IA]AVANÇADA PT.',
      paragraphs: [
        'The purpose is simple: helping Portuguese companies with tradition and scale to integrate artificial intelligence into their processes — phased, multi-year, without operational disruption.',
        "I don't sell tools. I don't sell courses. I work side by side with decision-makers: I study the sector, map what exists, design where AI can fit in, and accompany implementation. This is consulting. Not selling."
      ]
    },
    {
      number: 3,
      heading: 'To find out how far I could go, I chose three company scales.',
      paragraphs: [
        'Small, medium, large. In each one, I did internal market research — not to sell to those companies, to measure myself. To find out whether what I do holds up across small, medium and large companies — or whether there is a ceiling.',
        "That's how I arrived at Frusoal. Frusoal didn't come to me."
      ]
    },
    {
      number: 4,
      heading: 'Frusoal entered the research as the "hard yardstick".',
      paragraphs: [
        "Largest Citrus Producer Organisation in Portugal. More than 150 employees. One thousand five hundred hectares cultivated. Forty thousand tonnes per year. Thirty-five operational years. Solid certifications — GlobalG.A.P., GRASP, IGP Citrinos do Algarve. And, above all, a company that stands for causes I respect: traceability, quality, sustainability of the Sotavento.",
        'It was not a light choice. It was a conscious one.'
      ]
    },
    {
      number: 5,
      heading: 'When I started studying Frusoal, things grew.',
      paragraphs: [
        'I found InovCitrus, the centre you just launched — the three-year project on Scirtothrips aurantii, the partnership with InnovPlantProtect, the scientific design, the 36-month vision. I imagined how AI could fit into that process — without disruption, on a multi-year horizon, aligned with the scientific design you already have.',
        'I started designing. And what was a case study became material with some substance: institutional site in four languages, technical sheets, 36-month roadmap, press kit, sixteen documented sources.',
        "It's all below, on this page. View it whenever you want."
      ]
    },
    {
      number: 6,
      heading: "And here I am telling you all this.",
      paragraphs: [
        "I have to be honest with you, Pedro: you didn't ask for any of this. Nobody from Frusoal contacted me. I have no brief, no mandate, no proposal to present.",
        "It was my curiosity. I wanted to find out how far we could go studying a company like yours. And when I saw what I had in hand, I thought it made sense to show you."
      ]
    },
    {
      number: 7,
      heading: 'What I ask is simple — look.',
      paragraphs: [
        "See what relates to Frusoal and what doesn't. See if it makes sense. If you see potential in any of it, we talk.",
        "If you don't, that's fine too. You did me a favour by being you, and the work I did here became serious learning about the sector for me.",
        'No pressure. No follow-up. Look whenever you want.'
      ]
    }
  ],

  material: {
    heading: "It's all here.",
    intro:
      'Seven days of work · six documents · sixteen sources · a site in four languages. No login, no form, no "leave your email". Just click and view.',
    items: [
      {
        id: 'site',
        kind: 'web',
        title: 'InovCitrus institutional site',
        subtitle: 'Four languages · full three-year project',
        href: '/en',
        external: true
      },
      {
        id: 'ficha-pt',
        kind: 'pdf',
        title: 'Technical sheet Scirtothrips aurantii',
        subtitle: 'PDF · 6 pages · Português',
        href: '/material/ficha-tecnica-scirtothrips-pt.pdf',
        external: true
      },
      {
        id: 'ficha-en',
        kind: 'pdf',
        title: 'Technical sheet Scirtothrips aurantii',
        subtitle: 'PDF · 6 pages · English',
        href: '/material/ficha-tecnica-scirtothrips-en.pdf',
        external: true
      },
      {
        id: 'ficha-es',
        kind: 'pdf',
        title: 'Technical sheet Scirtothrips aurantii',
        subtitle: 'PDF · 7 pages · Español',
        href: '/material/ficha-tecnica-scirtothrips-es.pdf',
        external: true
      },
      {
        id: 'ficha-fr',
        kind: 'pdf',
        title: 'Technical sheet Scirtothrips aurantii',
        subtitle: 'PDF · 7 pages · Français',
        href: '/material/ficha-tecnica-scirtothrips-fr.pdf',
        external: true
      },
      {
        id: 'roadmap',
        kind: 'pdf',
        title: '36-month roadmap',
        subtitle: 'PDF · A4 landscape · 12 milestones',
        href: '/material/roadmap-36-meses.pdf',
        external: true
      },
      {
        id: 'press-release',
        kind: 'pdf',
        title: 'Initial press release',
        subtitle: 'PDF · 1-2 pages · editable Frusoal template',
        href: '/material/press-release-pt.pdf',
        external: true
      },
      {
        id: 'kit',
        kind: 'kit',
        title: 'Press kit',
        subtitle: 'Wordmarks · palette · editable press releases',
        href: '/en/kit-imprensa',
        external: true
      },
      {
        id: 'sources',
        kind: 'sources',
        title: 'Documented sources',
        subtitle: 'F01 to F16 · with URL and verification date',
        href: '#fontes'
      }
    ]
  },

  sources: {
    heading: 'Sixteen documented sources.',
    intro:
      'All information used in this work is traced. Every claim points to a publicly verifiable source. Zero invention.',
    lines: [
      { id: 'F01', title: 'Postal do Algarve — InovCitrus launch', url: 'https://postal.pt/edicaopapel/frusoal-lanca-centro-de-id-para-a-citricultura-e-avanca-com-estudo-sobre-praga-nos-pomares-do-algarve/', date: '04/02/2026' },
      { id: 'F02', title: 'DRAP Algarve — Scirtothrips aurantii pest', url: 'https://www.drapalgarve.gov.pt/images/destaques/Praga_de_introd_recente_-_Citrinos_Algarve.pdf', date: '12/11/2023' },
      { id: 'F03', title: 'AJAP — Session on Scirtothrips aurantii', url: 'https://ajap.pt/sessao-sobre-a-nova-praga-de-quarentena-scirtothrips-aurantii/', date: '23/04/2026' },
      { id: 'F04', title: 'Frusoal official site', url: 'https://www.frusoal.pt/', date: '23/04/2026' },
      { id: 'F05', title: 'InnovPlantProtect official site', url: 'https://iplantprotect.pt/produtos-e-servicos/', date: '24/04/2026' },
      { id: 'F06', title: 'Frusoal — Fruit Fly Protec', url: 'https://www.frusoal.pt/fruit-fly-protec/', date: '23/04/2026' },
      { id: 'F07', title: 'Original prompt (internal briefing)', url: '#', date: '23/04/2026' },
      { id: 'F08', title: 'InovCitrus consolidated factual analysis', url: '#', date: '24/04/2026' },
      { id: 'F09', title: 'EPPO Global Database — Scirtothrips aurantii (SCITAU)', url: 'https://gd.eppo.int/taxon/SCITAU', date: '25/04/2026' },
      { id: 'F10', title: 'EPPO Global Database — Datasheet', url: 'https://gd.eppo.int/taxon/SCITAU/datasheet', date: '25/04/2026' },
      { id: 'F11', title: 'EFSA Journal — Pest categorisation (2018)', url: 'https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2018.5188', date: '25/04/2026' },
      { id: 'F12', title: 'Junta de Andalucía — RAIF Scirtothrips aurantii', url: 'https://www.juntadeandalucia.es/agriculturapescaaguaydesarrollorural/raif/scirtothrips-aurantii-faure/', date: '25/04/2026' },
      { id: 'F13', title: 'BOJA — Resolución 13/12/2020 (Andalucía)', url: 'https://www.juntadeandalucia.es/boja/2020/244/40.html', date: '25/04/2026' },
      { id: 'F14', title: 'National Contingency Plan Scirtothrips aurantii — MAPA ES', url: 'https://www.mapa.gob.es/es/agricultura/temas/sanidad-vegetal/organismos-nocivos/otras-plagas-cuarentena/default.aspx', date: '25/04/2026' },
      { id: 'F15', title: 'CABI Compendium — Scirtothrips aurantii', url: 'https://www.cabidigitallibrary.org/doi/abs/10.1079/cabicompendium.49061', date: '25/04/2026' },
      { id: 'F16', title: 'EU Regulation 2019/2072 — Annex II Part A', url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32019R2072', date: '25/04/2026' }
    ]
  },

  contact: {
    heading: 'When you want to talk.',
    name: 'Eurico Alves',
    brand: '[IA]AVANÇADA PT',
    phone: null,
    email: null,
    note: 'No form. No automatic scheduler. Direct message.'
  },

  footer: {
    signature:
      'This page was prepared for Pedro Madeira by Eurico Alves — [IA]AVANÇADA PT · 26 April 2026.',
    disclaimer:
      'No Frusoal data was collected by non-public means. All information used is documented in publicly verifiable sources (F01–F16).'
  }
};
