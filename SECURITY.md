# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 5.x     | Yes       |
| 4.x     | Security fixes only |
| < 4.0   | No        |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

**Do NOT open a public issue.**

Instead, email security concerns to the maintainers via GitHub's private vulnerability reporting:

1. Go to the [Security tab](https://github.com/SynkraAI/aiox-core/security)
2. Click "Report a vulnerability"
3. Provide a detailed description of the issue

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

| Action | Timeline |
|--------|----------|
| Acknowledgment | Within 48 hours |
| Initial assessment | Within 7 days |
| Fix and release | Within 30 days for critical issues |

## Security Measures

AIOX includes several security features:

- **Agent Authority Boundaries** - Agents cannot exceed their defined permissions
- **Constitutional Governance** - Automated gates prevent unauthorized operations
- **CodeQL Analysis** - Automated security scanning via GitHub Actions
- **Dependency Auditing** - Dependabot monitors for vulnerable dependencies
- **Input Validation** - YAML and configuration validation with schema enforcement
