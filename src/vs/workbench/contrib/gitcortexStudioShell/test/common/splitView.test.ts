/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import {
	SPLIT_DEFAULT_CHAT_RATIO,
	SPLIT_MAX_CHAT_RATIO,
	SPLIT_MIN_CHAT_RATIO,
	chatHeightForState,
	clampChatRatio,
	defaultSplitViewState,
	deserializeSplitViewState,
	isSplitSnapped,
	mergeSplitState,
	ratioFromOffset,
	serializeSplitViewState,
} from '../../common/splitView.js';

suite('GitCortex Studio Shell — split view logic', () => {

	ensureNoDisposablesAreLeakedInTestSuite();

	test('default state uses the midpoint ratio', () => {
		const state = defaultSplitViewState();
		assert.strictEqual(state.chatRatio, 0.5);
	});

	test('clampChatRatio bounds the ratio', () => {
		assert.strictEqual(clampChatRatio(0.1), SPLIT_MIN_CHAT_RATIO);
		assert.strictEqual(clampChatRatio(0.9), SPLIT_MAX_CHAT_RATIO);
		assert.strictEqual(clampChatRatio(0.5), 0.5);
		// Non-finite input falls back to the default rather than fraction garbage.
		assert.strictEqual(clampChatRatio(Number.NaN), SPLIT_DEFAULT_CHAT_RATIO);
		assert.strictEqual(clampChatRatio(Number.POSITIVE_INFINITY), SPLIT_DEFAULT_CHAT_RATIO);
	});

	test('ratioFromOffset converts a pixel offset into a clamped ratio', () => {
		assert.strictEqual(ratioFromOffset(250, { height: 1000 }), 0.25);
		assert.strictEqual(ratioFromOffset(500, { height: 1000 }), 0.5);
		assert.strictEqual(ratioFromOffset(50, { height: 1000 }), SPLIT_MIN_CHAT_RATIO);
		// Zero/negative container height falls back to the default.
		assert.strictEqual(ratioFromOffset(500, { height: 0 }), SPLIT_DEFAULT_CHAT_RATIO);
	});

	test('chatHeightForState computes pixel height clipped to zero', () => {
		assert.strictEqual(chatHeightForState({ chatRatio: 0.5 }, { height: 800 }), 400);
		assert.strictEqual(chatHeightForState({ chatRatio: 0.3 }, { height: 800 }), 240);
		assert.strictEqual(chatHeightForState({ chatRatio: 0.3 }, { height: 10 }), 3);
	});

	test('isSplitSnapped detects edge ratios', () => {
		assert.strictEqual(isSplitSnapped({ chatRatio: 0.05 }), true);
		assert.strictEqual(isSplitSnapped({ chatRatio: 0.95 }), true);
		assert.strictEqual(isSplitSnapped({ chatRatio: 0.5 }), false);
		assert.strictEqual(isSplitSnapped({ chatRatio: 0.12 }), false);
	});

	test('mergeSplitState clamps the incoming ratio', () => {
		const merged = mergeSplitState({ chatRatio: 0.5 }, { chatRatio: 0.9 });
		assert.strictEqual(merged.chatRatio, SPLIT_MAX_CHAT_RATIO);
	});

	test('serialize/deserialize round-trips and tolerates garbage', () => {
		const original = { chatRatio: 0.4 };
		const serialized = serializeSplitViewState(original);
		const restored = deserializeSplitViewState(serialized);
		assert.deepStrictEqual(restored, original);

		assert.deepStrictEqual(deserializeSplitViewState(undefined), defaultSplitViewState());
		assert.deepStrictEqual(deserializeSplitViewState('not json'), defaultSplitViewState());
		assert.deepStrictEqual(deserializeSplitViewState('{"chatRatio":"nope"}'), defaultSplitViewState());
	});
});