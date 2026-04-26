// Tipos para a página de abertura para Pedro Madeira
// Conteúdo separado por idioma em ficheiros pt/en/es/fr.ts

export interface AberturaHero {
  greeting: string;        // "Pedro,"
  message: string;         // "isto é para ti."
  context: string;         // parágrafo de contexto curto
}

export interface AberturaBeat {
  number: number;          // 1..7
  heading: string;         // título do beat (em destaque)
  paragraphs: string[];    // parágrafos do corpo
}

export type MaterialKind = 'web' | 'pdf' | 'kit' | 'sources';

export interface MaterialItem {
  id: string;
  kind: MaterialKind;
  title: string;
  subtitle: string;
  href: string;
  external?: boolean;      // abre em nova janela
  download?: boolean;      // atributo download HTML
}

export interface AberturaMaterial {
  heading: string;
  intro: string;
  items: MaterialItem[];
}

export interface AberturaContact {
  heading: string;
  name: string;
  brand: string;           // "[IA]AVANÇADA PT"
  phone: string | null;    // null = não mostrar; placeholder antes do envio a Pedro
  email: string | null;
  note: string;            // "Sem formulário. Sem agenda automática. Mensagem directa."
}

export interface AberturaFooter {
  signature: string;
  disclaimer: string;
}

export interface AberturaSourceLine {
  id: string;              // F01..F16
  title: string;
  url: string;
  date: string;
}

export interface AberturaSources {
  heading: string;
  intro: string;
  lines: AberturaSourceLine[];
}

export interface AberturaContent {
  metaTitle: string;
  metaDescription: string;
  hero: AberturaHero;
  beats: AberturaBeat[];   // 7 beats
  material: AberturaMaterial;
  sources: AberturaSources;
  contact: AberturaContact;
  footer: AberturaFooter;
}
