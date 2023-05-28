<script lang="ts">
	import { actions, actionsByKeyboardShortcut } from './keyEvents.store';
	import type { MaybePromise } from '@sveltejs/kit';

	export let playStartFrom = 0;

	let onKeyUpCallbacks: (() => MaybePromise<void>)[] = [];

	async function onKeyUp() {
		while (onKeyUpCallbacks.length) {
			await onKeyUpCallbacks.pop()?.();
		}
	}

	async function onKeyDown(event: KeyboardEvent) {
		const actionName = $actionsByKeyboardShortcut[event.key];
		if (!actionName) return;

		switch (actionName) {
			case 'play':
				actions.play(playStartFrom);
				break;
			default:
				const keyUp = await actions[actionName]();
				if (keyUp) onKeyUpCallbacks.push(keyUp);
				break;
		}
	}
</script>

<svelte:body on:keydown={onKeyDown} on:keyup={onKeyUp} />
