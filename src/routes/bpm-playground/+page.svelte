<script lang="ts">
	import { onMount } from 'svelte';
	import { Player, Transport, loaded, start } from 'tone';
	import type { PageData } from './$types';

	export let data: PageData;

	onMount(async () => {
		const player = new Player(data.audioBuffer);
		player.toDestination();
		player.playbackRate = 2;
		await loaded();
		player.sync().start();
	});

	setInterval(() => {
		playheadPosition = Transport.seconds * 40;
	}, 16);

	let playheadPosition = 0;
	let bpm = 60;

	$: Transport.bpm.value = bpm;
</script>

<svelte:window
	on:keydown={(e) => {
		if (e.key === ' ') {
			e.preventDefault();
			if (Transport.state === 'started') {
				Transport.stop();
			} else {
				start();
				Transport.start();
				Transport.bpm.rampTo(120, 1);
			}
		}
	}}
/>

<input class="input" type="number" bind:value={bpm} />
<div class="rounded-sm bg-surface-900 min-w-[100vw] flex flex-col gap-3 relative py-8">
	<play-head style={`--position: ${playheadPosition}`} />
</div>

<style lang="postcss">
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
		top: -7px;
		left: -7px;
		height: 30px;
		width: 16px;
		clip-path: polygon(0% 0%, 0% 75%, 50% 100%, 100% 75%, 100% 0%);
		background: theme(colors.primary.50);
	}
</style>
