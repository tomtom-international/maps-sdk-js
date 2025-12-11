# Contributing to TomTom Maps SDK for JavaScript

Thank you for your interest in contributing to the TomTom Maps SDK for JavaScript! We welcome contributions from the community to help improve the SDK.

> **📖 For detailed development guides**, see [documentation/development/](./documentation/development/)

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Quick Start](#quick-start)
- [Contribution Workflow](#contribution-workflow)
- [Pull Request Process](#pull-request-process)
- [License and Copyright](#license-and-copyright)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and professional in all interactions.

## How Can I Contribute?

We welcome the following types of contributions:

- **Bug reports / feature suggestions** – create an issue
- **Bug fixes / doc improvements / examples** – create a PR (see PR section for detailed info)

**Note**: Due to the proprietary nature of this SDK (see [LICENSE.txt](./LICENSE.txt)), all contributions must comply with the license terms. By contributing, you agree that your contributions will be licensed under the same terms as the project.

## Quick Start

1. **Fork the repository** - Create your own fork to work on
2. **Check existing issues** - Look for issues labeled `good first issue` or `help wanted`
3. **Set up development environment** - See [documentation/development/GETTING_STARTED.md](./documentation/development/GETTING_STARTED.md)
4. **Read development guides**:
   - [BUILD.md](./documentation/development/BUILD.md) - Building the SDK
   - [TESTING.md](./documentation/development/TESTING.md) - Running tests
   - [QUALITY.md](./documentation/development/QUALITY.md) - Code quality guidelines

### Quick Setup

```bash
git clone https://github.com/YOUR_USERNAME/maps-sdk-js.git
cd maps-sdk-js
pnpm install
pnpm build
```

For detailed setup instructions, troubleshooting, and available commands, see [documentation/development/GETTING_STARTED.md](./documentation/development/GETTING_STARTED.md).

## Contribution Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   Use prefixes: `feature/`, `fix/`, `docs/`, or `refactor/`

2. **Make your changes** following our quality guidelines (see [QUALITY.md](./documentation/development/QUALITY.md))

3. **Write or update tests** (see [testing.md](./documentation/development/testing.md))

4. **Run quality checks**:
   ```bash
   pnpm test
   pnpm lint:fix
   pnpm type-check
   ```

5. **Commit your changes** with clear, descriptive commit messages

6. **Push to your fork** and open a Pull Request

For detailed workflow information, see [documentation/development/](./documentation/development/).

## Pull Request Process

### Before Submitting
- [ ] All tests pass locally
- [ ] Code follows the style guidelines
- [ ] Linting and formatting have been applied
- [ ] Type checking passes
- [ ] Documentation has been updated (if applicable)
- [ ] Examples have been updated or added (if applicable)

### PR Description
Your pull request should include:
- **Clear title** summarizing the change
- **Description** of what changed and why
- **Related issues** - Reference any related issues (e.g., "Fixes #123")
- **Testing** - Describe how you tested your changes
- **Screenshots** - Include screenshots for UI changes (if applicable)

### After Approval
- Maintainers will merge your PR
- Your contribution will be included in the next release
- You'll be credited in the release notes (if applicable)

## License and Copyright

### Important Notes on Licensing

This SDK is distributed under a proprietary license (see [LICENSE.txt](./LICENSE.txt)). By contributing to this project:

1. **You retain copyright** to your contributions
2. **You grant TomTom** a perpetual, worldwide, non-exclusive, royalty-free, irrevocable license to use, reproduce, modify, and distribute your contributions as part of the SDK
3. **You confirm** that you have the right to submit your contributions and grant this license
4. **You understand** that your contributions will be distributed under the same license terms as the project

### Contributor License Agreement (CLA)

For significant contributions, TomTom may require you to sign a Contributor License Agreement (CLA). This ensures that:
- You have the rights to contribute the code
- TomTom has the rights to distribute your contributions
- The project remains legally safe for all users

You will be notified if a CLA is required for your contribution.

---

## Questions?

If you have questions about contributing, please:
- Open a discussion in the repository
- Comment on a related issue
- Reach out to the maintainers

Thank you for contributing to TomTom Maps SDK for JavaScript! 🎉
