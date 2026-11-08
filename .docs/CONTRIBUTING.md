# 👥 Contributing to Imhotep Finance

We welcome contributions to Imhotep Finance! This guide will help you get started.

## How to Contribute

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/imhotep_finance.git
cd imhotep_finance
```

### 2. Create a Feature Branch

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# For backend features
git checkout -b feature/backend/your-feature-name

# For frontend features
git checkout -b feature/frontend/your-feature-name
```

### 3. Make Your Changes

- Write clean, readable code
- Follow existing code style and patterns
- Add tests for new features
- Update documentation if needed

### 4. Test Your Changes

```bash
# Run backend tests
cd backend/imhotep_finance
python manage.py test

# Run frontend tests
cd frontend/imhotep_finance
npm test
```

### 5. Commit Your Changes

```bash
git add .
git commit -m "Add: description of your changes"
```

**Commit Message Format:**
- `Add:` - New feature
- `Fix:` - Bug fix
- `Update:` - Update existing feature
- `Refactor:` - Code refactoring
- `Docs:` - Documentation changes

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub describing your changes.

## Branch Naming Convention

- **Backend features**: `feature/backend/feature-name`
- **Frontend features**: `feature/frontend/feature-name`
- **Bug fixes**: `fix/issue-description`
- **Documentation**: `docs/documentation-update`

## 🤖 AI Agent Guidelines

If you are developing or contributing using an AI agent (Copilot, Claude, GPT, Antigravity, etc.), you **must strictly follow [AGENTS.md](../AGENTS.md)**.

Key non-negotiable rules for AI agents:
1. **Branch Isolation**: Never commit to `main`; always branch from `main` (`feature/backend/`, `feature/frontend/`, `fix/`, `docs/`, `refactor/`, `test/`).
2. **Descriptive Commits**: Explicitly state what changed, which files were touched, and why.
3. **Mandatory Pre-Commit Test Run**: No commit may be submitted without running the full test suite (`docker exec imhotep_finance-backend-1 python manage.py test --keepdb`) and achieving 100% pass rate.
4. **Mandatory Swagger Annotations**: All new and modified endpoints must include `@extend_schema` with request/response serializers, parameters, and status codes.
5. **Edge Case Test Coverage**: Cover unauthenticated access (401), cross-tenant isolation (403/404), boundary values, malformed inputs, and empty states.
6. **Synchronize `.docs/`**: Update all relevant technical documentation files in `.docs/` matching the code changes made.

---

## Code Style

### Backend (Python/Django)

- Follow PEP 8 style guide
- Use type hints where appropriate
- Write docstrings for functions and classes
- Follow Django best practices

### Frontend (React/JavaScript)

- Use functional components and hooks
- Follow React best practices
- Use meaningful variable and function names
- Add comments for complex logic

## Testing Requirements

- All new features must include tests
- Tests should cover happy path, validation, and error cases
- Maintain or improve test coverage
- All tests must pass before submitting PR

## Documentation

- Update relevant documentation files
- Add comments for complex code
- Update API documentation if endpoints change
- Keep README and guides up to date

## Pull Request Guidelines

### Before Submitting

- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] No merge conflicts with main branch
- [ ] Changes are tested manually

### PR Description

Include:
- Description of changes
- Why the change is needed
- How to test the changes
- Screenshots (for UI changes)
- Related issues (if any)

## Development Setup

See [Setup Guide](SETUP.md) for detailed setup instructions.

## Getting Help

- Check existing documentation in `.docs/`
- Review existing code for patterns
- Open an issue for questions
- Contact: imhoteptech@outlook.com

## Code of Conduct

Please read our [Code of Conduct](../CODE_OF_CONDUCT.md) to understand the expectations for participation in our community.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Imhotep Finance! 🎉
