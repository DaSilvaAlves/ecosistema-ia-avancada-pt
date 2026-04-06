# Contributing to Synkra AIOX

Thank you for your interest in contributing to AIOX.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feat/your-feature`

## Development Workflow

AIOX follows **Story-Driven Development**. All changes must be associated with a story.

### Before You Code

1. Check existing stories in `docs/stories/`
2. If no story exists for your change, open an issue first
3. Follow the agent authority model (see below)

### Code Standards

- ES2022 syntax with CommonJS modules
- 2-space indentation, single quotes, semicolons
- kebab-case files, PascalCase components, SCREAMING_SNAKE_CASE constants
- Absolute imports with `@/` alias
- No `any` types in TypeScript

### Quality Gates

All changes must pass before submission:

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript
npm test              # Jest
```

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new workflow engine
fix: resolve token extraction edge case
docs: update agent documentation
test: add coverage for config loader
chore: update dependencies
refactor: simplify elicitation engine
```

### Agent Contributions

AIOX uses a multi-agent architecture. When contributing agents:

1. Follow the schema in `.aiox-core/development/agents/`
2. Include all required YAML frontmatter fields
3. Run `npm run validate:agents` to verify structure
4. Run `npm run sync:ide` to sync across IDEs

### Squad Contributions

To contribute a new squad (expansion pack):

1. Use the `_example` squad as a template in `squads/`
2. Follow the PR template in `.github/PULL_REQUEST_TEMPLATE/squad.md`
3. Include documentation and tests

## Pull Requests

1. Keep PRs focused on a single change
2. Update relevant documentation
3. Add tests for new functionality
4. Ensure all quality gates pass
5. Use the appropriate PR template

## Reporting Issues

Use the issue templates provided:

- **Bug Report** - For bugs and regressions
- **Feature Request** - For new features and enhancements
- **Test Coverage** - For missing test coverage
- **Squad Proposal** - For new squad ideas

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
