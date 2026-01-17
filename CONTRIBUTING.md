# Contributing to Meu Contador

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## 🚀 Quick Start

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/meu-contador.git
   cd meu-contador
   ```
3. **Install dependencies**:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```
4. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## 📋 Development Workflow

### 1. Before You Start

- Check existing issues and PRs
- Discuss major changes in an issue first
- Follow the code style and conventions

### 2. Making Changes

```bash
# Start development servers
npm run dev:frontend  # Terminal 1
npm run dev:backend   # Terminal 2

# Make your changes
# ...

# Run quality checks
cd frontend
npm run lint          # ESLint
npm run build         # Build verification
npm test              # Run tests
```

### 3. Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semicolons, etc.
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

**Examples**:

```bash
git commit -m "feat: add multi-currency support to investments"
git commit -m "fix: resolve type error in AuthContext"
git commit -m "docs: update README with setup instructions"
```

### 4. Pull Request Process

1. **Update your branch**:

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your changes**:

   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request**:

   - Use a clear, descriptive title
   - Fill out the PR template
   - Link related issues
   - Request review from maintainers

4. **CI/CD Checks**:

   - ✅ ESLint must pass
   - ✅ TypeScript must compile
   - ✅ Build must succeed
   - ✅ Tests must pass (if applicable)

5. **Code Review**:
   - Address review comments
   - Keep discussions focused
   - Be respectful and constructive

---

## 🎯 Code Quality Standards

### TypeScript

- **Zero `any` types** - Use proper typing
- **Strict mode enabled** - No implicit any
- **Interfaces over types** - For object shapes

### React

- **Functional components** - Use hooks
- **TypeScript** - All components typed
- **Props interfaces** - Define prop types

### Code Style

- **ESLint** - Follow configured rules
- **Prettier** - Auto-formatting (if configured)
- **Naming conventions**:
  - Components: `PascalCase`
  - Functions: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Files: `kebab-case.tsx`

### Testing

- **Unit tests** - For utilities and hooks
- **Integration tests** - For components
- **Test coverage** - Aim for 40%+ on new code

---

## 📁 Project Structure

```
meu-contador/
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── features/       # Feature modules
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilities
│   │   ├── context/        # React contexts
│   │   └── types/          # TypeScript types
│   ├── public/             # Static assets
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── controllers/    # Business logic
│   │   └── models/         # Data models
│   └── package.json
└── .github/
    └── workflows/          # CI/CD pipelines
```

---

## 🧪 Testing Guidelines

### Writing Tests

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("ComponentName", () => {
  it("should render correctly", () => {
    render(<ComponentName />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
npm test              # Watch mode
npm test -- --run     # Single run
npm run test:coverage # With coverage
```

---

## 🐛 Bug Reports

**Before submitting**:

- Search existing issues
- Check if it's already fixed in `main`
- Reproduce in latest version

**Include**:

- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment (OS, browser, Node version)

---

## 💡 Feature Requests

**Before submitting**:

- Check roadmap and existing issues
- Discuss in Discussions first

**Include**:

- Clear use case
- Proposed solution
- Alternatives considered
- Mockups/examples (if applicable)

---

## 📝 Documentation

- Update README if adding features
- Add JSDoc comments for complex functions
- Update type definitions
- Include examples in docs

---

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the project's license.

---

## 🙏 Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort!

**Questions?** Open a discussion or reach out to maintainers.
