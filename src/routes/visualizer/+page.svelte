<script lang="ts">
	import Waveform from '../Waveform.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const { audioBuffer } = data;
</script>

<Waveform {audioBuffer} />
