/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { localize } from '../../../../nls.js';
import { EditorInput } from '../../../common/editor/editorInput.js';
import { URI } from '../../../../base/common/uri.js';
import { Schemas } from '../../../../base/common/network.js';
import { IUntypedEditorInput } from '../../../common/editor.js';
import { IEditorOptions } from '../../../../platform/editor/common/editor.js';

export const gitcortexStudioShellInputTypeId = 'workbench.editors.gitcortexStudioShellInput';
export type GitCortexStudioShellInitiator = 'startup' | 'command' | 'developer';

export interface GitCortexStudioShellEditorOptions extends IEditorOptions {
	initiator?: GitCortexStudioShellInitiator;
}

export class GitCortexStudioShellInput extends EditorInput {

	static readonly ID = gitcortexStudioShellInputTypeId;
	static readonly RESOURCE = URI.from({ scheme: Schemas.walkThrough, authority: 'gitcortex_studio_shell' });

	private readonly _initiator: GitCortexStudioShellInitiator;

	override get typeId(): string {
		return GitCortexStudioShellInput.ID;
	}

	override get editorId(): string | undefined {
		return this.typeId;
	}

	override toUntyped(): IUntypedEditorInput {
		return {
			resource: GitCortexStudioShellInput.RESOURCE,
			options: {
				override: GitCortexStudioShellInput.ID,
				pinned: false
			}
		};
	}

	get resource(): URI | undefined {
		return GitCortexStudioShellInput.RESOURCE;
	}

	override matches(other: EditorInput | IUntypedEditorInput): boolean {
		if (super.matches(other)) {
			return true;
		}
		return other instanceof GitCortexStudioShellInput;
	}

	constructor(options: GitCortexStudioShellEditorOptions = {}) {
		super();
		this._initiator = options.initiator ?? 'command';
	}

	override getName() {
		return localize('gitcortexStudioShellName', "Studio");
	}

	get initiator(): GitCortexStudioShellInitiator {
		return this._initiator;
	}
}