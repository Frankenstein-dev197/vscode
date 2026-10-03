# GitCortex Studio — Studio Shell Integration (Synara / CORTEX)

## Summary

GitCortex Studio integrates the **Synara / CORTEX desktop shell experience**
into the existing Code-OSS / GitCortex foundation. The result is a single
desktop application whose primary surface is the AI-native Studio workspace,
while every Code-OSS engine is preserved.

Two source references were studied:

- **Synara Desktop** (`Emanuele-web04/synara`), MIT.
- **CORTEX IDE** (`Frankenstein-Labs/CORTEX_IDE`), MIT — the Cortex rebranding
  of the same lineage, which also ships the `CORTEX_IDE_AUDIT.md` /
  `CORTEX_IDE_ROADMAP.md` architecture notes.

Neither the Synara/Cortex marketing site, SEO pages, promotional assets, user
data, nor secrets are imported.

## Architecture

```text
GitCortex Studio
└── Single Electron application (Code-OSS/GitCortex main process)
    ├── Studio Shell (renderer, editor surface)   <- Synara/Cortex experience
    │   ├── Navigation rail: Chat · Files · Changes · Terminal · Git ·
    │   │                    VM · Sessions · Projects · MCP · CORTEX · Developer
    │   ├── Chat above Virtual Machine (resizable split)
    │   └── Files / Changes / Terminal / Git / Sessions / Projects / MCP /
    │        CORTEX / Developer surfaces
    └── Code-OSS / GitCortex engines (unchanged)
        ├── editor, languages, IntelliSense, diagnostics
        ├── extensions + extension host
        ├── terminal, SCM/Git, worktrees, diffs
        ├── Agent Host, chat, MCP management
        ├── debugger (Developer Mode)
        ├── virtual machines: QEMU/KVM, QMP, VNC/noVNC private bridge
        └── webview + Electron lifecycle, packaging, updates, CSP
```

## What was integrated (real services, no mocks)

| Surface | Backed by |
| --- | --- |
| Chat | `IChatService` + `ChatWidget` (`ChatAgentLocation.Chat`) |
| Virtual Machine | `IVirtualMachinesService` + existing noVNC webview bridge |
| Files | `IFileService` (lazy directory tree) + `IOpenerService` |
| Changes | `ISCMService` (live groups/resources) + `IOpenerService` |
| Terminal | `ITerminalService` (`attachToElement`, `createTerminal`) |
| Git | `ISCMService` repository state + existing Git commands |
| Sessions | `IChatService.getLiveSessionItems()` / `acquireOrLoadSession` |
| Projects | `IWorkspaceContextService` folders x chat sessions (grouping) |
| MCP | `IWorkbenchMcpManagementService.getInstalled()` (name + transport only) |
| CORTEX | roles catalogue + real `IChatService.isEnabled` readiness |
| Developer Mode | `IWorkbenchLayoutService.setPartHidden` for classic parts |

The VM path reuses the token-authenticated, CSP-protected loopback WebSocket
bridge to the private Unix VNC socket. **No second QEMU engine and no public
VNC listener** are introduced.

## CORTEX Engine readiness

`common/studioSurfaces.ts` declares the canonical CORTEX agent roles
(orchestrator, planner, architect, developer, researcher, tester, reviewer,
security, debugger, devops, explorer). Only roles backed by a live capability
are marked `available`; the CORTEX surface derives availability from the real
`IChatService`, so an unimplemented role is *declared, never simulated*. The
`CortexEngineStatus` bridge contract (`orchestration`, `orchestratorConnected`,
`availableRoles`) is the interface a future CORTEX Engine fulfils without a
shell redesign.

## Security and IPC

- Every Studio channel is namespaced `gitcortex.*` and registered centrally in
  `common/ipcChannels.ts` (`window`, `workspace`, `project`, `chat`,
  `terminal`, `git`, `vm`, `mcp`, `shell`, `agent`).
- The renderer never receives `ipcRenderer`, `ipcMain`, Node.js, `fs`, or
  `child_process`. `common/bridge.ts` is the only typed surface.
- The MCP surface exposes only server name and transport kind - never the
  command, URL, or any secret.
- `isSafeRelativePath()` rejects traversal/absolute paths before any
  workspace-relative path is displayed.
- Files, changes and sessions are opened via `IOpenerService` / the chat
  service, which apply the workbench's own trust/permission boundaries.

## Files

New contribution:
`src/vs/workbench/contrib/gitcortexStudioShell/`

| File | Purpose |
| --- | --- |
| `common/ipcChannels.ts` | Namespaced channel registry + validator. |
| `common/bridge.ts` | Typed bridge contract incl. `CortexEngineStatus`. |
| `common/shellConfiguration.ts` | Startup surface, Developer Mode, split settings. |
| `common/splitView.ts` | Pure chat-above-VM split logic. |
| `common/studioSurfaces.ts` | Pure surface view-models (roles, MCP transport, git summary, project grouping, path safety, VM labels). |
| `browser/gitcortexStudioShell.ts` | The shell pane: rail, chat, VM, split, all surfaces. |
| `browser/gitcortexStudioShellInput.ts` | Editor input. |
| `browser/gitcortexStudioShell.contribution.ts` | Pane registration + startup runner. |
| `browser/media/gitcortexStudioShell.css` | Theme-token styling. |
| `test/common/*.test.ts` | 23 unit tests. |

Modified: `src/vs/workbench/workbench.common.main.ts` (load the contribution),
`build/lib/i18n.resources.json` (translation extraction).

## Tests

| Suite | Assertions |
| --- | --- |
| `studioSurfaces.test.ts` | 10 - roles, transport derivation, git summary, change totals, VM labels, project grouping, path safety |
| `splitView.test.ts` | 8 - default/clamp/offset/height/snap/merge/serialize |
| `ipcChannels.test.ts` | 5 - namespacing, documented areas, namespace coverage, rejection |

Verification: `tsc --noEmit` clean, `gulp compile` succeeds, ESLint and
Stylelint clean, and a runtime smoke test (Xvfb + CDP) confirms 11 surfaces
render, the Terminal surface hosts a live terminal, and the CORTEX surface
reports real orchestration status.

## Build

```sh
npm ci
npm run gulp compile                 # dev compile to out/
npm run gulp vscode-linux-x64-min    # production Linux build
```

## Disable / rollback

- Set `gitcortex.shell.startupEditor` to `classic`, or toggle Developer Mode in
  the shell, to keep the classic workbench as the primary surface.
- The shell is additive: removing the import in `workbench.common.main.ts` and
  the `gitcortexStudioShell/` directory fully restores prior behavior without
  touching any engine code.

## Licenses

- GitCortex Studio: MIT (Code-OSS/VS Code attribution in `LICENSE.txt`).
- Synara / CORTEX: MIT (Copyright (c) 2026 T3 Tools Inc.; Copyright (c) 2026
  Emanuele Di Pietro). No Synara/Cortex user data or secrets are imported.