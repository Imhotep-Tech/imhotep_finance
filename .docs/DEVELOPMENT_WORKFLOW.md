# 🧱 Development Workflow

Overview of the development workflow and practices for Imhotep Finance.

## Development Practices

### Parallel Development

- Frontend and backend can be developed in parallel
- Use feature branches for isolation
- Coordinate API contracts between teams

### API Documentation

- Every backend endpoint is automatically documented in Swagger
- Use `@extend_schema` decorator for detailed documentation
- API schema is generated automatically from code

### Docker Development

- Docker Compose ensures consistent local and production-like environment
- Hot reloading enabled for both frontend and backend
- Easy to share development environment with team

### Version Control

- Use feature branches for all changes
- Commit frequently with meaningful messages
- Create Pull Requests for code review
- Merge to main after review and approval

## Continuous Integration

GitHub Actions runs automatically on:

- **Every Pull Request**: Runs test suite and linting
- **Pushes to main**: Full test suite and build verification
- **Scheduled runs**: Optional scheduled test runs

### CI Pipeline

1. **Backend Tests**: Django test suite
2. **Frontend Tests**: React test suite (if configured)
3. **Linting**: Code style checks
4. **Build Verification**: Ensure project builds successfully

## Development Environment

### Local Development

```bash
# Start development environment
docker compose up --build

# Backend runs on http://localhost:8000
# Frontend runs on http://localhost:3000
```

### Hot Reloading

- **Backend**: Django development server with auto-reload
- **Frontend**: Vite dev server with HMR (Hot Module Replacement)
- Changes are reflected immediately without restart

### Debugging

- **Backend**: Use Django debug toolbar and logging
- **Frontend**: Use React DevTools and browser console
- **API**: Use Swagger UI for interactive testing

## Code Organization

### Backend Structure

- Each feature has its own Django app
- Business logic in `services.py`
- API endpoints in `apis.py`
- Data queries in `selectors.py` (where applicable)
- Tests in `tests/` package

### Frontend Structure

- Components organized by feature/type
- Shared components in `components/common/`
- Page components in `pages/`
- Context providers in `contexts/`
- Utilities in `utils/`

## Testing Workflow

1. **Write tests first** (TDD approach recommended)
2. **Run tests frequently** during development
3. **Ensure all tests pass** before committing
4. **Add tests for new features** before submitting PR

See [Testing Guide](TESTING.md) for detailed testing information.

## Deployment Workflow

1. **Development**: Local development with Docker
2. **Testing**: Run full test suite
3. **Staging**: Deploy to staging environment (if available)
4. **Production**: Deploy to production after approval

## Best Practices

### Code Quality

- Write clean, readable code
- Follow existing patterns and conventions
- Add comments for complex logic
- Keep functions focused and small

### Git Workflow

- Create feature branches from main
- Commit frequently with clear messages
- Keep commits focused on single changes
- Rebase before creating PR (if needed)

### API Development

- Design APIs with versioning in mind
- Document all endpoints in Swagger
- Handle errors gracefully
- Return consistent response formats

### Frontend Development

- Use React hooks for state management
- Keep components small and focused
- Reuse common components
- Follow accessibility best practices

## Tools and Resources

### Development Tools

- **Docker**: Containerization and environment management
- **Swagger UI**: API documentation and testing
- **React DevTools**: Frontend debugging
- **Django Debug Toolbar**: Backend debugging

### Documentation

- **`.docs/`**: Complete project documentation
- **Swagger UI**: Interactive API documentation
- **README.md**: Project overview and quick start

## Getting Help

- Review documentation in `.docs/` folder
- Check existing code for patterns
- Use Swagger UI to understand APIs
- Open an issue for questions

---

For more information:
- [Setup Guide](SETUP.md) - Development environment setup
- [Testing Guide](TESTING.md) - Testing practices
- [Contributing Guide](CONTRIBUTING.md) - Contribution guidelines
