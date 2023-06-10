<script lang="ts">
	// inspired by https://css-tricks.com/making-an-audio-waveform-visualizer-with-vanilla-javascript/
	// author admits this isn't very efficient (the `j` blockSize loop iterates 10s of thousands of points)
	// TODO: optimize
	import type { ToneAudioBuffer } from 'tone';

	export let audioBuffer: AudioBuffer | ToneAudioBuffer;
	export let zoom: number = 1;

	const BAR_WIDTH = 3;
	const BAR_SPACING = 2;
	const BLOCK_SIZE = 1000;

	$: channelData = audioBuffer.getChannelData(0);
	$: samples = Math.floor((channelData.length * zoom) / BLOCK_SIZE);

	let waveformPoints: number[];
	$: {
		const filteredData = [];

		for (let i = 0; i < samples; i++) {
			const blockStart = BLOCK_SIZE * i;
			let sum = 0;
			for (let j = 0; j < BLOCK_SIZE; j++) {
				sum = sum + Math.abs(channelData[blockStart + j]);
			}
			filteredData.push(sum / BLOCK_SIZE);
		}

		waveformPoints = normalizeData(filteredData);
	}

	function normalizeData(data: number[]) {
		const multiplier = Math.pow(Math.max(...data), -1);
		return data.map((n) => n * multiplier);
	}
</script>

<svg class="text-primary-500" width={samples * (BAR_WIDTH + BAR_SPACING)}>
	{#each waveformPoints as n, i}
		<rect
			x={i * (BAR_WIDTH + BAR_SPACING)}
			y={50 - n * 50}
			width={BAR_WIDTH}
			height={n * 100}
			fill="currentColor"
			rx="2"
		/>
	{/each}
</svg>
