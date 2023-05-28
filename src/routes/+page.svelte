<script lang="ts">
	import { RangeSlider } from '@skeletonlabs/skeleton';
	import Record from '../icons/Record.svelte';
	import KeyEvents from './KeyEvents.svelte';
	import { actions, recordingStatus, tracks } from './keyEvents.store';

	let zoom = 1;
	let playHeadPx = 0;
	let playOffsetWidth = 0;
	let playHeadMoving = false;

	// Just a number that felt good. idk
	$: scaledZoom = zoom * 40;
	$: playHeadSeconds = playHeadPx / scaledZoom;

	function playHeadMove(e: MouseEvent) {
		if (playHeadMoving) {
			playHeadPx += e.movementX;
		}
		if (playHeadPx < 0) {
			playHeadPx = 0;
		}
		if (playHeadPx > playOffsetWidth) {
			playHeadPx = playOffsetWidth;
		}
	}
</script>

<KeyEvents playStartFrom={playHeadSeconds} />

<svelte:window on:mouseup={() => (playHeadMoving = false)} on:mousemove={playHeadMove} />

<div class="flex gap-2">
	<button
		class:opacity-80={$recordingStatus === 'off'}
		class:opacity-50={$recordingStatus === 'processing'}
		class="bg-surface-700 rounded-md p-2 transition-opacity flex items-center gap-2"
		on:click={() => actions.record()}
	>
		<Record class="inline" version={$recordingStatus === 'off' ? 'outline' : 'fill'} />
		Record
	</button>

	<button class="bg-surface-700 rounded-md py-2 px-8" on:click={() => actions.play(playHeadSeconds)}
		>Play</button
	>
	<RangeSlider class="w-full" name="zoom" bind:value={zoom} min={1} max={10} ticked />
</div>

<div
	class=" max-w-full flex flex-col gap-3 relative py-8"
	style={`--zoom: ${zoom}`}
	bind:offsetWidth={playOffsetWidth}
>
	<play-head style={`--position: ${playHeadPx}`} on:mousedown={() => (playHeadMoving = true)} />

	{#each $tracks as track}
		<div
			class="h-24 bg-primary-300 track rounded-sm"
			style={`--duration: ${track.audioBuffer.duration * scaledZoom}px`}
		/>
	{/each}
</div>

<style lang="postcss">
	.track {
		width: var(--duration);
	}

	play-head {
		position: absolute;
		top: 0;
		left: 0;
		transform: translateX(calc(var(--position) * 1px));
		height: 100%;
		width: 2px;
		background: theme(colors.primary.50);
	}

	play-head::before {
		content: '';
		position: absolute;
		/* draw play-head as a triangle POINTING DOWNWARD using clip-path */
		top: -7px;
		left: -7px;
		height: 30px;
		width: 16px;
		clip-path: polygon(0% 0%, 0% 75%, 50% 100%, 100% 75%, 100% 0%);
		background: theme(colors.primary.50);
	}
</style>
