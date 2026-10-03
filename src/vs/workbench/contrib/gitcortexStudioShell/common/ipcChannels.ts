/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Central, documented registry of GitCortex Studio Shell IPC channels.
 *
 * Every channel is namespaced (`gitcortex.<area>.*`). The preload layer only
 * exposes typed methods over these channels and never hands the renderer a raw
 * `ipcRenderer`, Node.js, `fs`, or `child_process` handle.
 *
 * The channel split protects the existing `vscode:` channels used by the
 * Code-OSS workbench from being reused with a different meaning and keeps a
 * single source of truth for the desktop bridge contract.
 */

export const GitCortexStudioShellIpcChannels = {
	window: {
		minimize: 'gitcortex.window.minimize',
		maximize: 'gitcortex.window.maximize',
		close: 'gitcortex.window.close',
		getState: 'gitcortex.window.get-state',
		state: 'gitcortex.window.state',
	},

	workspace: {
		open: 'gitcortex.workspace.open',
		current: 'gitcortex.workspace.current',
		listRecent: 'gitcortex.workspace.list-recent',
	},

	project: {
		list: 'gitcortex.project.list',
		open: 'gitcortex.project.open',
	},

	chat: {
		send: 'gitcortex.chat.send',
		cancel: 'gitcortex.chat.cancel',
		newSession: 'gitcortex.chat.new-session',
		listSessions: 'gitcortex.chat.list-sessions',
		openSession: 'gitcortex.chat.open-session',
	},

	terminal: {
		list: 'gitcortex.terminal.list',
		create: 'gitcortex.terminal.create',
	},

	git: {
		getStatus: 'gitcortex.git.get-status',
		getDiff: 'gitcortex.git.get-diff',
	},

	vm: {
		list: 'gitcortex.vm.list',
		start: 'gitcortex.vm.start',
		stop: 'gitcortex.vm.stop',
		restart: 'gitcortex.vm.restart',
		remove: 'gitcortex.vm.remove',
		openDesktop: 'gitcortex.vm.open-desktop',
		checkEnvironment: 'gitcortex.vm.check-environment',
		state: 'gitcortex.vm.state',
	},

	mcp: {
		listServers: 'gitcortex.mcp.list-servers',
		listCapabilities: 'gitcortex.mcp.list-capabilities',
		requestApproval: 'gitcortex.mcp.request-approval',
		state: 'gitcortex.mcp.state',
	},

	shell: {
		toggleDeveloperMode: 'gitcortex.shell.toggle-developer-mode',
		getState: 'gitcortex.shell.get-state',
		state: 'gitcortex.shell.state',
		surfaceChanged: 'gitcortex.shell.surface-changed',
	},

	agent: {
		getEngineStatus: 'gitcortex.agent.get-engine-status',
		engineStatus: 'gitcortex.agent.engine-status',
	},
} as const;

type LeafIpcChannel<T> = T extends string
	? T
	: T extends object
		? LeafIpcChannel<T[keyof T]>
		: never;

export type GitCortexStudioShellIpcChannel = LeafIpcChannel<typeof GitCortexStudioShellIpcChannels>;

/**
 * Validate that a channel received over the bridge belongs to the documented
 * GitCortex namespace. Unknown channels are rejected before any handler runs.
 */
export function isGitCortexStudioShellChannel(channel: string): boolean {
	return channel.startsWith('gitcortex.');
}