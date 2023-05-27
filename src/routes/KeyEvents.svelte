<script lang="ts">
	import { eventsByKey } from './keyEvents.store';
	import type { MaybePromise } from '@sveltejs/kit';

	let onKeyUpCallbacks: (() => MaybePromise<void>)[] = [];

	async function onKeyUp() {
		while (onKeyUpCallbacks.length) {
			await onKeyUpCallbacks.pop()?.();
		}
	}

	async function onKeyDown({ key }: KeyboardEvent) {
		if (key in $eventsByKey) {
			const onKeyUp = await $eventsByKey[key].action();
			if (onKeyUp) {
				onKeyUpCallbacks.push(onKeyUp);
			}
		}
	}
</script>

<svelte:body on:keydown={onKeyDown} on:keyup={onKeyUp} />
