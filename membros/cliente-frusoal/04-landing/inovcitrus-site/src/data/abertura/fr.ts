import type { AberturaContent } from './types';

export const aberturaFR: AberturaContent = {
  metaTitle: "Pedro, c'est pour vous · Frusoal InovCitrus",
  metaDescription:
    "Travail préparé par Eurico Alves pour Pedro Madeira au sujet de Frusoal InovCitrus — sans brief, sans proposition, juste une étude sérieuse. Accès intégral au site, PDF, feuille de route et sources.",

  hero: {
    greeting: 'Pedro,',
    message: "c'est pour vous.",
    context:
      "Une curiosité de ma part qui a pris corps. Sans brief, sans proposition, sans contrat. Juste un travail sérieux sur Frusoal — pour vous le montrer."
  },

  beats: [
    {
      number: 1,
      heading: "Nous nous connaissons depuis trop longtemps pour que je vous donne un CV.",
      paragraphs: [
        "Mais il y a une partie de ce que je fais qui ne vous est probablement pas parvenue. Il y a quelques années, je me suis consacré sérieusement à l'intelligence artificielle — pas à en lire, à l'appliquer. J'ai construit des outils, formé une communauté, et j'aide des entreprises portugaises à introduire l'IA dans leurs processus.",
        "C'est cette partie qui manque entre ce que vous savez de moi et ce que vous lisez ici."
      ]
    },
    {
      number: 2,
      heading: "Ce que je fais s'appelle [IA]AVANÇADA PT.",
      paragraphs: [
        "Le propos est simple : aider des entreprises portugaises avec tradition et dimension à intégrer l'intelligence artificielle dans leurs processus — de manière progressive, pluriannuelle, sans disruption opérationnelle.",
        "Je ne vends pas d'outils. Je ne vends pas de formations. Je travaille côte à côte avec ceux qui décident : j'étudie le secteur, je cartographie l'existant, je dessine où l'IA peut entrer, et j'accompagne la mise en œuvre. C'est du conseil. Ce n'est pas de la vente."
      ]
    },
    {
      number: 3,
      heading: "Pour comprendre jusqu'où je pouvais aller, j'ai choisi trois échelles d'entreprise.",
      paragraphs: [
        "Petite, moyenne, grande. Pour chacune, j'ai fait une recherche de marché interne — pas pour vendre à ces entreprises, pour me mesurer moi-même. Pour comprendre si ce que je fais tient face à des entreprises petites, moyennes et grandes — ou s'il y a un plafond.",
        "C'est ainsi que je suis arrivé à Frusoal. Ce n'est pas Frusoal qui est venue à moi."
      ]
    },
    {
      number: 4,
      heading: 'Frusoal est entrée dans la recherche comme la "règle dure".',
      paragraphs: [
        "Plus grande Organisation de Producteurs d'Agrumes du Portugal. Plus de 150 employés. Mille cinq cents hectares cultivés. Quarante mille tonnes par an. Trente-cinq années opérationnelles. Certifications solides — GlobalG.A.P., GRASP, IGP Citrinos do Algarve. Et, surtout, une entreprise qui défend des causes que je respecte : traçabilité, qualité, durabilité du Sotavento.",
        "Ce n'a pas été un choix léger. C'a été un choix conscient."
      ]
    },
    {
      number: 5,
      heading: "Quand j'ai commencé à étudier Frusoal, la chose a grandi.",
      paragraphs: [
        "J'ai trouvé l'InovCitrus que vous venez de lancer — le projet triennal sur Scirtothrips aurantii, le partenariat avec InnovPlantProtect, la conception scientifique, la vision à 36 mois. J'ai imaginé comment l'IA pouvait s'intégrer à ce processus — sans disruption, en horizon pluriannuel, alignée à la conception scientifique que vous avez déjà.",
        "J'ai commencé à dessiner. Et ce qui était une étude de cas est devenu un matériel d'une certaine consistance : site institutionnel en quatre langues, fiches techniques, feuille de route à 36 mois, kit presse, seize sources documentées.",
        "Tout est en bas, sur cette page. Regardez quand vous voudrez."
      ]
    },
    {
      number: 6,
      heading: "Et me voici à vous raconter cela.",
      paragraphs: [
        "Je dois être honnête avec vous, Pedro : vous ne m'avez rien demandé de tout cela. Personne de Frusoal ne m'a contacté. Je n'ai pas de brief, pas de mandat, pas de proposition à présenter.",
        "C'était ma curiosité. J'ai voulu comprendre jusqu'où nous pouvions aller en étudiant une entreprise comme la vôtre. Et quand j'ai vu ce que j'avais en main, j'ai pensé que cela avait du sens de vous le montrer."
      ]
    },
    {
      number: 7,
      heading: "Ce que je demande est simple — regardez.",
      paragraphs: [
        "Regardez ce qui concerne Frusoal et ce qui ne la concerne pas. Regardez si cela a du sens. Si vous voyez du potentiel dans quelque chose, on en parle.",
        "Si vous n'en voyez pas, c'est très bien aussi. Vous m'avez rendu service en étant vous-même, et le travail que j'ai fait ici m'est resté comme un apprentissage sérieux du secteur.",
        "Pas de pression. Pas de relance. Regardez quand vous voudrez."
      ]
    }
  ],

  material: {
    heading: "Tout est ici.",
    intro:
      "Sept jours de travail · six documents · seize sources · un site en quatre langues. Sans login, sans formulaire, sans \"laissez votre e-mail\". On clique et on voit.",
    items: [
      { id: 'site', kind: 'web', title: 'Site institutionnel InovCitrus', subtitle: 'Quatre langues · projet triennal complet', href: '/fr', external: true },
      { id: 'ficha-pt', kind: 'pdf', title: 'Fiche technique Scirtothrips aurantii', subtitle: 'PDF · 6 pages · Português', href: '/material/ficha-tecnica-scirtothrips-pt.pdf', external: true },
      { id: 'ficha-en', kind: 'pdf', title: 'Fiche technique Scirtothrips aurantii', subtitle: 'PDF · 6 pages · English', href: '/material/ficha-tecnica-scirtothrips-en.pdf', external: true },
      { id: 'ficha-es', kind: 'pdf', title: 'Fiche technique Scirtothrips aurantii', subtitle: 'PDF · 7 pages · Español', href: '/material/ficha-tecnica-scirtothrips-es.pdf', external: true },
      { id: 'ficha-fr', kind: 'pdf', title: 'Fiche technique Scirtothrips aurantii', subtitle: 'PDF · 7 pages · Français', href: '/material/ficha-tecnica-scirtothrips-fr.pdf', external: true },
      { id: 'roadmap', kind: 'pdf', title: 'Feuille de route à 36 mois', subtitle: 'PDF · A4 paysage · 12 jalons', href: '/material/roadmap-36-meses.pdf', external: true },
      { id: 'press-release', kind: 'pdf', title: 'Communiqué de presse initial', subtitle: 'PDF · 1-2 pages · modèle éditable Frusoal', href: '/material/press-release-pt.pdf', external: true },
      { id: 'kit', kind: 'kit', title: 'Kit presse', subtitle: 'Wordmarks · palette · communiqués éditables', href: '/fr/kit-imprensa', external: true },
      { id: 'sources', kind: 'sources', title: 'Sources documentées', subtitle: 'F01 à F16 · avec URL et date de vérification', href: '#fontes' }
    ]
  },

  sources: {
    heading: 'Seize sources documentées.',
    intro:
      "Toute l'information utilisée dans ce travail est tracée. Chaque affirmation pointe vers une source publique vérifiable. Zéro invention.",
    lines: [
      { id: 'F01', title: 'Postal do Algarve — Lancement InovCitrus', url: 'https://postal.pt/edicaopapel/frusoal-lanca-centro-de-id-para-a-citricultura-e-avanca-com-estudo-sobre-praga-nos-pomares-do-algarve/', date: '04/02/2026' },
      { id: 'F02', title: 'DRAP Algarve — Ravageur Scirtothrips aurantii', url: 'https://www.drapalgarve.gov.pt/images/destaques/Praga_de_introd_recente_-_Citrinos_Algarve.pdf', date: '12/11/2023' },
      { id: 'F03', title: 'AJAP — Session sur Scirtothrips aurantii', url: 'https://ajap.pt/sessao-sobre-a-nova-praga-de-quarentena-scirtothrips-aurantii/', date: '23/04/2026' },
      { id: 'F04', title: 'Site officiel Frusoal', url: 'https://www.frusoal.pt/', date: '23/04/2026' },
      { id: 'F05', title: 'Site officiel InnovPlantProtect', url: 'https://iplantprotect.pt/produtos-e-servicos/', date: '24/04/2026' },
      { id: 'F06', title: 'Frusoal — Fruit Fly Protec', url: 'https://www.frusoal.pt/fruit-fly-protec/', date: '23/04/2026' },
      { id: 'F07', title: 'Brief original (interne)', url: '#', date: '23/04/2026' },
      { id: 'F08', title: 'Analyse factuelle InovCitrus consolidée', url: '#', date: '24/04/2026' },
      { id: 'F09', title: 'EPPO Global Database — Scirtothrips aurantii (SCITAU)', url: 'https://gd.eppo.int/taxon/SCITAU', date: '25/04/2026' },
      { id: 'F10', title: 'EPPO Global Database — Datasheet', url: 'https://gd.eppo.int/taxon/SCITAU/datasheet', date: '25/04/2026' },
      { id: 'F11', title: 'EFSA Journal — Catégorisation phytosanitaire (2018)', url: 'https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2018.5188', date: '25/04/2026' },
      { id: 'F12', title: 'Junta de Andalucía — RAIF Scirtothrips aurantii Faure', url: 'https://www.juntadeandalucia.es/agriculturapescaaguaydesarrollorural/raif/scirtothrips-aurantii-faure/', date: '25/04/2026' },
      { id: 'F13', title: 'BOJA — Resolución 13/12/2020 (Andalucía)', url: 'https://www.juntadeandalucia.es/boja/2020/244/40.html', date: '25/04/2026' },
      { id: 'F14', title: 'Plan National de Contingence Scirtothrips aurantii — MAPA ES', url: 'https://www.mapa.gob.es/es/agricultura/temas/sanidad-vegetal/organismos-nocivos/otras-plagas-cuarentena/default.aspx', date: '25/04/2026' },
      { id: 'F15', title: 'CABI Compendium — Scirtothrips aurantii', url: 'https://www.cabidigitallibrary.org/doi/abs/10.1079/cabicompendium.49061', date: '25/04/2026' },
      { id: 'F16', title: 'Règlement (UE) 2019/2072 — Annexe II Partie A', url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32019R2072', date: '25/04/2026' }
    ]
  },

  contact: {
    heading: 'Quand vous voudrez parler.',
    name: 'Eurico Alves',
    brand: '[IA]AVANÇADA PT',
    phone: null,
    email: null,
    note: 'Sans formulaire. Sans agenda automatique. Message direct.'
  },

  footer: {
    signature:
      'Cette page a été préparée pour Pedro Madeira par Eurico Alves — [IA]AVANÇADA PT · 26 avril 2026.',
    disclaimer:
      'Aucune donnée de Frusoal n\'a été recueillie par des moyens non publics. Toute l\'information utilisée est documentée dans des sources publiques vérifiables (F01–F16).'
  }
};
