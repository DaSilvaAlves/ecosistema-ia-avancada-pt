# Pipeline de Video AI — HeyGen + ElevenLabs
> Comunidade IA Avancada PT | Eurico Alves
> Tempo alvo: 10-15 min por video

---

## VISAO GERAL

```
Script (texto)
    |
    v
ElevenLabs — Gera audio com voz clonada do Eurico
    |
    v
HeyGen — Sincroniza audio com avatar do Eurico
    |
    v
Video 20-30s pronto para publicar
```

---

## PRE-REQUISITOS (ja tens)

- [ ] Conta HeyGen activa com avatar criado
- [ ] Conta ElevenLabs activa com voz clonada
- [ ] Scripts prontos (ver HANDOFF.md ou SOCIAL-CALENDAR.md)

---

## PASSO 1 — PREPARAR O SCRIPT

### Regras de escrita para TTS (texto para voz)

1. **Frases curtas** — maximo 15 palavras por frase
2. **Sem simbolos estranhos** — sem emojis, *, #, etc. no texto falado
3. **Pausa com virgulas** — virgula = pausa curta, ponto = pausa longa
4. **Numeros por extenso** — "cento e oitenta e oito euros" em vez de €188
5. **Acentos correctos** — o ElevenLabs le acentuacao em PT-PT

### Exemplo de script formatado para TTS:

```
Ainda fazes isto manualmente?

Em Portugal, ainda ha pessoas a perder horas em tarefas que a IA resolve em segundos.

Criei uma comunidade para acabar com isso.
Ferramentas reais. Metodo proprietario.
Em quarenta e oito horas, mudas a forma de trabalhar.

Link na bio. Cento e oitenta e oito euros, vitalicio.
```

---

## PASSO 2 — ELEVENLAB (gerar audio)

### Aceder
URL: https://elevenlabs.io
Login: conta do Eurico

### Processo
1. Ir a **"Text to Speech"**
2. Selecionar a voz clonada do Eurico
3. Configuracoes recomendadas:
   - **Stability:** 0.5 (equilibrio entre consistencia e expressividade)
   - **Similarity Boost:** 0.75 (mais proximo da voz real)
   - **Style:** 0.3 (ligeiramente expressivo)
4. Colar o script
5. Clicar **Generate**
6. Fazer download do ficheiro `.mp3`

### Nome do ficheiro
```
video-[data]-[versao].mp3
Exemplo: video-20260308-versaoA.mp3
```

---

## PASSO 3 — HEYGEN (sincronizar avatar)

### Aceder
URL: https://app.heygen.com
Login: conta do Eurico

### Processo — Video Asincrono (recomendado para Reels)

1. Ir a **"Create Video"**
2. Selecionar **"Avatar"** → escolher o avatar do Eurico
3. Em **"Audio"** → selecionar **"Upload Audio"**
4. Fazer upload do `.mp3` gerado no ElevenLabs
5. Configurar:
   - **Aspect Ratio:** 9:16 (vertical — para Reels/TikTok)
   - **Background:** escolher fundo escuro/neutro ou fundo personalizado
   - **Avatar size:** Full body ou bust (acima do torso)
6. Clicar **Generate Video**
7. Aguardar (tipicamente 2-5 minutos)
8. Download do `.mp4`

### Configuracao de fundo recomendada
- Fundo escuro (preto ou cinzento escuro) — consistente com a brand quantum
- Ou fundo com gradiente ciano/magenta subtil
- Evitar fundos brancos ou muito luminosos

---

## PASSO 4 — POS-PRODUCAO (opcional mas recomendado)

### Adicionar elementos visuais com CapCut (gratuito, mobile)
1. Importar o video do HeyGen
2. Adicionar:
   - **Legenda automatica** (CapCut detecta automaticamente)
   - **Texto on-screen** para hooks (primeiros 2 segundos)
   - **Logo ou URL** no canto inferior
3. Exportar em 1080x1920 (qualidade maxima)

### Elementos visuais para adicionar
```
Segundos 0-2:  Texto grande — o HOOK
Segundos 18+: URL: ia-avancada-pt.vercel.app
               Preco: €188 vitalicio
```

---

## PASSO 5 — PUBLICAR

### TikTok
- Upload direto na app ou via TikTok Studio
- Caption (ver SOCIAL-CALENDAR.md)
- Hashtags: #IAPortugal #InteligenciaArtificial #Portugal #Produtividade
- Melhor hora: 19h-21h (hora de Portugal)

### Instagram Reels
- Upload via Instagram app
- Usar a mesma caption do TikTok
- Partilhar tambem nos Stories com link

### Facebook
- Upload direto (nao partilhar do Instagram — o algoritmo penaliza)
- Mesmo video, caption mais curta

### LinkedIn
- Usar o post de texto do SOCIAL-CALENDAR.md
- Nao publicar video nos primeiros dias — texto tem mais alcance organico no LinkedIn

---

## FLUXO COMPLETO EM 10-15 MINUTOS

```
Minuto 0-2:   Copiar script do SOCIAL-CALENDAR.md, formatar para TTS
Minuto 2-5:   ElevenLabs — colar texto, gerar, download
Minuto 5-10:  HeyGen — upload audio, configurar, gerar video
Minuto 10-13: CapCut — adicionar legendas e texto (opcional)
Minuto 13-15: Upload TikTok + Instagram Reels + Facebook
```

---

## BATCH PRODUCTION — GRAVAR VARIOS DE UMA VEZ

Para aumentar eficiencia, produz 3-5 videos de uma vez:

1. Prepara todos os scripts (5 min)
2. Gera todos os audios no ElevenLabs (10 min)
3. Submete todos no HeyGen em paralelo (5 min setup + 10 min render)
4. Edita todos no CapCut (15 min)
5. Agenda publicacao (5 min)

**Total: ~45 min para 5 videos = 9 min por video**

---

## SCRIPTS PRONTOS PARA GRAVAR HOJE (8 MARCO)

### Script A — "Ainda fazes isto manualmente?" (21s)
```
Ainda fazes isto manualmente?

Em Portugal, ainda ha pessoas a perder horas em tarefas que a IA resolve em segundos.

Criei uma comunidade para acabar com isso.
Ferramentas reais. Metodo proprietario.
Em quarenta e oito horas, mudas a forma de trabalhar.

Link na bio. Cento e oitenta e oito euros, vitalicio.
Os oitos nao mentem.
```

### Script B — "Testemunho Ruben Silva" (25s)
```
Um professor do Ministerio da Educacao disse isto:

"Ferramenta eficaz, de grande utilidade diaria e muito intuitiva.
Facilitou o meu dia a dia na traducao de conteudos de investigacao academica."

Isto e o que acontece quando aprendes a usar IA de nivel quatro.
Nao e magia. E metodo.
Comunidade IA Avancada PT.

Link na bio. Cento e oitenta e oito euros. Vitalicio. Portugal.
```

---

## RESOLUCAO DE PROBLEMAS

| Problema | Solucao |
|----------|---------|
| Voz soa robotica | Aumentar Style para 0.5, diminuir Stability para 0.4 |
| Labios desincronizados | Usar audio MP3 a 44.1kHz, mono ou stereo |
| Video HeyGen muito lento | Usar plano pago ou gerar fora de horas de pico |
| Avatar com expressao errada | Editar script para incluir pausas maiores (dois pontos, ponto final) |
| Qualidade de audio baixa | No ElevenLabs, selecionar formato "PCM 44100" no download |

---

## PROXIMOS PASSOS

- [ ] Gravar Script A hoje (8 marco) — DIA DE LANCAMENTO
- [ ] Gravar Script B hoje ou amanha
- [ ] Publicar ambos no TikTok + Instagram
- [ ] Analisar metricas ao fim de 48h
- [ ] Ajustar com base nos primeiros dados

---

*Pipeline de Video AI · Comunidade IA Avancada PT · Eurico Alves*
*Actualizado: 08/03/2026*
