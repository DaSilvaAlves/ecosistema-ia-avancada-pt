# Setup OAuth Google — Nexus v2 (Story 6.1, [D-6.1-TESTMODE])

Procedimento de provisionamento das credenciais OAuth do Google necessárias à
integração do Calendar (Story 6.1) e do Gmail (Story 6.7 — reutiliza o mesmo
cliente OAuth). Documento de setup reutilizável: vale para o primeiro
provisionamento e para qualquer re-provisionamento.

> Estes passos são **pré-requisitos humanos** (P1/P2/P3). Sem eles, o fluxo OAuth
> real não funciona em produção — mas toda a lógica, routes e UI são testáveis em
> CI sem credenciais reais (MSW + fake-KV).

## Test mode permanente — NÃO pedir Google Verification

A app fica em **test mode permanente** no Google Cloud Console (PRD §11 R4 /
arch §18 AR5). O Nexus é **single-user** (apenas o Eurico) — sempre menos de 100
utilizadores, pelo que o Google **não exige** o processo de verification (OAuth
consent screen verification). NÃO submeter a app para verification.

Consequência operacional: o consent screen mostra o aviso "Google hasn't
verified this app" — é esperado e aceitável neste perfil. O Eurico avança em
"Advanced → Go to Nexus (unsafe)".

## P1 — Google Cloud Console (manual, Eurico)

1. Criar um projecto no [Google Cloud Console](https://console.cloud.google.com/).
2. Activar a **Google Calendar API** (APIs & Services → Library → Google Calendar
   API → Enable).
3. Configurar o **OAuth consent screen**:
   - User type: **External**.
   - Publishing status: **Testing** (test mode permanente — não publicar/verificar).
   - Scopes: adicionar `https://www.googleapis.com/auth/calendar`.
4. Criar credenciais **OAuth 2.0 Client ID**:
   - Application type: **Web application**.
   - Authorized redirect URI (tem de bater **ao caracter** — contrato externo,
     `external-contract-identifiers.md`):

     ```
     https://nexus-eurico.vercel.app/api/google/oauth/callback
     ```

     Sem trailing slash. Este é o path literal `/callback` ([D-6.1-CALLBACK]).
5. Guardar o **Client ID** e o **Client Secret** gerados (para P2).

## P2 — Vercel env vars (@devops, via Vercel CLI)

Adicionar como **server-only** (não `NEXT_PUBLIC_*`):

| Env var | Valor |
|---------|-------|
| `GOOGLE_OAUTH_CLIENT_ID` | Client ID de P1 |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Client Secret de P1 |
| `GOOGLE_OAUTH_REDIRECT_URI` | `https://nexus-eurico.vercel.app/api/google/oauth/callback` |

> O schema Zod (`v2/lib/shared/env.ts:19-21`) já valida estas vars (opcionais em
> dev, obrigatórias para o fluxo OAuth operar). O `SESSION_SECRET` (já provisionado
> desde o Epic 0) é reutilizado para assinar o state CSRF — não é uma var nova.

## P3 — Test user (manual, Eurico)

No OAuth consent screen → **Test users** → adicionar o email do Eurico. Sem isto, o
consent screen rejeita o login com `access_denied` mesmo com credenciais válidas.

## Verificação pós-deploy (AC1 / AC5 — produção manual)

Após P1/P2/P3 satisfeitos e deploy:

1. Abrir `/settings` → secção Google Calendar → "Ligar ao Google Calendar".
2. Completar o consent no Google (avançar pelo aviso de app não-verificada).
3. Confirmar o redirect de volta com o estado **ligado** e o ciclo completo em
   menos de 60s (AC1 nível epic).
4. Registar o resultado (data + hash de commit) no Change Log da Story 6.1.

## Segurança

- O `GOOGLE_OAUTH_CLIENT_SECRET` é **server-only** — nunca chega ao browser.
- Os tokens (`accessToken`/`refreshToken`) **nunca** aparecem em logs nem na URL.
- O state OAuth é assinado HMAC-SHA256 com `SESSION_SECRET`, single-use, TTL 600s
  ([D-6.1-PKCE]).
- A encriptação at-rest dos tokens em KV é da **Story 6.2** (REC-6.1-ENCRYPT /
  GAP-6.2) — na 6.1 os tokens vivem em KV sem encriptação aplicacional (KV Upstash
  já é encriptado at-rest ao nível do fornecedor; acesso por `KV_REST_API_TOKEN`
  server-only).
