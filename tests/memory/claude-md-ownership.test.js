'use strict';

const fs = require('fs');
const path = require('path');

const CLAUDE_MD_PATH = path.join(__dirname, '..', '..', '.claude', 'CLAUDE.md');

describe('CLAUDE.md Ownership Annotations', () => {
  let content;

  beforeAll(() => {
    content = fs.readFileSync(CLAUDE_MD_PATH, 'utf8');
  });

  test('CLAUDE.md contains FRAMEWORK-OWNED annotations', () => {
    expect(content).toContain('<!-- FRAMEWORK-OWNED:');
  });

  test('CLAUDE.md contains PROJECT-CUSTOMIZED annotations', () => {
    expect(content).toContain('<!-- PROJECT-CUSTOMIZED:');
  });

  test('annotation count matches expected sections (10 framework + 7 project = 17 total)', () => {
    const frameworkMatches = content.match(/<!-- FRAMEWORK-OWNED:/g) || [];
    const projectMatches = content.match(/<!-- PROJECT-CUSTOMIZED:/g) || [];

    // 10 FRAMEWORK-OWNED (post v5.1.15 upgrade): Constitution, Language, CLI First, Estrutura, Boundary, Agentes, Story-Driven, Otimizacao, MCP, + Tool Selection Guidance
    expect(frameworkMatches.length).toBe(10);
    // 7 PROJECT-CUSTOMIZED (post v5.1.15 upgrade): Padroes, Testes, Git, Comandos, Debug, Tool Selection (TOK-2), Workspace Governance Phase A
    expect(projectMatches.length).toBe(7);
  });

  test('framework-owned sections appear before project-customized sections', () => {
    const firstFramework = content.indexOf('<!-- FRAMEWORK-OWNED:');
    const firstProject = content.indexOf('<!-- PROJECT-CUSTOMIZED:');

    expect(firstFramework).toBeGreaterThan(-1);
    expect(firstProject).toBeGreaterThan(-1);
    expect(firstFramework).toBeLessThan(firstProject);
  });
});
