<div align="center">

<img src="docs/res/a0-vector-graphics/horizontal_banner.svg" alt="Agent Zero Banner" width="100%"/>

# Agent Zero — Windows Native
### Run Agent Zero natively on Windows without Docker.

Agent Zero is an open agent framework for work that needs more than chat: browser automation, live document cowork, projects, skills, plugins, and a bridge back to your host machine. This public fork adds a Windows-native Electron distribution for users who do not want to install or run Docker.

## Windows Electron fork

This repository is a public fork maintained by **Akunimal** with a focused goal: produce a Windows installer and a portable Windows distribution that embeds the Agent Zero Python backend, its Python dependencies, Chromium/Playwright, and the Node.js runtime. The Electron shell starts the backend in the background, keeps the UI on loopback, uses Windows-safe argument quoting, and shuts down the child process tree cleanly without opening a console window.

The native Windows mode is intentionally separate from the upstream Docker mode. The fork keeps the upstream project structure and makes the native behavior opt-in through small, documented contracts so future upstream updates can be merged with minimal conflicts. See [the Windows native documentation](./docs/windows-native/README.md) and [the upstream maintenance contract](./docs/windows-native/UPSTREAM-CONTRACT.md).

> **Explicit security warning — read before using:** native Windows mode has **no Docker sandbox**. Agent Zero and its code-execution tools can access the Windows account, files, processes, network, and installed programs that can be reached by the packaged process. Use a standard, dedicated Windows account or a VM; avoid administrator privileges; keep backups; and use trusted prompts or models that are instructed to avoid destructive actions. Treat every generated command as potentially capable of modifying or deleting data. The red warning banner is also shown inside the Electron UI.

The public fork contains no OpenCode Zen endpoint, `opencode2api` binary, Tor binary, private routing policy, API key, or private runtime configuration. Those belong to a separate local launcher outside this Git repository.

## Windows native quick start

1. Download the Windows installer or portable artifact from a release.
2. Start the application. It includes Python, the Python dependencies, Node.js, and Chromium; a system Python or Docker installation is not required.
3. Read and acknowledge the native-mode warning before giving the agent access to real files or tools.

For development and local packaging, see [the Windows native build guide](./docs/windows-native/README.md). The upstream Docker installation remains available below for users who want the stronger container boundary.

### Runtime boundary

| Capability | Windows Native | Upstream Docker |
| --- | --- | --- |
| Docker/WSL required | No | Yes, for the local Docker route |
| Python, Node.js, Chromium | Bundled in installer/portable build | Provided by the container/image |
| Code execution | Native PowerShell, Python, and Node on Windows | Container runtime, with optional host bridge |
| Linux XFCE desktop / Docker Canvas | Not included | Available in the container workflow |
| Host filesystem access | Directly available to the Windows account | Only through mounts/connector you grant |
| Isolation boundary | Electron renderer isolation only; **no backend sandbox** | Docker boundary, weakened by mounts/privileged options |

The native build is intended for trusted, local workflows. It is not a drop-in replacement for Docker isolation, and any upstream feature that requires a Linux container may be unavailable or behave differently on Windows.

[![Website](https://img.shields.io/badge/Website-agent--zero.ai-0A192F?style=for-the-badge&logo=vercel&logoColor=white)](https://agent-zero.ai)
[![Docs](https://img.shields.io/badge/Docs-Read%20the%20guides-1F6FEB?style=for-the-badge&logo=readthedocs&logoColor=white)](./docs/)
[![Discord](https://img.shields.io/badge/Discord-Join%20us-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/B8KZKNsPpj)
[![GitHub Sponsors](https://img.shields.io/badge/Sponsors-Thank%20you-FF69B4?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/agent0ai)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/agent0ai/agent-zero)

[Windows Native](#windows-native-quick-start) |
[Docker / Upstream](#upstream-docker-quick-start) |
[Why Agent Zero](#why-agent-zero) |
[Try These First](#try-these-first) |
[Deep Dives](#deep-dives) |
[Docs](#documentation)

</div>

> The XFCE desktop screenshots and Docker Canvas references below describe the upstream container workflow. They are not part of the Windows-native Electron runtime.

# Why Agent Zero

| Feature | Why it matters |
| --- | --- |
| **Windows-native runtime** | Run the Python backend, embedded Python dependencies, Chromium, and Node.js without Docker or a system Python installation. |
| **Full Linux desktop (Docker only)** | The upstream Docker distribution can provide a Linux desktop, terminals, files, and desktop apps inside the Canvas. |
| **Browser DOM annotation** | Click page elements and turn them into inspect, change, lift, or review instructions. |
| **Live document cowork** | Edit Markdown, Writer, Spreadsheet, and Presentation files together instead of losing work in chat. |
| **Plugin Hub** | Install 100+ community plugins or publish your own extension points. |
| **Projects and memory** | Keep files, instructions, secrets, memories, repositories, and model-preset choices isolated per project. |
| **Host-machine bridge** | Connect with the A0 CLI so the same agent can work in your real local repositories. |
| **Multi-agent cooperation** | Let agents delegate research, coding, analysis, or review tasks to focused subagents. |
| **Transparent internals** | Prompts, tools, plugins, skills, and settings are inspectable and editable. |

# Upstream Docker Quick Start

## Recommended for the Docker route: A0 Launcher

The desktop **A0 Launcher** is the fastest guided path on a personal machine. Download it, open it, and let it check Docker, create Instances, manage ports, and connect to local or remote Agent Zero installs.

Agent Zero runs wherever Docker runs, from a $6 VPS or Raspberry Pi to a local workstation or GPU server.

| Architecture | macOS | Linux | Windows |
| --- | --- | --- | --- |
| x86 | [Mac Intel](https://github.com/agent0ai/a0-launcher/releases/download/v1.7/a0-launcher-1.7-macos-x64.dmg) | [Linux x86](https://github.com/agent0ai/a0-launcher/releases/download/v1.7/a0-launcher-1.7-linux-x64.AppImage) | [Windows x86](https://github.com/agent0ai/a0-launcher/releases/download/v1.7/a0-launcher-1.7-windows-x64.exe) |
| ARM64 | [Mac Apple Silicon](https://github.com/agent0ai/a0-launcher/releases/download/v1.7/a0-launcher-1.7-macos-arm64.dmg) | [Linux ARM64](https://github.com/agent0ai/a0-launcher/releases/download/v1.7/a0-launcher-1.7-linux-arm64.AppImage) | [Windows ARM64](https://github.com/agent0ai/a0-launcher/releases/download/v1.7/a0-launcher-1.7-windows-arm64.exe) |

See the [A0 Launcher v1.7 release](https://github.com/agent0ai/a0-launcher/releases/tag/v1.7) for release notes and updater metadata. See the [Launcher guide](./docs/guides/launcher.md) for the first-run walkthrough.

<details>
<summary><strong>Other install paths</strong></summary>

## A0 Install

Use **A0 Install** when you want the terminal path: SSH sessions, servers, recovery shells, or a scriptable setup. It creates Dockerized Agent Zero instances, mounts each instance's data into `/a0/usr` inside the container, and uses a reuse-before-setup policy: it tries your current Docker CLI configuration, `DOCKER_HOST`, Docker contexts, and known local Docker-compatible endpoints before setting up a runtime.

### macOS / Linux

```bash
curl -fsSL https://bash.agent-zero.ai | bash
```

### Windows PowerShell

```powershell
irm https://ps.agent-zero.ai | iex
```

### Headless / scripted

For servers and automation, run the installer in Quick Start mode so it creates one instance and exits without opening menus:

```bash
curl -fsSL https://bash.agent-zero.ai | bash -s -- --quick-start --name agent-zero --port 5080
```

```powershell
& ([scriptblock]::Create((irm https://ps.agent-zero.ai))) -QuickStart -Name agent-zero -Port 5080
```

Use `--skip-runtime-setup` / `-SkipRuntimeSetup` when Docker must already be working and the installer should not try to set up a runtime. See the [A0 Install repository](https://github.com/agent0ai/a0-install) for all installer flags.

## Docker already installed? Run this directly

```bash
docker run -p 80:80 -v a0_usr:/a0/usr agent0ai/agent-zero
```

Open the Web UI, configure your LLM provider, and start with a concrete task. For the full setup and onboarding experience, see the [Installation guide](./docs/setup/installation.md).

</details>

## Troubleshooting

- **Docker is not running:** start Docker Desktop or your Docker service, then reopen the Launcher or rerun the install command.
- **Port 80 is already in use:** use the Launcher to pick another port, or run Docker directly with `-p 5080:80` and open `http://localhost:5080`.
- **Installing on a server:** use the A0 Install Quick Start command with `--quick-start --name agent-zero --port 5080`.
- **Still blocked:** see the [Troubleshooting guide](./docs/guides/troubleshooting.md).

# Try These First

- **Annotate a design you like:** "Open this template site in the Browser. I'll annotate the hero section - re-implement it in my project's React + Tailwind stack."
- **Cowork on a spreadsheet:** "Create an editable ODS budget model with assumptions and monthly projections."
- **Native Windows task:** "Inspect this project, explain the changes first, and only edit files after I approve the plan. Do not delete or overwrite data."
- **Drive a Linux desktop (Docker only):** "Use the Linux Desktop to open Blender and create a simple 3D logo for me."
- **Review a web UI:** "Open my local app in the Browser. I will annotate the page with comments; then implement the requested UI fixes."
- **Create a specialist:** "Create an Agent Profile for financial analysis with cautious reasoning, clear assumptions, and spreadsheet-first deliverables."
- **Recover a workspace:** "Show me recent Time Travel snapshots and explain what changed before I revert anything."

# Deep Dives

## A Real Linux Desktop in the Canvas (Docker only)

The upstream Docker distribution opens its own Linux desktop inside the right-side Canvas. Not a remote VM, not a shared clipboard, but a real XFCE desktop session running in the container. The Windows-native Electron build does not create this Linux desktop or Docker boundary; it runs Windows tools directly on the host.

That means the agent can drive *real desktop software*: open Blender to model a 3D object, jump into a terminal window, manage files visually, run a GUI tool that has no API.

You watch every action, and you can intervene at any moment because your mouse and keyboard share the same desktop.

See the [Desktop guide](./docs/guides/desktop.md) for the walkthrough, prompt examples, and how Desktop differs from Browser.

## Native Browser With DOM Annotations

<img alt="Annotating a webpage element in the Agent Zero browser" src="docs/res/usage/browser/annotation.gif" />
<br>

Agent Zero ships a built-in Browser with an optional live surface in the Canvas. The agent can open pages, read them, click, type, upload files, and take screenshots - the usual. The unusual part is **Annotate mode**.

Annotate mode turns any webpage into an interactive directive surface. Click an element to:

- **Change it** - "make this button blue and round the corners" runs as a JS instruction the agent applies and verifies.
- **Inspect it** - pull the DOM, the styles, the parent chain, the framework hints into the conversation.
- **Lift it** - see a card, hero, or component on someone else's site that you like? Capture it and have the agent re-implement it in your own project's stack.
- **Comment it** - leave actionable notes pinned to elements during a UI review; the agent reads the comments and ships the fixes.

In Windows-native mode, Browser uses the Chromium build embedded in the package and runs with the Windows account's network and filesystem permissions. In Docker mode, the Docker browser is the default live Browser surface. Browser history keeps screenshots of important steps, so older chats can still show what the agent saw. **Bring Your Own Browser** through the A0 CLI Connector is an optional host integration and is not a sandbox.

See the [Browser guide](./docs/guides/browser.md) for screenshots, settings, host-browser setup, and troubleshooting.

## Cowork on Documents

### Markdown Editor With Live Cowork

<img alt="Agent Zero writing a TODO plan in the Canvas markdown editor" src="docs/res/usage/webui/markdown-editor.gif" />
<br>

The Canvas includes a rich Markdown editor designed for genuine cowork. Ask the agent to "write a plan to do X in a TODO.md in the open doc" and you'll see the file appear in the editor, character by character, while you keep typing in another section.

It's not a preview pane. It's a real editor with toolbar, formatting buttons, tables, and an editable source view - built so that the agent's edits and yours are equal first-class operations on the same document.

Use it for plans, TODOs, meeting notes, RFCs, project handoffs, or any artifact where the deliverable should *live as text* rather than be trapped inside chat scrollback.

### LibreOffice Integration (Docker or separately installed host software)

LibreOffice Writer, Calc, and Impress are available when the relevant desktop software and integration are installed. The Windows-native package does not include a Linux LibreOffice desktop; install and test any host application separately before granting the agent access.

ODT, ODS, and ODP binary formats are first-class citizens in the Agent Zero Desktop environment to align with the Open Document Format (ODF).

Use the Desktop toolbar to create and edit Writer, Spreadsheet, and Presentation LibreOffice files.

## Plugin Hub - 100+ Community Plugins

<img alt="Agent Zero Plugin Hub showing community plugins" src="docs/res/usage/plugins/plugin-hub-browse.png" />
<br>

Agent Zero is built for extension, not just configuration. The built-in **Plugin Hub** browses a growing catalog of community plugins - currently more than 100, covering:

- **Development frameworks** like the [BMAD Method](https://github.com/bmad-code-org/bmad-method) (full software development lifecycle with 20 specialist agents) and [Agent Skills](https://github.com/addyosmani/agent-skills).
- **Memory systems** - alternative memory backends, intelligent consolidation strategies, vector recall plugins.
- **Tools and integrations** - embedded terminals, custom browsers, deployment helpers, API clients.
- **UI extensions** - chat rename controls, sidebar tweaks, theme packs, custom Canvas panels.
- **Workflow plugins** - schedulers, multi-agent orchestration, project automations.

Install with a click from the Web UI, or publish your own to the index repository. Combined with custom prompts in `prompts/`, custom tools in `tools/`, MCP servers, A2A connectors, and project-scoped configuration, Agent Zero gives you a real surface area to shape the agent into whatever you need.

See the [Skills guide](./docs/guides/skills.md), the [Create a Small Plugin](./docs/guides/create-plugin.md) tutorial, and the [MCP setup](./docs/guides/mcp-setup.md) guide.

## Use Your OpenAI Codex Plan

<img alt="OAuth LLM plans in Agent Zero" src="docs/res/codex-screenshot.png" />
<br>

Agent Zero connects to your OpenAI Codex plan through the new OAuth flow. Sign in with your account, pick the Codex-backed provider, and let Agent Zero use the plan you already have. Click "Connect", enter the device code in the OpenAI page, choose your model, and you're set.

This is the first step toward account-backed LLM plans in Agent Zero. More integrations are coming, including Gemini CLI and Claude Code through extra-usage.

## A0 CLI Connector: Extend Onto Your Host Machine

<img alt="A0 CLI driving the host browser through a Google Cloud VM creation flow" src="docs/res/usage/a0-cli/host-browser.gif" />
<br>

The **A0 CLI Connector** is not a separate CLI agent. For Docker installations, it gives a running Agent Zero instance a controlled bridge to the host machine. In Windows-native mode the backend already runs on the host, so the connector is optional and does not add isolation.

For Docker installations, install the connector on the machine you want Agent Zero to work on, **not** inside the Agent Zero container.

### macOS / Linux

```bash
curl -LsSf https://cli.agent-zero.ai/install.sh | sh
```

### Windows PowerShell

```powershell
irm https://cli.agent-zero.ai/install.ps1 | iex
```

Then run `a0` to connect your terminal to an existing Agent Zero instance. It can usually discover a local instance automatically, or you can point it at a remote URL hosted somewhere else, such as a VPS or tunnel.

This is especially useful if you:

- prefer CLI workflows;
- want Agent Zero to work in an existing local repository;
- are running Agent Zero on a remote server;
- want Docker isolation for Agent Zero while still granting explicit, controlled access to host-side work.

For full setup, see the [A0 CLI Connector guide](https://www.agent-zero.ai/p/docs/a0-cli-connector/) (or the [in-repo guide](./docs/guides/a0-cli-connector.md)).

## Projects, Skills, Agent Profiles, and Model Presets

**Projects** isolate workspaces, instructions, memory, secrets, knowledge, repositories, and model-preset choices. Clone a public or private Git repo into a project and give the agent context that belongs to that work alone.

**Skills** can be loaded on demand by Agent Zero, or pinned from the chat input when you want a specific procedure to stay active.

**Agent Profiles** change the broader working style of the current chat.

**Model Presets** are named shortcuts for model setups, so you can quickly switch between fast, balanced, cheap, local, or high-power model choices.

## Multi-Agent Cooperation

Every agent can create subordinate agents to break down work. The superior gives tasks and receives reports; subagents keep their own contexts focused and return their findings when done.

This makes Agent Zero useful for research, software engineering, data analysis, plugin development, and tasks where several specialized perspectives are better than one overloaded context.

## Transparent and Extensible by Design

Almost nothing is hidden. Prompts live in `prompts/`, tools live in `tools/` or plugins, and built-in behavior can be inspected, changed, replaced, or extended.

Agent Zero supports plugins, MCP, A2A, custom tools, custom prompts, project-scoped configuration, environment-based deployment settings, and a Web UI designed to keep the agent's work readable in real time.

## Time Travel

Time Travel gives Agent Zero-owned workspaces snapshot history, diff inspection, travel, and revert where the selected runtime supports it. Docker uses `/a0/usr`; Windows-native mode stores user data under the configured Agent Zero Windows user directory. It is designed for recoverable agent work, but it is not a replacement for backups or Windows file protections.

<img alt="Time Travel" src="docs/res/time-travel.png" />

It is not a replacement for Git or backups. It is a practical safety layer for the workspace where agents are actively creating and editing files.

## Real-World Use Cases

- **Software engineering:** inspect a codebase, make scoped edits, run tests, explain tradeoffs, and keep a recoverable history of file changes.
- **Host-machine development:** Windows-native mode can work in local repositories directly; Docker installations can use `a0` or the Git Projects feature with an explicit host bridge.
- **Design inspiration and UI iteration:** browse the web, annotate elements you like, and pull components into your own stack.
- **Financial analysis and charting:** collect data, correlate events, create spreadsheets, and generate editable charts.
- **Office deliverables:** cowork on documents, spreadsheets, and presentation decks instead of trapping the result in chat text.
- **Web and mobile QA:** browse an app, annotate UI issues, install browser extensions, and turn visual comments into actionable fixes.
- **API integration:** paste an API snippet, let the agent build a working example, and store the pattern for future use.
- **Client/project isolation:** keep memory, secrets, instructions, files, and model choices separated by project.
- **Scheduled operations:** run recurring checks and monitoring tasks with project-scoped context and credentials.

## Documentation

| I want to... | Start here |
| --- | --- |
| Run Agent Zero natively on Windows | [Windows native guide](./docs/windows-native/README.md) |
| Review the native Windows security model | [Security warning](./docs/windows-native/SECURITY.md) |
| Install or update Agent Zero | [Installation](./docs/setup/installation.md) |
| Learn the UI and basic workflow | [Quickstart](./docs/quickstart.md) |
| Browse, annotate, and use Browser screenshots | [Browser guide](./docs/guides/browser.md) |
| Use the Linux desktop and LibreOffice in Docker | [Desktop guide](./docs/guides/desktop.md) |
| Connect Agent Zero to host-machine files and shell | [A0 CLI Connector](https://www.agent-zero.ai/p/docs/a0-cli-connector/) |
| Use projects and Git workspaces | [Projects guide](./docs/guides/projects.md) |
| Create a small plugin | [Create a Small Plugin](./docs/guides/create-plugin.md) |
| Add or remove active skills | [Skills guide](./docs/guides/skills.md) |
| Create or switch Agent Profiles | [Agent Profiles](./docs/guides/agent-profiles.md) |
| Create or switch Model Presets | [Model Presets](./docs/guides/model-presets.md) |
| Manage and curate memories | [Memory guide](./docs/guides/memory.md) |
| Learn the everyday chat controls | [Usage guide](./docs/guides/usage.md) |
| Configure MCP or external tools | [MCP setup](./docs/guides/mcp-setup.md) |
| Understand the architecture and internals | [DeepWiki for Agent Zero](https://deepwiki.com/agent0ai/agent-zero) |
| Build an advanced extension | [Extensions](./docs/developer/extensions.md) |
| Contribute to the project | [Contributing](./docs/guides/contribution.md) |
| Troubleshoot problems | [Troubleshooting](./docs/guides/troubleshooting.md) |

## Build With Us

Agent Zero is built for people who want to understand and shape their tools.

You can help by improving docs, creating skills, publishing plugins, testing model/provider setups, reporting bugs, sharing workflows, or contributing core improvements. Start with the [Contributing guide](./docs/guides/contribution.md), browse the [Plugin Hub](https://www.agent-zero.ai/p/docs/plugins/#plugin-hub), or bring ideas to Discord.

## Community and Support

- [Discord](https://discord.gg/B8KZKNsPpj) for live discussion and help.
- [Skool Community](https://www.skool.com/agent-zero) for community learning.
- [YouTube](https://www.youtube.com/@AgentZeroFW) for demos and tutorials.
- [X](https://x.com/Agent0ai), [LinkedIn](https://www.linkedin.com/company/109758317), and [Warpcast](https://warpcast.com/agent-zero) for updates.
- [GitHub Issues](https://github.com/agent0ai/agent-zero/issues) for bugs and feature requests.

[Space Agent](https://github.com/agent0ai/space-agent) is the related, more polished product direction for the agent-shaped workspace. Agent Zero remains the open framework; this fork adds a Windows-native runtime while preserving the upstream Docker route.

## Safety Model

Agent Zero is powerful because it can use a real environment. Choose the runtime boundary deliberately.

### Windows Native

- There is **no Docker sandbox**. The backend and code-execution tools run with the Windows account's permissions.
- Use a dedicated standard account or VM; do not run the portable build as Administrator.
- Prefer trusted prompts and models that explicitly avoid destructive actions. Review commands before allowing deletes, overwrites, credential access, network changes, or production actions.
- Keep private endpoints and credentials outside the public repository, build logs, and crash reports.
- Keep backups. Time Travel is not a substitute for Git, backups, or OS-level access controls.

### Docker / upstream

- Docker provides the stronger default boundary, but mounts, host bridges, credentials, and privileged settings can weaken it.
- Do not mount your entire home directory unless you understand the risk.
- Grant A0 CLI Read+Write access and remote code execution only for machines and workspaces you trust.
- Review actions that touch accounts, money, production systems, or private data.
