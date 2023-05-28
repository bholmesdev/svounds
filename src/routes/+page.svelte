<script lang="ts">
	import Record from '../icons/Record.svelte';
	import KeyEvents from './KeyEvents.svelte';
	import { keyEvents, recordingStatus, tracks } from './keyEvents.store';

	let zoom = 1;
</script>

<KeyEvents />

<div class="flex gap-2">
	<button
		class:opacity-80={$recordingStatus === 'off'}
		class:opacity-50={$recordingStatus === 'processing'}
		class="bg-surface-700 rounded-md p-2 transition-opacity flex items-center gap-2"
		on:click={() => $keyEvents.record.action()}
	>
		<Record class="inline" version={$recordingStatus === 'off' ? 'outline' : 'fill'} />
		Record
	</button>

	<button class="bg-surface-700 rounded-md py-2 px-8" on:click={() => $keyEvents.play.action()}
		>Play</button
	>
</div>

<div class="overflow-y-scroll max-w-full">
	{#each $tracks as track}
		<div class="h-24 bg-primary-300 track" style={`--duration: ${track.audioBuffer.duration}`} />
	{/each}
</div>

<style>
	.track {
		--duration: 0;
		width: calc(var(--duration) * 40px);
	}
</style>
