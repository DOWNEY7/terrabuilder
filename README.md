<p align="center">
  <img src="https://raw.githubusercontent.com/DOWNEY7/terrabuilder/main/apps/web/public/logo.svg" alt="TerraBuilder Logo" width="96" />
</p>

<h1 align="center">TerraBuilder v0.2.0</h1>

<p align="center">
  <strong>Visual Infrastructure-as-Code Compiler</strong><br/>
  Drag-and-drop your cloud architecture — get production-ready Terraform, CloudFormation, Bicep, or Pulumi output instantly.
</p>

<p align="center">
  <a href="https://github.com/DOWNEY7/terrabuilder/actions/workflows/ci.yml">
    <img src="https://github.com/DOWNEY7/terrabuilder/actions/workflows/ci.yml/badge.svg" alt="CI Status" />
  </a>
  <a href="https://github.com/DOWNEY7/terrabuilder/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
  </a>
  <img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen" alt="Node ≥ 20" />
  <img src="https://img.shields.io/badge/pnpm-%3E%3D9.0.0-orange" alt="pnpm ≥ 9" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white" alt="TypeScript 5.9" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" />
</p>

---

## What is TerraBuilder?

TerraBuilder is an open-source, browser-based tool that lets you **visually design cloud infrastructure** and compile it directly to Infrastructure-as-Code. Instead of hand-writing HCL, YAML, Bicep, or TypeScript from scratch, you drag resources onto a canvas, connect them, configure their properties, and TerraBuilder generates valid, production-ready code in seconds.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎨 **Visual Canvas** | Node-based drag-and-drop canvas powered by React Flow |
| ☁️ **Multi-Cloud** | AWS, Azure, and GCP resource schemas included |
| 🔄 **4 Multi-Format Emitters** | Generate Terraform HCL, CloudFormation YAML, Azure Bicep, or **Pulumi TypeScript** |
| 📦 **Project Bundle Exporter** | Export multi-file project bundles (\`main.tf\`, \`variables.tf\`, \`outputs.tf\`, \`provider.tf\`, CI Workflows, \`Pulumi.yaml\`) |
| 📸 **Architecture Screenshot Export** | Export architecture diagrams directly to SVG/PNG for GitHub READMEs & docs |
| 💰 **Live Cost Estimator** | Real-time monthly pricing calculations per resource & canvas total |
| 🔗 **Smart Dependency Resolution** | Topological sort (Kahn's algorithm) auto-wires resource references |
| 🛡️ **Security Scanning** | Built-in static analysis flags misconfigurations before deployment |
| 📝 **Monaco Editor** | Syntax-highlighted code preview with copy-to-clipboard |
| ⏪ **Undo / Redo** | Full history stack (\`Ctrl+Z\` / \`Ctrl+Y\`) across the canvas |
| 🗂️ **Template Gallery** | Pre-built architecture templates (VPC, serverless pipeline, and more) |
| ✅ **Field Validation** | Per-resource validation with clear inline error messages |

---

## 🏗️ Architecture

TerraBuilder is a **Turborepo monorepo** structured as follows:

\`\`\`
terrabuilder/
├── apps/
│   └── web/                  # Vite 6 + React 19 frontend
├── packages/
│   ├── engine/               # Graph resolver, validator, history stack, cost estimator
│   ├── schemas/              # AWS / Azure / GCP resource schemas & types
│   ├── emitters/             # Code generators: Terraform, CloudFormation, Bicep, Pulumi & Zip Bundler
│   └── security/             # Static security analysis & auto-fix rules
├── turbo.json
└── pnpm-workspace.yaml
\`\`\`

### Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Zustand, React Flow, Monaco Editor |
| **Styling** | Vanilla CSS (custom design system) |
| **Build** | Vite 6, Turborepo 2, pnpm workspaces |
| **Testing** | Vitest |
| **Quality** | TypeScript strict mode, ESLint |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) `>= 20.0.0`
- [pnpm](https://pnpm.io/) `>= 9.0.0`

\`\`\`bash
# Install pnpm if you don't already have it
npm install -g pnpm@latest
\`\`\`

### Installation

\`\`\`bash
# 1. Clone the repository
git clone https://github.com/DOWNEY7/terrabuilder.git
cd terrabuilder

# 2. Install workspace dependencies
pnpm install

# 3. Start the development server
pnpm dev
\`\`\`

The app will be running at **http://localhost:5173** 🎉

### Available Scripts

\`\`\`bash
pnpm dev          # Start the development server
pnpm build        # Build all packages and the web app
pnpm test         # Run all tests (Vitest)
pnpm type-check   # TypeScript strict type-check across the monorepo
pnpm lint         # ESLint across all packages
pnpm clean        # Remove all dist/ and .turbo/ caches
\`\`\`

---

## 🗺️ Roadmap

- [x] Terraform HCL emitter
- [x] CloudFormation YAML emitter
- [x] Azure Bicep emitter
- [x] Pulumi TypeScript emitter
- [x] Architecture Diagram image export
- [x] Multi-file project bundler
- [x] Cost estimation engine
- [ ] Ansible playbook emitter
- [ ] Real-time collaboration (WebSockets / CRDTs)
- [ ] Import existing Terraform state into the canvas
- [ ] VS Code extension

---

## 🤝 Contributing

Contributions of all kinds are welcome — bug fixes, new features, documentation, new resource schemas, or new emitters.

Please read the [**Contributing Guide**](./CONTRIBUTING.md) before submitting a pull request.

\`\`\`bash
# Quick contributor workflow
git checkout -b feat/your-feature-name
# make your changes
pnpm test && pnpm type-check
git commit -m "feat: describe your change"
git push origin feat/your-feature-name
# open a Pull Request on GitHub
\`\`\`

We follow [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages.

---

## 📄 License

Distributed under the **MIT License**. See [\`LICENSE\`](./LICENSE) for details.

---

## 🙏 Acknowledgements

- [React Flow](https://reactflow.dev/) — the node-based canvas library
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — VS Code's editor, in the browser
- [Turborepo](https://turbo.build/) — high-performance monorepo build system
- [Zustand](https://github.com/pmndrs/zustand) — lightweight state management
- [Lucide React](https://lucide.dev/) — beautiful open-source icon library

---

<p align="center">Made with ❤️ by <a href="https://github.com/DOWNEY7">Farid Downey</a> and contributors</p>
