# Contributing to TerraBuilder

First off — **thank you** for taking the time to contribute! 🎉

TerraBuilder is an open-source project and we welcome contributions of all kinds: bug fixes, new features, documentation improvements, new resource schemas, and new emitters.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [Adding a New Cloud Resource](#adding-a-new-cloud-resource)
- [Adding a New Emitter](#adding-a-new-emitter)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

---

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/) Code of Conduct. By participating, you are expected to uphold this standard. Please report unacceptable behavior to the maintainers.

---

## Getting Started

### Prerequisites

- **Node.js** `>= 20.0.0`
- **pnpm** `>= 9.0.0`

```bash
# Install pnpm if you don't have it
npm install -g pnpm@latest
```

### Fork & Clone

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/terrabuilder.git
cd terrabuilder

# 2. Add upstream remote
git remote add upstream https://github.com/DOWNEY7/terrabuilder.git

# 3. Install dependencies
pnpm install

# 4. Start the dev server
pnpm dev
```

---

## Development Workflow

```bash
# Always create a new branch from main
git checkout main
git pull upstream main
git checkout -b feat/your-feature-name

# Run tests while you develop
pnpm test:watch

# Before committing, make sure these all pass
pnpm type-check
pnpm test
pnpm lint
```

---

## Commit Message Convention

We follow **[Conventional Commits](https://www.conventionalcommits.org/)**:

```
<type>(optional scope): <short description>

[optional body]
[optional footer]
```

**Types:**

| Type | When to use |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `style` | Formatting, no logic change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or fixing tests |
| `chore` | Build process or tooling changes |

**Examples:**

```
feat(schemas): add aws_elasticache_cluster resource
fix(engine): handle cycles in topological sort gracefully
docs: update getting started guide
```

---

## Pull Request Process

1. Ensure your branch is up to date with `upstream/main`
2. Make sure `pnpm type-check && pnpm test && pnpm lint` all pass
3. Write a clear PR description explaining **what** changed and **why**
4. Link any related issues with `Closes #<issue-number>`
5. Request a review from a maintainer
6. After approval, we'll squash-merge your PR

---

## Project Structure

```
terrabuilder/
├── apps/
│   └── web/src/
│       ├── canvas/         # React Flow canvas nodes & edges
│       ├── panels/         # Toolbar, Sidebar, Properties, BottomPanel, TemplateGallery
│       ├── store/          # Zustand canvas state
│       └── hooks/          # Custom React hooks
├── packages/
│   ├── engine/src/
│   │   ├── graph.ts        # TBNode / TBEdge / TBCanvas types
│   │   ├── resolver.ts     # Dependency resolver (topological sort)
│   │   ├── validator.ts    # Canvas-level validation
│   │   ├── fieldValidator.ts # Per-field validation rules
│   │   └── history.ts      # Undo/redo history stack
│   ├── schemas/src/
│   │   ├── aws/            # AWS resource definitions
│   │   ├── azure/          # Azure resource definitions
│   │   ├── gcp/            # GCP resource definitions
│   │   └── types.ts        # ResourceSchema type definitions
│   ├── emitters/src/       # Code generators (Terraform, CloudFormation, Bicep)
│   └── security/src/       # Static security analysis rules
```

---

## Adding a New Cloud Resource

1. Open the relevant schema file in `packages/schemas/src/<cloud>/`
2. Add a new entry following the `ResourceSchema` type in `types.ts`
3. Add any relationship mappings in `packages/engine/src/resolver.ts`
4. Add a security rule in `packages/security/src/` if appropriate
5. Write a test in `packages/schemas/src/__tests__/`

---

## Adding a New Emitter

1. Create a new file in `packages/emitters/src/`, e.g. `pulumi.ts`
2. Export a function with the signature `(canvas: TBCanvas) => string`
3. Export it from `packages/emitters/src/index.ts`
4. Wire it into the `BottomPanel` tab in `apps/web/src/panels/BottomPanel.tsx`
5. Add tests in `packages/emitters/src/__tests__/`

---

## Reporting Bugs

Please use the **[Bug Report](.github/ISSUE_TEMPLATE/bug_report.md)** issue template. Include:
- Steps to reproduce
- Expected vs actual behaviour
- Browser & OS version
- Console errors (if any)

## Requesting Features

Please use the **[Feature Request](.github/ISSUE_TEMPLATE/feature_request.md)** issue template.

---

Thank you for contributing to TerraBuilder! 🚀
