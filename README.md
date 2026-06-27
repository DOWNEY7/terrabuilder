<p align="center">
  <img src="https://raw.githubusercontent.com/DOWNEY7/terrabuilder/main/apps/web/public/logo.svg" alt="TerraBuilder Logo" width="80" />
</p>

<h1 align="center">TerraBuilder</h1>

<p align="center">
  <strong>Visual Infrastructure-as-Code Compiler</strong><br/>
  Drag-and-drop your cloud architecture — get production-ready Terraform, CloudFormation, or Bicep output instantly.
</p>

<p align="center">
  <a href="https://github.com/DOWNEY7/terrabuilder/actions/workflows/ci.yml">
    <img src="https://github.com/DOWNEY7/terrabuilder/actions/workflows/ci.yml/badge.svg" alt="CI" />
  </a>
  <a href="https://github.com/DOWNEY7/terrabuilder/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
  </a>
  <img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen" alt="Node ≥ 20" />
  <img src="https://img.shields.io/badge/pnpm-%3E%3D9.0.0-orange" alt="pnpm ≥ 9" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
</p>

---

## ✨ Features

| Feature | Details |
|---|---|
| 🎨 **Visual Canvas** | Drag-and-drop cloud resources onto a node-based canvas powered by React Flow |
| ☁️ **Multi-Cloud** | AWS, Azure, and GCP resource schemas out of the box |
| 🔄 **Multi-Format Emit** | Generate Terraform HCL, CloudFormation YAML, or Azure Bicep from the same diagram |
| 🔗 **Smart Dependency Resolution** | Topological sort with Kahn's algorithm automatically wires resource references |
| 🛡️ **Security Scanning** | Built-in static analysis flags misconfigurations before you deploy |
| 📝 **Monaco Editor** | Full syntax-highlighted code preview with copy-to-clipboard |
| ⏪ **Undo / Redo** | Full history stack (Ctrl+Z / Ctrl+Y) across the entire canvas |
| 🗂️ **Template Gallery** | Pre-built architecture templates (VPC, serverless pipeline, etc.) |
| ✅ **Field Validation** | Per-resource field validation with inline error messages |

---

## 🖼️ Screenshots

> _Screenshots coming soon — run the app locally to see it in action!_

---

## 🏗️ Architecture

TerraBuilder is a **Turborepo** monorepo with the following packages:

```
terrabuilder/
├── apps/
│   └── web/                  # Vite + React 19 frontend
├── packages/
│   ├── engine/               # Graph resolver, validator, history, field-validator
│   ├── schemas/              # AWS / Azure / GCP resource schemas & types
│   ├── emitters/             # Code generators (Terraform, CloudFormation, Bicep)
│   └── security/             # Static security analysis rules
├── turbo.json
└── pnpm-workspace.yaml
```

### Key Tech Stack

- **Frontend**: React 19, TypeScript, Zustand, React Flow (`@xyflow/react`), Monaco Editor
- **Styling**: Vanilla CSS (custom design system in `index.css`)
- **Build**: Vite 6, Turborepo 2, pnpm workspaces
- **Testing**: Vitest
- **Lint/Types**: TypeScript strict mode

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) `>= 20.0.0`
- [pnpm](https://pnpm.io/) `>= 9.0.0`

```bash
# Install pnpm if you don't have it
npm install -g pnpm@latest
```

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/DOWNEY7/terrabuilder.git
cd terrabuilder

# 2. Install all workspace dependencies
pnpm install

# 3. Start the development server
pnpm dev
```

The app will be running at **http://localhost:5173** 🎉

### Other Commands

```bash
pnpm build        # Build all packages and the web app
pnpm test         # Run all tests (Vitest)
pnpm type-check   # TypeScript strict type-checking across the monorepo
pnpm lint         # ESLint across all packages
pnpm clean        # Remove all dist/ and .turbo/ caches
```

---

## 🗺️ Roadmap

- [ ] Pulumi output emitter
- [ ] Ansible playbook emitter
- [ ] Real-time collaboration (WebSockets / CRDTs)
- [ ] Import existing Terraform state into the canvas
- [ ] Cost estimation overlay (AWS Pricing API)
- [ ] GitHub Actions workflow generation
- [ ] VS Code extension

See the [open issues](https://github.com/DOWNEY7/terrabuilder/issues) for the full list of proposed features and known bugs.

---

## 🤝 Contributing

Contributions are what make the open-source community amazing. Any contributions you make are **greatly appreciated**.

Please read our [**Contributing Guide**](./CONTRIBUTING.md) before submitting a pull request.

**Quick start for contributors:**

```bash
git checkout -b feat/your-feature-name
# make your changes
pnpm test && pnpm type-check
git commit -m "feat: add your feature"
git push origin feat/your-feature-name
# open a Pull Request
```

We follow [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

---

## 🙏 Acknowledgements

- [React Flow](https://reactflow.dev/) — the incredible node-based canvas library
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — VS Code's editor in the browser
- [Turborepo](https://turbo.build/) — high-performance monorepo build system
- [Lucide React](https://lucide.dev/) — beautiful icon library
- [Zustand](https://github.com/pmndrs/zustand) — lightweight state management

---

<p align="center">Made with ❤️ by <a href="https://github.com/DOWNEY7">Farid Downey</a> and contributors</p>
