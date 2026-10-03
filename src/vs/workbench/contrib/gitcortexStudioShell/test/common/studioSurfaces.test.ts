/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import {
	CORTEX_AGENT_ROLES,
	availableCortexRoles,
	formatGitSummary,
	groupSessionsIntoProjects,
	isSafeRelativePath,
	mcpTransportOf,
	totalChanges,
	vmStateLabel,
} from '../../common/studioSurfaces.js';

suite('GitCortex Studio Shell — surface view-models', () => {

	ensureNoDisposablesAreLeakedInTestSuite();

	test('CORTEX roles are unique and every role declares availability', () => {
		const ids = CORTEX_AGENT_ROLES.map(r => r.id);
		assert.strictEqual(new Set(ids).size, ids.length, 'role ids must be unique');
		for (const role of CORTEX_AGENT_ROLES) {
			assert.strictEqual(typeof role.available, 'boolean');
			assert.ok(role.label.length > 0);
			assert.ok(role.description.length > 0);
		}
	});

	test('availableCortexRoles only returns roles backed by a live capability', () => {
		const available = availableCortexRoles();
		assert.ok(available.length > 0);
		assert.ok(available.every(r => r.available));
		// The declared-but-unimplemented roles must not be reported as available.
		assert.ok(!available.some(r => r.id === 'security'));
	});

	test('mcpTransportOf reports only the transport kind, never commands or urls', () => {
		assert.strictEqual(mcpTransportOf({ type: 'stdio', command: '/usr/bin/secret-server' }), 'stdio');
		assert.strictEqual(mcpTransportOf({ type: 'http', url: 'https://token@example.test/mcp' }), 'http');
		assert.strictEqual(mcpTransportOf({ type: 'streamable-http' }), 'http');
		assert.strictEqual(mcpTransportOf({ type: 'sse' }), 'http');
		assert.strictEqual(mcpTransportOf({ url: 'https://example.test' }), 'http');
		assert.strictEqual(mcpTransportOf({ command: 'node server.js' }), 'stdio');
		assert.strictEqual(mcpTransportOf({}), 'unknown');
	});

	test('formatGitSummary renders a compact status line', () => {
		assert.strictEqual(formatGitSummary({ branch: 'main', ahead: 0, behind: 0, changes: 0, untracked: 0 }), 'main');
		assert.strictEqual(formatGitSummary({ branch: 'main', ahead: 2, behind: 1, changes: 3, untracked: 1 }), 'main · ↑2 · ↓1 · 3 changes · 1 untracked');
		assert.strictEqual(formatGitSummary({ branch: 'dev', ahead: 0, behind: 0, changes: 1, untracked: 0 }), 'dev · 1 change');
		assert.strictEqual(formatGitSummary({ branch: '', ahead: 0, behind: 0, changes: 0, untracked: 0 }), 'clean');
	});

	test('totalChanges sums across repositories', () => {
		assert.strictEqual(totalChanges([]), 0);
		assert.strictEqual(totalChanges([
			{ provider: 'git', repository: 'a', changes: 2 },
			{ provider: 'git', repository: 'b', changes: 3 },
		]), 5);
	});

	test('vmStateLabel maps every known state', () => {
		assert.strictEqual(vmStateLabel('stopped'), 'Arrêtée');
		assert.strictEqual(vmStateLabel('running'), 'En cours');
		assert.strictEqual(vmStateLabel('error'), 'Erreur');
		assert.strictEqual(vmStateLabel('mystery'), 'mystery');
	});

	test('groupSessionsIntoProjects groups sessions by workspace root', () => {
		const roots = [
			{ resource: 'file:///a', name: 'a' },
			{ resource: 'file:///b', name: 'b' },
		];
		const projects = groupSessionsIntoProjects(roots, [
			{ resource: 's1', title: 'one', isActive: true, workingDirectory: 'file:///a/sub' },
			{ resource: 's2', title: 'two', isActive: false, workingDirectory: 'file:///b' },
			{ resource: 's3', title: 'three', isActive: false },
		]);
		assert.strictEqual(projects.length, 2);
		assert.strictEqual(projects[0].name, 'a');
		assert.deepStrictEqual(projects[0].sessions.map(s => s.resource), ['s1', 's3']);
		assert.deepStrictEqual(projects[1].sessions.map(s => s.resource), ['s2']);
	});

	test('groupSessionsIntoProjects creates a synthetic workspace when there are no roots', () => {
		const projects = groupSessionsIntoProjects([], [
			{ resource: 's1', title: 'one', isActive: false },
		]);
		assert.strictEqual(projects.length, 1);
		assert.strictEqual(projects[0].name, 'Workspace');
		assert.strictEqual(projects[0].sessions.length, 1);
	});

	test('isSafeRelativePath rejects traversal and absolute paths', () => {
		assert.strictEqual(isSafeRelativePath('src/app.ts'), true);
		assert.strictEqual(isSafeRelativePath('../etc/passwd'), false);
		assert.strictEqual(isSafeRelativePath('a/../../b'), false);
		assert.strictEqual(isSafeRelativePath('/etc/passwd'), false);
		assert.strictEqual(isSafeRelativePath('C:\\Windows\\system32'), false);
		assert.strictEqual(isSafeRelativePath(''), false);
	});
});