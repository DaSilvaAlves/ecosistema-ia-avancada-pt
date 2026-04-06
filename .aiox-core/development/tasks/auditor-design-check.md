---
task: Auditor Design Check
responsavel: "@aiox-auditor"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - path: Caminho do ficheiro HTML/CSS a verificar
Saida: |
  - cores_proibidas: Cores fora da paleta oficial encontradas com localização
  - fontes_erradas: Famílias de fonte não permitidas detectadas
  - glassmorphism_em_falta: Cards/superfícies sem glassmorphism obrigatório
Checklist:
  - "[ ] Scan for colors not in official palette (#04040A, #F0F4FF, #00F5FF, #FFB800, #9D00FF, #FF006E, #39FF14, #8892A4, #4A5568)"
  - "[ ] Check font families (only Inter and JetBrains Mono allowed)"
  - "[ ] Verify glassmorphism on elevated surfaces (background + border + backdrop-filter)"
  - "[ ] Check border-radius minimums (8px cards, 20px badges)"
  - "[ ] Verify dark background (#04040A) — no light mode"
---

# *design-check

Verifica conformidade de ficheiros HTML/CSS com o Design System [IA]AVANÇADA PT. Detecta cores fora da paleta, fontes não permitidas e ausência de glassmorphism obrigatório.

## Usage

```
*design-check {path}
```

## Flow

1. Elicitar path se não fornecido
2. Carregar ficheiro HTML/CSS alvo
3. Varrer por cores fora da paleta oficial (9 cores permitidas)
4. Verificar famílias de fonte (apenas Inter e JetBrains Mono)
5. Identificar superfícies elevadas sem glassmorphism
6. Verificar border-radius mínimos
7. Confirmar fundo escuro `#04040A` — sem light mode
8. Reportar cada violação com localização (linha) e correcção

## Output

Lista de violações do design system com localização exacta, valor problemático e valor correcto segundo as regras do brandbook [IA]AVANÇADA PT.
