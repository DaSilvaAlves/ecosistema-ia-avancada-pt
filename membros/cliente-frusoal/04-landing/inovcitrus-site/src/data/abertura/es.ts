import type { AberturaContent } from './types';

export const aberturaES: AberturaContent = {
  metaTitle: 'Pedro, esto es para usted · Frusoal InovCitrus',
  metaDescription:
    'Trabajo preparado por Eurico Alves para Pedro Madeira sobre Frusoal InovCitrus — sin briefing, sin propuesta, sólo estudio en serio. Acceso integral al sitio, PDFs, hoja de ruta y fuentes.',

  hero: {
    greeting: 'Pedro,',
    message: 'esto es para usted.',
    context:
      'Una curiosidad mía que tomó cuerpo. Sin briefing, sin propuesta, sin contrato. Sólo trabajo en serio sobre Frusoal — para mostrárselo.'
  },

  beats: [
    {
      number: 1,
      heading: 'Nos conocemos desde hace demasiado tiempo para que le dé un currículum.',
      paragraphs: [
        'Pero hay una parte de lo que hago que probablemente no le ha llegado. Hace algunos años me dediqué en serio a la inteligencia artificial — no a leer sobre ella, a aplicarla. Construí herramientas, formé una comunidad, y ayudo a empresas portuguesas a introducir IA en sus procesos.',
        'Es esa parte la que falta entre lo que sabe de mí y lo que está leyendo aquí.'
      ]
    },
    {
      number: 2,
      heading: 'Lo que hago se llama [IA]AVANÇADA PT.',
      paragraphs: [
        'El propósito es simple: ayudar a empresas portuguesas con tradición y dimensión a integrar inteligencia artificial en sus procesos — de forma escalonada, plurianual, sin disrupción operativa.',
        'No vendo herramientas. No vendo cursos. Trabajo codo con codo con quien decide: estudio el sector, mapeo lo que existe, diseño dónde puede entrar la IA, y acompaño la implementación. Es consultoría. No es venta.'
      ]
    },
    {
      number: 3,
      heading: 'Para entender hasta dónde podía llegar, escogí tres escalas de empresa.',
      paragraphs: [
        'Pequeña, mediana, grande. En cada una hice investigación de mercado interna — no para venderles, sino para medirme a mí mismo. Para entender si lo que hago aguanta empresas pequeñas, medianas y grandes — o si hay un techo.',
        'Así llegué a Frusoal. No fue Frusoal quien llegó a mí.'
      ]
    },
    {
      number: 4,
      heading: 'Frusoal entró en la investigación como la "vara difícil".',
      paragraphs: [
        'Mayor Organización de Productores de Cítricos de Portugal. Más de 150 empleados. Mil quinientas hectáreas cultivadas. Cuarenta mil toneladas al año. Treinta y cinco años operativos. Certificaciones sólidas — GlobalG.A.P., GRASP, IGP Citrinos do Algarve. Y, sobre todo, una empresa que defiende causas que respeto: trazabilidad, calidad, sostenibilidad del Sotavento.',
        'No fue una elección leve. Fue una elección consciente.'
      ]
    },
    {
      number: 5,
      heading: 'Cuando empecé a estudiar Frusoal, la cosa creció.',
      paragraphs: [
        'Encontré el InovCitrus que acaban de lanzar — el proyecto trienal sobre Scirtothrips aurantii, la colaboración con InnovPlantProtect, el diseño científico, la visión a 36 meses. Imaginé cómo la IA podía encajar en ese proceso — sin disrupción, en horizonte plurianual, alineada con el diseño científico que ya tienen.',
        'Empecé a diseñar. Y lo que era un caso de estudio se convirtió en material con cierto cuerpo: sitio institucional en cuatro idiomas, fichas técnicas, hoja de ruta a 36 meses, kit de prensa, dieciséis fuentes documentadas.',
        'Está todo abajo, en esta página. Mírelo cuando quiera.'
      ]
    },
    {
      number: 6,
      heading: 'Y aquí estoy yo contándole esto.',
      paragraphs: [
        'Tengo que ser honesto con usted, Pedro: no me pidió nada de esto. Nadie de Frusoal me contactó. No tengo briefing, no tengo mandato, no tengo propuesta que presentar.',
        'Fue curiosidad mía. Quise entender hasta dónde podíamos llegar estudiando una empresa como la suya. Y cuando vi lo que tenía entre manos, pensé que tenía sentido enseñárselo.'
      ]
    },
    {
      number: 7,
      heading: 'Lo que pido es simple — mire.',
      paragraphs: [
        'Mire lo que tiene que ver con Frusoal y lo que no tiene. Mire si tiene sentido. Si ve potencial en algo, hablamos.',
        'Si no lo ve, también está bien. Me hizo un favor por ser quien es, y el trabajo que hice aquí me quedó como aprendizaje serio sobre el sector.',
        'Sin presión. Sin follow-up. Mire cuando quiera.'
      ]
    }
  ],

  material: {
    heading: 'Está todo aquí.',
    intro:
      'Siete días de trabajo · seis documentos · dieciséis fuentes · un sitio en cuatro idiomas. Sin login, sin formulario, sin "deje su correo". Es hacer clic y ver.',
    items: [
      { id: 'site', kind: 'web', title: 'Sitio institucional InovCitrus', subtitle: 'Cuatro idiomas · proyecto trienal completo', href: '/es', external: true },
      { id: 'ficha-pt', kind: 'pdf', title: 'Ficha técnica Scirtothrips aurantii', subtitle: 'PDF · 6 páginas · Português', href: '/material/ficha-tecnica-scirtothrips-pt.pdf', external: true },
      { id: 'ficha-en', kind: 'pdf', title: 'Ficha técnica Scirtothrips aurantii', subtitle: 'PDF · 6 pages · English', href: '/material/ficha-tecnica-scirtothrips-en.pdf', external: true },
      { id: 'ficha-es', kind: 'pdf', title: 'Ficha técnica Scirtothrips aurantii', subtitle: 'PDF · 7 páginas · Español', href: '/material/ficha-tecnica-scirtothrips-es.pdf', external: true },
      { id: 'ficha-fr', kind: 'pdf', title: 'Ficha técnica Scirtothrips aurantii', subtitle: 'PDF · 7 pages · Français', href: '/material/ficha-tecnica-scirtothrips-fr.pdf', external: true },
      { id: 'roadmap', kind: 'pdf', title: 'Hoja de ruta a 36 meses', subtitle: 'PDF · A4 horizontal · 12 hitos', href: '/material/roadmap-36-meses.pdf', external: true },
      { id: 'press-release', kind: 'pdf', title: 'Nota de prensa inicial', subtitle: 'PDF · 1-2 páginas · plantilla editable Frusoal', href: '/material/press-release-pt.pdf', external: true },
      { id: 'kit', kind: 'kit', title: 'Kit de prensa', subtitle: 'Wordmarks · paleta · notas de prensa editables', href: '/es/kit-imprensa', external: true },
      { id: 'sources', kind: 'sources', title: 'Fuentes documentadas', subtitle: 'F01 a F16 · con URL y fecha de verificación', href: '#fontes' }
    ]
  },

  sources: {
    heading: 'Dieciséis fuentes documentadas.',
    intro:
      'Toda la información utilizada en este trabajo está rastreada. Cada afirmación apunta a una fuente pública verificable. Cero invención.',
    lines: [
      { id: 'F01', title: 'Postal do Algarve — Lanzamiento InovCitrus', url: 'https://postal.pt/edicaopapel/frusoal-lanca-centro-de-id-para-a-citricultura-e-avanca-com-estudo-sobre-praga-nos-pomares-do-algarve/', date: '04/02/2026' },
      { id: 'F02', title: 'DRAP Algarve — Plaga Scirtothrips aurantii', url: 'https://www.drapalgarve.gov.pt/images/destaques/Praga_de_introd_recente_-_Citrinos_Algarve.pdf', date: '12/11/2023' },
      { id: 'F03', title: 'AJAP — Sesión sobre Scirtothrips aurantii', url: 'https://ajap.pt/sessao-sobre-a-nova-praga-de-quarentena-scirtothrips-aurantii/', date: '23/04/2026' },
      { id: 'F04', title: 'Sitio oficial Frusoal', url: 'https://www.frusoal.pt/', date: '23/04/2026' },
      { id: 'F05', title: 'Sitio oficial InnovPlantProtect', url: 'https://iplantprotect.pt/produtos-e-servicos/', date: '24/04/2026' },
      { id: 'F06', title: 'Frusoal — Fruit Fly Protec', url: 'https://www.frusoal.pt/fruit-fly-protec/', date: '23/04/2026' },
      { id: 'F07', title: 'Briefing original interno', url: '#', date: '23/04/2026' },
      { id: 'F08', title: 'Análisis factual InovCitrus consolidado', url: '#', date: '24/04/2026' },
      { id: 'F09', title: 'EPPO Global Database — Scirtothrips aurantii (SCITAU)', url: 'https://gd.eppo.int/taxon/SCITAU', date: '25/04/2026' },
      { id: 'F10', title: 'EPPO Global Database — Datasheet', url: 'https://gd.eppo.int/taxon/SCITAU/datasheet', date: '25/04/2026' },
      { id: 'F11', title: 'EFSA Journal — Pest categorisation (2018)', url: 'https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2018.5188', date: '25/04/2026' },
      { id: 'F12', title: 'Junta de Andalucía — RAIF Scirtothrips aurantii Faure', url: 'https://www.juntadeandalucia.es/agriculturapescaaguaydesarrollorural/raif/scirtothrips-aurantii-faure/', date: '25/04/2026' },
      { id: 'F13', title: 'BOJA — Resolución 13/12/2020 (Andalucía)', url: 'https://www.juntadeandalucia.es/boja/2020/244/40.html', date: '25/04/2026' },
      { id: 'F14', title: 'Plan Nacional de Contingencia Scirtothrips aurantii — MAPA ES', url: 'https://www.mapa.gob.es/es/agricultura/temas/sanidad-vegetal/organismos-nocivos/otras-plagas-cuarentena/default.aspx', date: '25/04/2026' },
      { id: 'F15', title: 'CABI Compendium — Scirtothrips aurantii', url: 'https://www.cabidigitallibrary.org/doi/abs/10.1079/cabicompendium.49061', date: '25/04/2026' },
      { id: 'F16', title: 'Reglamento (UE) 2019/2072 — Anexo II Parte A', url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32019R2072', date: '25/04/2026' }
    ]
  },

  contact: {
    heading: 'Cuando quiera hablar.',
    name: 'Eurico Alves',
    brand: '[IA]AVANÇADA PT',
    phone: null,
    email: null,
    note: 'Sin formulario. Sin agenda automática. Mensaje directo.'
  },

  footer: {
    signature:
      'Esta página fue preparada para Pedro Madeira por Eurico Alves — [IA]AVANÇADA PT · 26 de abril de 2026.',
    disclaimer:
      'Ningún dato de Frusoal fue recogido por medios no públicos. Toda la información utilizada está documentada en fuentes públicas verificables (F01–F16).'
  }
};
