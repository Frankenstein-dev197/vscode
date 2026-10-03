/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Typed desktop bridge exposed to the GitCortex Studio Shell renderer.
 *
 * The renderer never receives `ipcRenderer`, Node.js, `fs`, or `child_process`.
 * Every capability is a validated, typed method. Long-running operations return
 * a promise and support structured errors; listeners are only bound through the
 * explicit `on*` registration helpers which return an unsubscribe function.
 */

export interface GitCortexWindowState {
	readonly minimized: boolean;
	readonly maximized: boolean;
	readonly fullScreen: boolean;
}

export interface GitCortexWorkspaceInfo {
	readonly path: string;
	readonly name: string;
	readonly folders: readonly string[];
}

export interface GitCortexProjectSummary {
	readonly id: string;
	readonly name: string;
	readonly path: string;
}

export interface GitCortexTerminalSummary {
	readonly id: string;
	readonly title: string;
}

export interface GitCortexSessionSummary {
	readonly resource: string;
	readonly title: string;
	readonly isActive: boolean;
}

export interface GitCortexVmSummary {
	readonly id: string;
	readonly name: string;
	readonly description: string;
	readonly state: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
	readonly cpus: number;
	readonly memoryMB: number;
	readonly diskGB: number;
	readonly error?: string;
}

export interface GitCortexMcpServerSummary {
	readonly id: string;
	readonly name: string;
	readonly state: 'configured' | 'installing' | 'ready' | 'error';
}

export interface GitCortexMcpCapability {
	readonly id: string;
	readonly kind: 'tool' | 'resource' | 'prompt';
}

export interface GitCortexMcpApprovalRequest {
	readonly serverId: string;
	readonly capabilityId: string;
	readonly reason: string;
}

export interface GitCortexMcpApprovalResult {
	readonly approved: boolean;
}

export interface GitCortexStudioShellState {
	readonly developerMode: boolean;
}

/**
 * CORTEX Engine readiness contract.
 *
 * This is a *contract*, not a fake engine: `availableRoles` reports only the
 * roles backed by a live capability in this build, and `orchestratorConnected`
 * reflects whether the integrated agent/chat surface is actually connected.
 * A future CORTEX Engine implementation fulfils this interface without any
 * shell redesign.
 */
export interface CortexEngineStatus {
	readonly availableRoles: readonly string[];
	readonly orchestration: 'unavailable' | 'available';
	readonly orchestratorConnected: boolean;
}

export interface GitCortexDesktopBridge {
	readonly window: {
		minimize(): Promise<void>;
		maximize(): Promise<void>;
		close(): Promise<void>;
		getState(): Promise<GitCortexWindowState>;
		onState(listener: (state: GitCortexWindowState) => void): () => void;
	};

	readonly workspace: {
		open(path: string): Promise<GitCortexWorkspaceInfo | undefined>;
		current(): Promise<GitCortexWorkspaceInfo | undefined>;
		listRecent(): Promise<GitCortexWorkspaceInfo[]>;
	};

	readonly project: {
		list(): Promise<GitCortexProjectSummary[]>;
		open(id: string): Promise<GitCortexWorkspaceInfo | undefined>;
	};

	readonly chat: {
		send(input: { text: string }): Promise<{ sent: boolean }>;
		cancel(requestId: string): Promise<void>;
		newSession(): Promise<{ resource: string }>;
		listSessions(): Promise<GitCortexSessionSummary[]>;
		openSession(resource: string): Promise<void>;
	};

	readonly terminal: {
		list(workspaceId: string): Promise<GitCortexTerminalSummary[]>;
		create(workspaceId: string): Promise<GitCortexTerminalSummary>;
	};

	readonly git: {
		getStatus(): Promise<{ branch: string; changes: number }>;
		getDiff(): Promise<string>;
	};

	readonly vm: {
		list(): Promise<GitCortexVmSummary[]>;
		start(id: string): Promise<void>;
		stop(id: string): Promise<void>;
		restart(id: string): Promise<void>;
		remove(id: string): Promise<void>;
		openDesktop(id: string): Promise<{ webSocketUrl: string; token: string }>;
		checkEnvironment(): Promise<{ ok: boolean; problems: readonly string[] }>;
		onState(listener: (vms: GitCortexVmSummary[]) => void): () => void;
	};

	readonly mcp: {
		listServers(): Promise<GitCortexMcpServerSummary[]>;
		listCapabilities(serverId: string): Promise<GitCortexMcpCapability[]>;
		requestApproval(request: GitCortexMcpApprovalRequest): Promise<GitCortexMcpApprovalResult>;
		onState(listener: (servers: GitCortexMcpServerSummary[]) => void): () => void;
	};

	readonly shell: {
		toggleDeveloperMode(): Promise<GitCortexStudioShellState>;
		getState(): Promise<GitCortexStudioShellState>;
		onState(listener: (state: GitCortexStudioShellState) => void): () => void;
	};

	readonly cortex: {
		getEngineStatus(): Promise<CortexEngineStatus>;
		onEngineStatus(listener: (status: CortexEngineStatus) => void): () => void;
	};
}

/**
 * Base shape for structured errors produced by long-running bridge operations.
 * The message is user-facing and intentionally free of secrets or tokens.
 */
export interface GitCortexBridgeError {
	readonly code: string;
	readonly message: string;
}