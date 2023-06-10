<script lang="ts">
	// inspired by https://css-tricks.com/making-an-audio-waveform-visualizer-with-vanilla-javascript/
	// author admits this isn't very efficient (the `j` blockSize loop iterates 10s of thousands of points)
	// TODO: optimize

	import type { PageData } from './$types';

	export let data: PageData;
	const { audioBuffer } = data;

	console.log(audioBuffer.sampleRate);
	const rawData = audioBuffer.getChannelData(0);
	const samples = 100;
	const blockSize = Math.floor(rawData.length / samples);
	const filteredData = [];

	for (let i = 0; i < samples; i++) {
		const blockStart = blockSize * i;
		console.log('blockStart', blockStart, rawData.length);
		let sum = 0;
		for (let j = 0; j < blockSize; j++) {
			sum = sum + Math.abs(rawData[blockStart + j]);
		}
		filteredData.push(sum / blockSize);
	}

	console.log('data', filteredData);

	function normalizeData(data: number[]) {
		const multiplier = Math.pow(Math.max(...data), -1);
		return data.map((n) => n * multiplier);
	}

	const normalizedData = normalizeData(filteredData);
	console.log('normalizedData', normalizedData);
</script>

<svg class="text-primary-500" width={samples * 15}>
	{#each normalizedData as n, i}
		<rect x={i * 15} y={100 - n * 100} width="10" height={n * 100} fill="currentColor" />
	{/each}
</svg>
