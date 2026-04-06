# SPEC: Upload directo de video no feed

**Data:** 04/04/2026
**Autor:** Uma (UX Design Expert)
**Prioridade:** Media
**Complexidade:** Baixa (1-2h)
**Ficheiro afectado:** `comunidade/dashboard.html`

---

## Problema

O feed da comunidade so permite partilhar videos via link externo (YouTube, Vimeo, Loom). Quando o membro clica num video embebido do YouTube, ve sugestoes do YouTube e pode sair da plataforma. O Eurico quer subir videos proprios sem que o membro saia.

## Solucao

Adicionar botao "Video" ao formulario de publicacao, seguindo o mesmo padrao de upload de imagens (Supabase Storage). Manter tambem a opcao de link externo (modelo hibrido).

---

## Alteracoes no HTML

### Formulario de publicacao (linhas 1498-1505)

**ANTES:**
```html
<div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
  <label ... for="feed-img-input">📎 Imagem</label>
  <input type="file" id="feed-img-input" accept="image/*" style="display:none" onchange="handleFeedImgUpload(this)"/>
  <span id="feed-upload-status" ...></span>
</div>
<div style="display:flex;align-items:center;gap:0.5rem;">
  <input type="url" id="feed-video-url" placeholder="URL de video (YouTube, Vimeo, Loom)" .../>
</div>
```

**DEPOIS:**
```html
<div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
  <label ... for="feed-img-input">📎 Imagem</label>
  <input type="file" id="feed-img-input" accept="image/*" style="display:none" onchange="handleFeedImgUpload(this)"/>
  <label style="cursor:pointer;font-size:0.75rem;color:var(--cyan);background:rgba(0,245,255,0.06);border:1px solid rgba(0,245,255,0.18);border-radius:20px;padding:0.3rem 0.75rem;font-family:'JetBrains Mono',monospace;letter-spacing:0.04em;transition:background 0.2s" for="feed-video-input">🎬 Video</label>
  <input type="file" id="feed-video-input" accept="video/mp4,video/webm,video/quicktime" style="display:none" onchange="handleFeedVideoUpload(this)"/>
  <span id="feed-upload-status" ...></span>
</div>
<div style="display:flex;align-items:center;gap:0.5rem;">
  <input type="url" id="feed-video-url" placeholder="URL de video (YouTube, Vimeo, Loom)" .../>
</div>
```

### Preview de video (apos feed-img-preview, linha ~1509)

```html
<div id="feed-video-preview" style="display:none;margin-top:0.35rem;position:relative;">
  <video id="feed-video-preview-el" style="max-width:100%;max-height:220px;border-radius:8px;border:1px solid var(--glass-border);" controls></video>
  <button onclick="removeFeedVideoPreview()" style="position:absolute;top:4px;right:4px;background:rgba(4,4,10,0.8);border:1px solid rgba(255,255,255,0.15);border-radius:50%;width:22px;height:22px;color:var(--white);font-size:0.7rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
</div>
```

---

## Alteracoes no JavaScript

### 1. Nova variavel global (junto de `let feedImgUrl = null`)

```javascript
let feedVideoUrl = null;
```

### 2. Nova funcao: handleFeedVideoUpload (apos handleFeedImgUpload)

```javascript
async function handleFeedVideoUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const st = document.getElementById('feed-upload-status');
  // Limite: 50MB (Supabase free tier)
  if (file.size > 50 * 1024 * 1024) {
    st.textContent = 'Video max. 50MB'; st.style.color = '#FF006E'; return;
  }
  st.textContent = 'A carregar video...'; st.style.color = 'var(--grey)';
  const session = await sb.auth.getSession();
  const user = session?.data?.session?.user;
  if (!user) return;
  const ext = file.name.split('.').pop().toLowerCase() || 'mp4';
  const path = `${user.id}/vid-${Date.now()}.${ext}`;
  const { error } = await sb.storage.from('feed-media').upload(path, file, { upsert: false, contentType: file.type });
  if (error) { st.textContent = 'Erro: ' + error.message; st.style.color = '#FF006E'; return; }
  const { data } = sb.storage.from('feed-media').getPublicUrl(path);
  feedVideoUrl = data.publicUrl;
  st.textContent = 'Video carregado'; st.style.color = 'var(--cyan)';
  // Preview
  const prev = document.getElementById('feed-video-preview');
  const prevEl = document.getElementById('feed-video-preview-el');
  if (prev && prevEl) {
    prevEl.src = feedVideoUrl;
    prev.style.display = 'block';
  }
  // Limpar campo URL externo (nao misturar)
  document.getElementById('feed-video-url').value = '';
}
```

### 3. Nova funcao: removeFeedVideoPreview (apos removeFeedImgPreview)

```javascript
function removeFeedVideoPreview() {
  feedVideoUrl = null;
  const prev = document.getElementById('feed-video-preview');
  if (prev) prev.style.display = 'none';
  const input = document.getElementById('feed-video-input');
  if (input) input.value = '';
  const st = document.getElementById('feed-upload-status');
  if (st) st.textContent = '';
}
```

### 4. Alterar publicarNoFeed (linha ~4041-4058)

Na determinacao do `video_url` a guardar no DB:

**ANTES:**
```javascript
const videoUrl = document.getElementById('feed-video-url').value.trim() || null;
```

**DEPOIS:**
```javascript
const videoUrl = feedVideoUrl || document.getElementById('feed-video-url').value.trim() || null;
```

Na limpeza do formulario, adicionar:

```javascript
removeFeedVideoPreview();
```

### 5. Alterar parseVideoEmbed (linha ~3850)

Detectar URLs do Supabase Storage e renderizar com `<video>` nativo em vez de iframe:

**ANTES:**
```javascript
function parseVideoEmbed(url) {
  if (!url) return '';
  // ... YouTube, Vimeo, Loom matching ...
  if (!src) return '';
  return `<div ...><iframe ...></iframe></div>`;
}
```

**DEPOIS:**
```javascript
function parseVideoEmbed(url) {
  if (!url) return '';

  // Video directo (Supabase Storage ou qualquer .mp4/.webm)
  if (url.match(/\.(mp4|webm|mov)(\?|$)/i) || url.includes('supabase.co/storage')) {
    return `<div style="margin-top:0.65rem;border-radius:10px;overflow:hidden;border:1px solid var(--glass-border)"><video src="${url}" style="width:100%;max-height:500px;border-radius:10px" controls preload="metadata"></video></div>`;
  }

  // YouTube
  let src;
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (ytMatch) { src = `https://www.youtube.com/embed/${ytMatch[1]}`; }
  // Vimeo
  const vmMatch = url.match(/vimeo\.com\/(\d+)/);
  if (!src && vmMatch) { src = `https://player.vimeo.com/video/${vmMatch[1]}`; }
  // Loom
  const lmMatch = url.match(/loom\.com\/share\/([\w]+)/);
  if (!src && lmMatch) { src = `https://www.loom.com/embed/${lmMatch[1]}`; }
  if (!src) return '';
  return `<div style="margin-top:0.65rem;border-radius:10px;overflow:hidden;border:1px solid var(--glass-border);aspect-ratio:16/9"><iframe src="${src}" style="width:100%;height:100%;border:none" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>`;
}
```

---

## Regras de interaccao (UX)

| Regra | Detalhe |
|-------|---------|
| Upload de video limpa campo URL | Se o membro sobe video, o campo URL externo e limpo |
| URL externo tem prioridade se ambos | Se `feedVideoUrl` existe, ignora URL externo |
| Feedback visual | Barra de status mostra "A carregar video..." durante upload |
| Preview | Video aparece com player nativo e botao X para remover |
| Limite | 50MB (Supabase free tier) — suficiente para videos de 2-3 min |
| Formatos | MP4, WebM, QuickTime (.mov) |
| Player | `<video>` HTML5 nativo — zero saida da plataforma |

---

## O que NAO muda

| Elemento | Estado |
|----------|--------|
| Campo URL externo | Mantido — modelo hibrido |
| YouTube/Vimeo/Loom embed | Continua a funcionar via iframe |
| Upload de imagem | Inalterado |
| Tabela `apresentacoes` | Sem alteracao — campo `video_url` ja existe |
| Bucket Supabase | Reutiliza `feed-media` — sem bucket novo |

---

## Supabase Storage — verificacao necessaria

O bucket `feed-media` actualmente aceita imagens. Verificar se:
1. O limite de tamanho do bucket permite 50MB (pode estar configurado para 5MB)
2. Os MIME types `video/mp4`, `video/webm`, `video/quicktime` sao permitidos

Se o bucket tiver restricoes, o `@dev` precisa actualizar a policy via Supabase dashboard.

---

## Proximo passo

`@dev` implementa seguindo esta spec exacta. Testar localmente antes de push (regra `comunidade-safety`).
