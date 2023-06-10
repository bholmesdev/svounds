<script lang="ts">
	import Waveform from '../Waveform.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const { audioBuffer } = data;

	// console.log(audioBuffer.sampleRate);
	// const rawData = audioBuffer.getChannelData(0);
	// const samples = 100;
	// const blockSize = Math.floor(rawData.length / samples);
	// const filteredData = [];

	// for (let i = 0; i < samples; i++) {
	// 	const blockStart = blockSize * i;
	// 	console.log('blockStart', blockStart, rawData.length);
	// 	let sum = 0;
	// 	for (let j = 0; j < blockSize; j++) {
	// 		sum = sum + Math.abs(rawData[blockStart + j]);
	// 	}
	// 	filteredData.push(sum / blockSize);
	// }

	// console.log('data', filteredData);

	// function normalizeData(data: number[]) {
	// 	const multiplier = Math.pow(Math.max(...data), -1);
	// 	return data.map((n) => n * multiplier);
	// }

	// const normalizedData = normalizeData(filteredData);
	// console.log('normalizedData', normalizedData);
</script>

<Waveform {audioBuffer} />
