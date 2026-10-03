/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize, localize2 } from '../../../../nls.js';
import { Registry } from '../../../../platform/registry/common/platform.js';
import { EditorExtensions, IEditorFactoryRegistry } from '../../../common/editor.js';
import { registerAction2, Action2 } from '../../../../platform/actions/common/actions.js';
import { IInstantiationService, ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { EditorPaneDescriptor, IEditorPaneRegistry } from '../../../browser/editor.js';
import { SyncDescriptor } from '../../../../platform/instantiation/common/descriptors.js';
import { IWorkbenchContribution, registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { IEditorGroupsService } from '../../../services/editor/common/editorGroupsService.js';
import { GettingStartedInput } from '../../welcomeGettingStarted/browser/gettingStartedInput.js';
import { GitCortexStudioShellInput } from './gitcortexStudioShellInput.js';
import { GitCortexStudioShellPage, GitCortexStudioShellInputSerializer } from './gitcortexStudioShell.js';
import { GitCortexShellConfiguration } from '../common/shellConfiguration.js';

// Editor pane registration
Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane).registerEditorPane(
	EditorPaneDescriptor.create(
		GitCortexStudioShellPage,
		GitCortexStudioShellPage.ID,
		localize('gitcortexStudioShell', "GitCortex Studio")
	),
	[
		new SyncDescriptor(GitCortexStudioShellInput)
	]
);

Registry.as<IEditorFactoryRegistry>(EditorExtensions.EditorFactory).registerEditorSerializer(GitCortexStudioShellInput.ID, GitCortexStudioShellInputSerializer);

// Command to reopen the Studio shell
registerAction2(class extends Action2 {
	constructor() {
		super({
			id: GitCortexStudioShellPage.COMMAND_ID,
			title: localize2('openGitCortexStudioShell', "Open GitCortex Studio"),
		});
	}

	async run(accessor: ServicesAccessor): Promise<void> {
		const editorService = accessor.get(IEditorService);
		const instantiationService = accessor.get(IInstantiationService);
		const input = instantiationService.createInstance(GitCortexStudioShellInput, { initiator: 'command' });
		await editorService.openEditor(input, { pinned: true });
	}
});

// Startup runner: open the Studio shell instead of the classic workbench when
// gitcortex.shell.startupEditor is 'gitcortexStudioShell' (the default).
class GitCortexStudioShellRunnerContribution extends Disposable implements IWorkbenchContribution {
	static readonly ID = 'workbench.contrib.gitcortexStudioShellRunner';

	constructor(
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@IEditorService private readonly editorService: IEditorService,
		@IEditorGroupsService private readonly editorGroupsService: IEditorGroupsService,
		@IInstantiationService private readonly instantiationService: IInstantiationService,
	) {
		super();
		void this.run();
	}

	private async run(): Promise<void> {
        const startupEditor = this.configurationService.getValue<string>(GitCortexShellConfiguration.StartupEditor);
        if (startupEditor !== 'gitcortexStudioShell') {
                return; // keep classic behaviour when configured otherwise
        }

        await this.editorGroupsService.whenReady;

        const active = this.editorService.activeEditor;

        // A real file/workspace opened (e.g. via CLI) wins over the synthetic Studio shell startup surface.
        // When the configured startup surface is the Studio shell, replace the classic
        // Code-OSS welcome placeholder that opens first at Restored. A real file or
        // folder opened via the command line is left untouched: openEditor only
        // replaces an editor when the shell is already the active surface or the welcome
        // is the placeholder.
        if (active && !(active instanceof GitCortexStudioShellInput) && !(active instanceof GettingStartedInput)) {
                return;
        }

        const input = this.instantiationService.createInstance(GitCortexStudioShellInput, { initiator: 'startup' });
        await this.editorService.openEditor(input, { pinned: true });
}
}

registerWorkbenchContribution2(GitCortexStudioShellRunnerContribution.ID, GitCortexStudioShellRunnerContribution, WorkbenchPhase.AfterRestored);