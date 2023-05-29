<script lang="ts">
	import { RangeSlider } from '@skeletonlabs/skeleton';
	import Record from '../icons/Record.svelte';
	import KeyEvents from './KeyEvents.svelte';
	import { actions, playbackStatus, playheadPosition, tracks } from './keyEvents.store';

	let zoom = 1;
	let trackWindowWidth = 0;
	let playHeadMoving = false;

	// Just a number that felt good. idk
	$: scaledZoom = zoom * 40;
	$: scaledPlayheadPosition = $playheadPosition * scaledZoom;

	function playHeadMove(e: MouseEvent) {
		if (!playHeadMoving) return;

		playheadPosition.update((p) => p + e.movementX / scaledZoom);
		if ($playheadPosition < 0) {
			playheadPosition.set(0);
		}
		const descaledWidth = trackWindowWidth / scaledZoom;
		if ($playheadPosition > descaledWidth) {
			playheadPosition.set(descaledWidth);
		}
	}

	let movingInterval: ReturnType<typeof setInterval> | undefined;

	playbackStatus.subscribe((status) => {
		if (!movingInterval && (status === 'playing' || status === 'recording')) {
			movingInterval = setInterval(() => {
				playheadPosition.update((p) => p + 1 / scaledZoom);
			}, 1000 / scaledZoom);
		} else if (movingInterval && (status === 'off' || status === 'recording-processing')) {
			clearInterval(movingInterval);
			movingInterval = undefined;
		}
	});
</script>

<KeyEvents />

<svelte:window on:mouseup={() => (playHeadMoving = false)} on:mousemove={playHeadMove} />

<div class="flex gap-2">
	<button
		class:opacity-50={$playbackStatus === 'recording-processing'}
		class="bg-surface-700 rounded-md p-2 transition-opacity flex items-center gap-2"
		on:click={() => actions.record()}
	>
		<Record
			class="inline"
			version={$playbackStatus === 'recording' || $playbackStatus === 'recording-processing'
				? 'fill'
				: 'outline'}
		/>
		Record
	</button>

	<button
		class="bg-surface-700 rounded-md py-2 px-8"
		disabled={$playbackStatus === 'recording' || $playbackStatus === 'recording-processing'}
		on:click={() => actions.play()}>Play</button
	>
	<RangeSlider class="w-full" name="zoom" bind:value={zoom} min={1} max={10} ticked />
</div>

<div
	class=" rounded-sm bg-surface-900 max-w-full flex flex-col gap-3 relative py-8"
	bind:offsetWidth={trackWindowWidth}
>
	<ruler-ticks
		class="relative w-full h-5 bg-surface-800"
		style={`--tick-spacing: ${scaledZoom}px;`}
	/>

	<play-head
		style={`--position: ${scaledPlayheadPosition}`}
		on:mousedown={() => (playHeadMoving = true)}
	/>

	{#each [...$tracks] as [name, track]}
		<div
			class="h-24 bg-primary-300 track rounded-sm w-[var(--duration)] translate-x-[var(--offset)]"
			style={`
			--duration: ${track.duration * scaledZoom}px;
			--offset: ${track.offset * scaledZoom}px;
			`}
		>
			{name}
		</div>
	{/each}
</div>

<style lang="postcss">
	ruler-ticks::before {
		--tick-stop: calc(100% - 2px);
		content: '';
		background-image: linear-gradient(
			90deg,
			transparent 0%,
			transparent var(--tick-stop),
			theme(colors.surface.700) var(--tick-stop)
		);
		position: absolute;
		inset: 0;
		background-size: var(--tick-spacing) 100%;
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
