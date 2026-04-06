# FASE 6 — Deploy final (Domingo 15:00-16:00)

> Ultimo commit. Ultimo deploy. A URL que o aluno vai mostrar ao mundo.
> Responsavel: Eurico (guia)

---

## Objectivo

Cada aluno tem a sua URL final publica, funcional, com conteudo real. O projecto esta FEITO.

---

## Roteiro

| Hora | Duracao | Momento | Quem faz |
|------|---------|---------|----------|
| 15:00 | 15 min | Ultimos ajustes — "o que falta?" | Alunos |
| 15:15 | 15 min | Deploy final — git push + vercel | Alunos (guiados) |
| 15:30 | 15 min | Teste cruzado — cada aluno testa o projecto de outro | Alunos |
| 15:45 | 15 min | Partilha de URLs — todos no WhatsApp | Todos |

---

## Checklist de deploy final (por aluno)

| # | Check | Feito? |
|---|-------|--------|
| 1 | Conteudo real (sem lorem ipsum) | [ ] |
| 2 | Responsivo (funciona no telemovel) | [ ] |
| 3 | Links funcionam | [ ] |
| 4 | Deploy Vercel online | [ ] |
| 5 | URL partilhada no grupo | [ ] |

---

## Ferramentas

| Ferramenta | Papel |
|------------|-------|
| Claude Code | Ultimos fixes rapidos |
| Git | Commit final: "feat: deploy final imersao" |
| GitHub | Push para remote |
| Vercel | Deploy automatico ou `vercel --prod` |

---

## Plano de deploy

### Se veio do AIOS Compiler (exercicio guiado)
```
Ja esta no GitHub + Vercel → verificar se URL funciona
```

### Se veio do Claude Code (projecto individual)
```
git add .
git commit -m "feat: deploy final imersao"
git push origin main
vercel --prod (se nao tiver deploy automatico)
```

---

## Output desta fase

| Output | Formato |
|--------|---------|
| URL final publica por aluno | vercel.app (ou dominio custom) |
| Projecto completo | Codigo no GitHub + deploy |
| Partilha no grupo | URLs no WhatsApp |
