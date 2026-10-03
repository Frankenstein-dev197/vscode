/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from '../../../../nls.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { ConfigurationScope, Extensions as ConfigurationExtensions, IConfigurationRegistry } from '../../../../platform/configuration/common/configurationRegistry.js';

export const GitCortexShellConfiguration = {
	StartupEditor: 'gitcortex.shell.startupEditor',
	DeveloperMode: 'gitcortex.shell.developerMode',
	ShowChatAboveVm: 'gitcortex.shell.chatAboveVm',
	ChatRatio: 'gitcortex.shell.chatRatio',
} as const;

export const enum GitCortexShellStartupEditor {
	/** Show the GitCortex Studio desktop shell as the primary surface at startup. */
	GitCortexStudioShell = 'gitcortexStudioShell',
	/** Keep the classic Code-OSS workbench/editor as the primary surface. */
	Classic = 'classic',
}

Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration).registerConfiguration({
	id: 'gitcortex.shell',
	order: 5,
	title: localize('gitcortexStudioShellConfigurationTitle', "GitCortex Studio Shell"),
	type: 'object',
	properties: {
		[GitCortexShellConfiguration.StartupEditor]: {
			type: 'string',
			enum: [GitCortexShellStartupEditor.GitCortexStudioShell, GitCortexShellStartupEditor.Classic],
			enumDescriptions: [
				localize('gitcortex.shell.startupEditor.studio', "Open the GitCortex Studio desktop shell on startup. The classic workbench remains available through Developer Mode."),
				localize('gitcortex.shell.startupEditor.classic', "Keep the classic Code-OSS workbench as the primary surface."),
			],
			default: GitCortexShellStartupEditor.GitCortexStudioShell,
			description: localize('gitcortex.shell.startupEditor', "Controls whether GitCortex starts inside the Studio shell or the classic workbench."),
			scope: ConfigurationScope.APPLICATION,
		},
		[GitCortexShellConfiguration.DeveloperMode]: {
			type: 'boolean',
			default: false,
			description: localize('gitcortex.shell.developerMode', "When enabled, the classic workbench parts (activity bar, sidebar, panel) remain visible. When disabled, the Studio shell is the primary surface."),
			scope: ConfigurationScope.APPLICATION,
		},
		[GitCortexShellConfiguration.ShowChatAboveVm]: {
			type: 'boolean',
			default: true,
			description: localize('gitcortex.shell.chatAboveVm', "When enabled, the agent chat surface renders above the virtual machine surface in a resizable split. When disabled, surfaces render as tabs."),
			scope: ConfigurationScope.APPLICATION,
		},
		[GitCortexShellConfiguration.ChatRatio]: {
			type: 'number',
			default: 0.5,
			minimum: 0.25,
			maximum: 0.75,
			description: localize('gitcortex.shell.chatRatio', "The default starting ratio (0..1) of the chat surface height in the chat-above-VM split."),
			scope: ConfigurationScope.APPLICATION,
		},
	},
});