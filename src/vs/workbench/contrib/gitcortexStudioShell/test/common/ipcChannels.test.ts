/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { GitCortexStudioShellIpcChannels, isGitCortexStudioShellChannel } from '../../common/ipcChannels.js';

suite('GitCortex Studio Shell — IPC channel registry', () => {

	ensureNoDisposablesAreLeakedInTestSuite();

	test('every registered channel is namespaced under gitcortex.', () => {
		const visit = (channels: object, path: string): void => {
			for (const [key, value] of Object.entries(channels)) {
				if (typeof value === 'string') {
					assert.ok(value.startsWith('gitcortex.'), `channel '${path}.${key}' must be namespaced: ${value}`);
				} else {
					visit(value, `${path}.${key}`);
				}
			}
		};
		visit(GitCortexStudioShellIpcChannels, 'GitCortexStudioShellIpcChannels');
	});

	test('channel registry covers the documented bridge areas', () => {
		assert.strictEqual(GitCortexStudioShellIpcChannels.window.minimize, 'gitcortex.window.minimize');
		assert.strictEqual(GitCortexStudioShellIpcChannels.workspace.open, 'gitcortex.workspace.open');
		assert.strictEqual(GitCortexStudioShellIpcChannels.vm.openDesktop, 'gitcortex.vm.open-desktop');
		assert.strictEqual(GitCortexStudioShellIpcChannels.mcp.requestApproval, 'gitcortex.mcp.request-approval');
		assert.strictEqual(GitCortexStudioShellIpcChannels.shell.toggleDeveloperMode, 'gitcortex.shell.toggle-developer-mode');
		// CORTEX Engine readiness channels.
		assert.strictEqual(GitCortexStudioShellIpcChannels.agent.getEngineStatus, 'gitcortex.agent.get-engine-status');
		assert.strictEqual(GitCortexStudioShellIpcChannels.agent.engineStatus, 'gitcortex.agent.engine-status');
	});

	test('every documented namespace prefix is present', () => {
		const covered = [
			'gitcortex.window.', 'gitcortex.workspace.', 'gitcortex.project.', 'gitcortex.chat.',
			'gitcortex.terminal.', 'gitcortex.git.', 'gitcortex.vm.', 'gitcortex.mcp.',
			'gitcortex.shell.', 'gitcortex.agent.',
		];
		const flat = JSON.stringify(GitCortexStudioShellIpcChannels);
		for (const prefix of covered) {
			assert.ok(flat.includes(prefix), `registry must define at least one channel under ${prefix}`);
		}
	});

	test('isGitCortexStudioShellChannel rejects unknown and vscode channels', () => {
		assert.strictEqual(isGitCortexStudioShellChannel('gitcortex.window.minimize'), true);
		assert.strictEqual(isGitCortexStudioShellChannel('vscode:window-config'), false);
		assert.strictEqual(isGitCortexStudioShellChannel('desktop:pick-folder'), false);
		assert.strictEqual(isGitCortexStudioShellChannel(''), false);
		assert.strictEqual(isGitCortexStudioShellChannel('gitcortex.'), true); // prefix is enough, full validation happens at the handler
	});
});