# Contributing Guidelines

Thank you for your interest in contributing to this project! We welcome contributions of all kinds, including bug reports, feature requests, documentation improvements, and code contributions.

## Code of Conduct

Please be respectful and constructive in all interactions with the community. We are committed to providing a welcoming and inclusive environment for all contributors.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10+
- Git

### Installation

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/monorepo.git`
3. Navigate to the project directory: `cd monorepo`
4. Install dependencies: `pnpm install`

## Development Workflow

### Running the Project

```bash
# Run all development servers
pnpm dev

# Run a specific package
cd apps/cli
pnpm dev
```

### Building

```bash
# Build all packages
pnpm build

# Build a specific package
cd packages/utils
pnpm build
```

### Linting & Formatting

```bash
# Lint all packages
pnpm lint

# Format code
pnpm format
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for a specific package
cd packages/utils
pnpm test
```

## Making Changes

### Branch Naming

Use descriptive branch names following the [semantic branch naming](https://gist.github.com/seunggabi/87f8c722d35cd07deb3f649d45a31082#semantic-branch-names) pattern:

- Feature: `feature/description-of-feature`
- Bug fix: `fix/description-of-bug`
- Documentation: `docs/description-of-change`
- Chore: `chore/description-of-task`

Example: `feature/add-new-utility-function`

### Commit Messages

Follow [conventional commit format](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716#semantic-commit-messages):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring without feature changes
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling

**Scope:** Package name (e.g., `cli`, `utils`, `config`)

**Examples:**
```
feat(cli): add new command option
fix(utils): correct edge case in helper function
docs(readme): update installation instructions
chore(deps): update TypeScript to v5.3
```

### Code Style

- Use TypeScript with strict mode enabled
- Follow the existing code style and conventions
- Use meaningful variable and function names
- Add comments for complex logic (reference: [The Art of Code Comments](https://www.alibabacloud.com/blog/the-art-of-code-comments-does-good-code-need-comments_600184))
- Keep functions small and focused

### Testing

- Write tests for new features
- Ensure all existing tests pass
- Aim for good test coverage
- Use descriptive test names

```bash
pnpm test
```

## Submitting Changes

### Before Submitting

1. Ensure your code follows the project's style guidelines
2. Run linting and formatting: `pnpm lint && pnpm format`
3. Run tests: `pnpm test`
4. Build the project: `pnpm build`
5. Update documentation if necessary

### Pull Request Process

1. Create a pull request against the `main` branch
2. Provide a clear description of your changes
3. Reference any related issues: `Fixes #123`
4. Ensure CI passes
5. Request review from maintainers
6. Address feedback and requested changes

### PR Template

When you create a pull request, GitHub will automatically populate the description using our [pull request template](./pull_request_template.md). Please fill out all sections completely.

## Docker Contributions

If contributing to Docker-related changes:

```bash
# Build Docker images
pnpm docker:build

# Start services
pnpm docker:up

# Development with hot reload
pnpm docker:dev

# Stop services
pnpm docker:down
```

See [docker/README.md](../docker/README.md) for detailed Docker documentation.

## Project Structure

```
.
├── apps/          # Applications (CLI, Web, etc.)
├── packages/      # Shared libraries
├── docker/        # Docker configuration
├── .github/       # GitHub workflows and templates
└── README.md      # Project documentation
```

## Questions or Need Help?

- Check existing [issues](https://github.com/Mirasaki-OSS/monorepo-template/issues)
- Review the [README.md](../README.md)
- Read the [docker/README.md](../docker/README.md)
- Unable to figure it out? [Ask us](https://github.com/Mirasaki-OSS/monorepo-template/discussions)

## License

By contributing to this project, you agree that your contributions will be licensed under its [License](../LICENSE).

---

Thank you for contributing! We appreciate your efforts to make this project better.
