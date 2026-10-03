/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Pure, DOM-free view-model helpers for the GitCortex Studio shell surfaces
 * (Files, Changes, Git, Terminal, MCP, Cortex orchestration).
 *
 * Keeping this logic independent of the workbench services makes it unit
 * testable and lets the shell render from plain data structures.
 */

export interface StudioFileEntry {
	/** Absolute resource path (uri.toString()) used to open the file. */
	readonly resource: string;
	/** Display name (basename). */
	readonly name: string;
	readonly isDirectory: boolean;
	/** Relative path from the workspace root, for breadcrumbs. */
	readonly relativePath: string;
}

export interface StudioChangeEntry {
	readonly resource: string;
	readonly name: string;
	/** SCM resource group label (e.g. "Changes", "Staged", "Untracked"). */
	readonly group: string;
	/** Provider id (e.g. "git"). */
	readonly provider: string;
}

export interface StudioChangeSummary {
	readonly provider: string;
	readonly repository: string;
	readonly changes: number;
}

export interface StudioGitSummary {
	readonly branch: string;
	readonly ahead: number;
	readonly behind: number;
	readonly changes: number;
	readonly untracked: number;
}

export interface StudioTerminalEntry {
	readonly id: number;
	readonly title: string;
}

export interface StudioMcpServerEntry {
	readonly name: string;
	readonly displayName: string;
	/** A short, non-secret transport descriptor (e.g. "stdio", "http"). */
	readonly transport: string;
}

export interface CortexAgentRoleView {
	readonly id: string;
	readonly label: string;
	/** Whether the role is backed by a live capability in this build. */
	readonly available: boolean;
	readonly description: string;
}

/**
 * Canonical CORTEX Engine agent roles. `available` reflects whether the role is
 * backed today by the integrated agent/chat surface; the rest are declared so
 * the orchestration layer can adopt them without a shell redesign.
 */
export const CORTEX_AGENT_ROLES: readonly CortexAgentRoleView[] = [
	{ id: 'orchestrator', label: 'Orchestrator', available: true, description: 'Coordinates agent work and routes tasks.' },
	{ id: 'planner', label: 'Planner', available: true, description: 'Decomposes goals into executable steps.' },
	{ id: 'architect', label: 'Architect', available: false, description: 'Designs system structure and boundaries.' },
	{ id: 'developer', label: 'Developer', available: true, description: 'Implements changes in the workspace.' },
	{ id: 'researcher', label: 'Researcher', available: false, description: 'Gathers external and repository context.' },
	{ id: 'tester', label: 'Tester', available: false, description: 'Runs and interprets test suites.' },
	{ id: 'reviewer', label: 'Reviewer', available: true, description: 'Reviews diffs and enforces quality gates.' },
	{ id: 'security', label: 'Security', available: false, description: 'Audits permissions and sensitive operations.' },
	{ id: 'debugger', label: 'Debugger', available: false, description: 'Diagnoses runtime failures.' },
	{ id: 'devops', label: 'DevOps', available: false, description: 'Handles build, release and environment tasks.' },
	{ id: 'explorer', label: 'Explorer', available: false, description: 'Explores unfamiliar codebases.' },
];

/** Return the roles that are wired to a live capability in this build. */
export function availableCortexRoles(roles: readonly CortexAgentRoleView[] = CORTEX_AGENT_ROLES): readonly CortexAgentRoleView[] {
	return roles.filter(role => role.available);
}

/**
 * Derive a non-secret transport descriptor from an MCP server configuration.
 * Only the transport kind is exposed; commands, URLs and env are never surfaced.
 */
export function mcpTransportOf(config: { readonly type?: string; readonly command?: string; readonly url?: string }): string {
	const type = config.type?.toLowerCase();
	if (type === 'http' || type === 'sse' || type === 'streamable-http') {
		return 'http';
	}
	if (type === 'stdio') {
		return 'stdio';
	}
	if (config.url) {
		return 'http';
	}
	if (config.command) {
		return 'stdio';
	}
	return 'unknown';
}

/** Format a git summary into a compact single-line status label. */
export function formatGitSummary(summary: StudioGitSummary): string {
	const parts: string[] = [];
	if (summary.branch) {
		parts.push(summary.branch);
	}
	if (summary.ahead > 0) {
		parts.push(`↑${summary.ahead}`);
	}
	if (summary.behind > 0) {
		parts.push(`↓${summary.behind}`);
	}
	if (summary.changes > 0) {
		parts.push(`${summary.changes} change${summary.changes === 1 ? '' : 's'}`);
	}
	if (summary.untracked > 0) {
		parts.push(`${summary.untracked} untracked`);
	}
	return parts.join(' · ') || 'clean';
}

/** Total number of changes across SCM repositories. */
export function totalChanges(summaries: readonly StudioChangeSummary[]): number {
	return summaries.reduce((acc, s) => acc + s.changes, 0);
}

/** Human label for a virtual machine state, consistent across surfaces. */
export function vmStateLabel(state: string): string {
	switch (state) {
		case 'stopped': return 'Arrêtée';
		case 'starting': return 'Démarrage';
		case 'running': return 'En cours';
		case 'stopping': return 'Arrêt';
		case 'error': return 'Erreur';
		default: return state;
	}
}

/**
 * A Cortex-style workspace project: a workspace root that groups the agent
 * sessions working inside it. Derived from the real workspace folders and the
 * real chat session list, not from invented data.
 */
export interface StudioProject {
	/** uri.toString() of the workspace root. */
	readonly resource: string;
	readonly name: string;
	readonly sessions: readonly { resource: string; title: string; isActive: boolean }[];
}

/** Minimal shape of a chat session needed to group it by workspace. */
export interface StudioProjectSessionInput {
	readonly resource: string;
	readonly title: string;
	readonly isActive: boolean;
	/** Optional working directory URI string reported by the chat session. */
	readonly workingDirectory?: string;
}

/**
 * Group agent sessions under workspace projects. A session with no working
 * directory (or one outside every root) is attached to the first project so
 * nothing is silently dropped; with no projects at all, the sessions are
 * returned as a single synthetic "Workspace" project.
 */
export function groupSessionsIntoProjects(
	workspaceRoots: readonly { readonly resource: string; readonly name: string }[],
	sessions: readonly StudioProjectSessionInput[],
): readonly StudioProject[] {
	if (workspaceRoots.length === 0) {
		return [{
			resource: '',
			name: 'Workspace',
			sessions: sessions.map(s => ({ resource: s.resource, title: s.title, isActive: s.isActive })),
		}];
	}

	const buckets = new Map<string, { resource: string; title: string; isActive: boolean }[]>();
	for (const root of workspaceRoots) {
		buckets.set(root.resource, []);
	}

	for (const session of sessions) {
		const owner = workspaceRoots.find(root => session.workingDirectory && session.workingDirectory.startsWith(root.resource));
		const target = owner?.resource ?? workspaceRoots[0].resource;
		buckets.get(target)?.push({ resource: session.resource, title: session.title, isActive: session.isActive });
	}

	return workspaceRoots.map(root => ({
		resource: root.resource,
		name: root.name,
		sessions: buckets.get(root.resource) ?? [],
	}));
}

/**
 * A workspace-relative file path safe to display: rejects traversal segments so
 * a crafted name cannot imply access outside the workspace.
 */
export function isSafeRelativePath(path: string): boolean {
	if (!path) {
		return false;
	}
	if (path.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(path)) {
		return false;
	}
	return !path.split(/[\\/]+/).some(segment => segment === '..');
}