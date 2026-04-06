<p align="center">
  <img src=".png" alt="Synkra AIOX" width="400" />
</p>

<h1 align="center">Synkra AIOX</h1>

<p align="center">
  <strong>AI-Orchestrated System for Full Stack Development</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/aiox-core"><img src="https://img.shields.io/npm/v/aiox-core?style=flat-square&color=00F5FF" alt="npm version" /></a>
  <a href="https://github.com/SynkraAI/aiox-core/blob/main/LICENSE"><img src="https://img.shields.io/github/license/SynkraAI/aiox-core?style=flat-square&color=9D00FF" alt="license" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-39FF14?style=flat-square" alt="node" /></a>
  <a href="https://github.com/SynkraAI/aiox-core/actions"><img src="https://img.shields.io/github/actions/workflow/status/SynkraAI/aiox-core/ci.yml?style=flat-square&label=CI" alt="CI" /></a>
</p>

<p align="center">
  A multi-agent orchestration framework that brings structure, governance, and automation to AI-assisted software development. Install once, orchestrate everywhere.
</p>

---

## What is AIOX?

AIOX is a **CLI-first framework** that transforms how teams build software with AI. Instead of one-shot prompting, AIOX provides:

- **12 specialized AI agents** with defined roles, authority boundaries, and collaboration protocols
- **205+ reusable tasks** covering the full development lifecycle
- **15 workflow definitions** from greenfield to brownfield, spec to deploy
- **Multi-IDE sync** across Claude Code, Codex CLI, Gemini CLI, GitHub Copilot, Cursor, and Antigravity
- **Constitutional governance** with automated quality gates
- **Story-driven development** with traceable progress

```
CLI First > Observability Second > UI Third
```

## Quick Start

```bash
# Install in an existing project
npx aiox-core@latest

# Create a new project
npx aiox-core@latest init my-project

# Verify installation
npx aiox-core@latest doctor
```

## Architecture

```
.aiox-core/
  core/             # Runtime: config, sessions, elicitation engine
  development/
    agents/         # 12 agent definitions (YAML frontmatter + markdown)
    tasks/          # 205+ task files (inputs, outputs, pre/post-conditions)
    templates/      # 11 templates (stories, components, tokens, migrations)
    checklists/     # 5 quality checklists (audit, a11y, migration, components)
    workflows/      # 15 workflow chains (SDC, QA Loop, Spec Pipeline, etc.)
  infrastructure/
    scripts/        # IDE sync, validation, publishing
    templates/      # GitHub Actions workflow templates
    integrations/   # AI provider adapters, PM tool connectors
  schemas/          # JSON Schema validation for agents, tasks, configs
  presets/          # Configuration presets
bin/
  aiox.js           # Main CLI entry point
  aiox-init.js      # Project initialization wizard
  aiox-graph.js     # Dependency graph visualization
  aiox-ids.js       # Entity registry operations
squads/             # Expansion packs (domain-specific agent teams)
```

## Agents

AIOX ships with 12 agents, each with a persona, commands, and strict authority boundaries:

| Agent | Persona | Role | Key Commands |
|-------|---------|------|--------------|
| `@aiox-master` | Orion | Framework governance | `*validate-agents`, `*sync` |
| `@dev` | Dex | Implementation | `*develop`, `*commit` |
| `@qa` | Quinn | Quality assurance | `*qa-gate`, `*qa-loop` |
| `@architect` | Aria | System design | `*analyze-impact`, `*assess` |
| `@pm` | Morgan | Product management | `*create-epic`, `*execute-epic` |
| `@po` | Pax | Product ownership | `*validate-story-draft` |
| `@sm` | River | Scrum mastery | `*draft`, `*create-story` |
| `@analyst` | Alex | Research & analysis | `*research`, `*brainstorm` |
| `@data-engineer` | Dara | Database design | `*db-domain-modeling`, `*migrate` |
| `@ux-design-expert` | Uma | UX/UI & design systems | `*audit`, `*tokenize`, `*build` |
| `@devops` | Gage | CI/CD & git ops | `*push`, `*setup-ci` |
| `@squad-creator` | Craft | Squad creation | `*create-squad` |

**Authority is enforced:** only `@devops` can push to remote. Only `@sm` creates stories. Only `@po` validates them. Agents delegate when work falls outside their scope.

## Workflows

### Story Development Cycle (primary)

```
@sm *draft  >  @po *validate  >  @dev *develop  >  @qa *qa-gate  >  @devops *push
```

### All Workflows

| Workflow | Use Case |
|----------|----------|
| `story-development-cycle` | Standard feature development |
| `qa-loop` | Iterative review-fix cycles (max 5 iterations) |
| `spec-pipeline` | Requirements to executable spec |
| `brownfield-discovery` | Legacy codebase assessment |
| `greenfield-fullstack` | New full-stack project |
| `greenfield-service` | New backend service |
| `greenfield-ui` | New frontend application |
| `brownfield-fullstack` | Existing full-stack modernization |
| `brownfield-service` | Existing backend modernization |
| `brownfield-ui` | Existing frontend modernization |
| `design-system-build-quality` | Design system pipeline |
| `epic-orchestration` | Multi-story epic management |
| `development-cycle` | Generic development loop |
| `auto-worktree` | Isolated git worktree automation |

## Multi-IDE Support

AIOX syncs agents, rules, and commands across all major AI-assisted IDEs:

```bash
npm run sync:ide                    # Sync all IDEs
npm run sync:ide:claude             # Claude Code only
npm run sync:ide:codex              # Codex CLI only
npm run sync:ide:gemini             # Gemini CLI only
npm run sync:ide:cursor             # Cursor only
npm run sync:ide:github-copilot     # GitHub Copilot only
npm run sync:ide:antigravity        # Antigravity only
npm run validate:parity             # Verify cross-IDE consistency
```

## Squads

Squads are expansion packs: domain-specific agent teams that extend AIOX capabilities.

| Squad | Description |
|-------|-------------|
| `aiox-mastery` | Advanced AIOX framework operations |
| `claude-code-mastery` | Claude Code optimization |
| `n8n-content-pipeline` | n8n workflow automation |

Create custom squads:

```bash
@squad-creator *create-squad my-domain
```

## Constitution

AIOX enforces a formal constitution with automated gates:

| Article | Principle | Severity |
|---------|-----------|----------|
| I | CLI First | NON-NEGOTIABLE |
| II | Agent Authority | NON-NEGOTIABLE |
| III | Story-Driven Development | MUST |
| IV | No Invention | MUST |
| V | Quality First | MUST |
| VI | Absolute Imports | SHOULD |

Quality gates run automatically:

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript
npm test              # Jest
```

## CLI Commands

```bash
npx aiox-core@latest install        # Install in current project
npx aiox-core@latest init <name>    # Create new project
npx aiox-core@latest update         # Update to latest version
npx aiox-core@latest validate       # Validate installation integrity
npx aiox-core@latest doctor         # Run diagnostics
npx aiox-core@latest info           # Show system info
npx aiox-core@latest --version      # Show version

# Configuration
aiox config show                    # Show resolved configuration
aiox config validate                # Validate config files
aiox config migrate                 # Migrate monolithic to layered

# Service Discovery
aiox workers search <query>         # Search for workers
```

## CI/CD

AIOX includes GitHub Actions workflows:

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | Continuous integration (lint, typecheck, test) |
| `test.yml` | Test suite execution |
| `release.yml` | Semantic release automation |
| `npm-publish.yml` | NPM package publishing |
| `codeql.yml` | Security analysis |
| `pr-automation.yml` | PR labeling and automation |

## Development

```bash
# Clone
git clone https://github.com/SynkraAI/aiox-core.git
cd aiox-core

# Install dependencies
npm install

# Run tests
npm test

# Lint
npm run lint

# Type check
npm run typecheck

# Validate agents
npm run validate:agents

# Sync IDE integrations
npm run sync:ide
```

## Requirements

- Node.js >= 18.0.0
- npm >= 9.0.0

## License

[MIT](LICENSE)

---

<p align="center">
  <strong>Synkra AIOX</strong> &mdash; CLI First | Observability Second | UI Third
</p>
