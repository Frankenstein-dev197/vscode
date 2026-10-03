/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Pure split-view sizing logic for the GitCortex Studio Shell "chat above VM"
 * layout. Kept free of DOM so it can be unit tested and reused by any renderer.
 *
 * The split is vertical: the chat surface sits above the virtual machine
 * surface, separated by a keyboard- and mouse-accessible divider.
 */

export const SPLIT_MIN_CHAT_RATIO = 0.25;
export const SPLIT_MAX_CHAT_RATIO = 0.75;
export const SPLIT_DEFAULT_CHAT_RATIO = 0.5;
export const SPLIT_SNAP_THRESHOLD_RATIO = 0.08;

export interface SplitViewState {
	/** Ratio of the total height taken by the top (chat) surface. */
	readonly chatRatio: number;
}

export interface SplitViewDimension {
	readonly height: number;
}

export function defaultSplitViewState(): SplitViewState {
	return { chatRatio: SPLIT_DEFAULT_CHAT_RATIO };
}

export function clampChatRatio(ratio: number): number {
	if (!Number.isFinite(ratio)) {
		return SPLIT_DEFAULT_CHAT_RATIO;
	}
	return Math.min(SPLIT_MAX_CHAT_RATIO, Math.max(SPLIT_MIN_CHAT_RATIO, ratio));
}

/**
 * Convert a pointer Y offset within the split container to a clamped chat ratio.
 */
export function ratioFromOffset(offset: number, dimension: SplitViewDimension): number {
	if (!Number.isFinite(offset) || dimension.height <= 0) {
		return SPLIT_DEFAULT_CHAT_RATIO;
	}
	return clampChatRatio(offset / dimension.height);
}

/**
 * Computes the chat surface height in pixels for a given state and container.
 */
export function chatHeightForState(state: SplitViewState, dimension: SplitViewDimension): number {
	return Math.max(0, Math.round(state.chatRatio * dimension.height));
}

/**
 * Returns true when the divider is near the top or bottom edge, which renders
 * the split as a single surface (chat only or VM only).
 */
export function isSplitSnapped(state: SplitViewState): boolean {
	return state.chatRatio <= SPLIT_SNAP_THRESHOLD_RATIO || state.chatRatio >= 1 - SPLIT_SNAP_THRESHOLD_RATIO;
}

export function mergeSplitState(current: SplitViewState, next: SplitViewState): SplitViewState {
	return { chatRatio: clampChatRatio(next.chatRatio) };
}

function ratioToPercent(ratio: number): string {
	return `${Math.round(ratio * 100)}%`;
}

export function chatSurfaceStyle(state: SplitViewState): { top: string; bottom: string } {
	return {
		top: ratioToPercent(state.chatRatio),
		bottom: ratioToPercent(1 - state.chatRatio),
	};
}

export function vmSurfaceStyle(state: SplitViewState): { top: string; bottom: string } {
	return {
		top: ratioToPercent(state.chatRatio),
		bottom: ratioToPercent(1 - state.chatRatio),
	};
}

/**
 * Persist-friendly serialization used by the workspace-scoped storage.
 */
export function serializeSplitViewState(state: SplitViewState): string {
	return JSON.stringify(state);
}

export function deserializeSplitViewState(serialized: string | undefined): SplitViewState {
	if (!serialized) {
		return defaultSplitViewState();
	}
	try {
		const parsed = JSON.parse(serialized) as SplitViewState;
		if (typeof parsed.chatRatio !== 'number') {
			return defaultSplitViewState();
		}
		return { chatRatio: clampChatRatio(parsed.chatRatio) };
	} catch {
		return defaultSplitViewState();
	}
}