<script>
	import { onMount } from 'svelte';
	import { wait, fileReaderLoadEnd } from '../utils.js';
	import { Player, loaded, Synth, Recorder } from 'tone';
	import KeyEvents from './KeyEvents.svelte';
	import Record from '../icons/Record.svelte';

	/** @type {import('tone').Recorder} */
	let recorder;
	/** @type {import('tone').Synth} */
	let synth;

	/** @type {'on' | 'off' | 'processing'}*/
	let recordingStatus = 'off';
	$: console.log('recordingStatus', recordingStatus);

	onMount(() => {
		recorder = new Recorder();
		synth = new Synth().connect(recorder);
	});

	function playSynth() {
		if (!recorder) {
			throw new Error('Recording must be started before playing the synth!');
		}

		synth = new Synth().connect(recorder);
		synth.triggerAttackRelease('C3', 0.5);
		synth.triggerAttackRelease('C3', 0.5, '+1');
		synth.triggerAttackRelease('C3', 0.5, '+2');
	}

	async function toggleRecording() {
		if (recordingStatus === 'off') {
			recorder.start();
			recordingStatus = 'on';
			return;
		}

		if (recordingStatus === 'processing') {
			return;
		}

		recordingStatus = 'processing';
		const rawRecordingBlob = await recorder.stop();

		if (rawRecordingBlob.size === 0) {
			recordingStatus = 'off';
			return;
		}
		const fileReader = new FileReader();

		/** @type {ArrayBuffer} */
		let arrayBuffer;

		fileReader.readAsArrayBuffer(rawRecordingBlob);
		arrayBuffer = await fileReaderLoadEnd(fileReader);

		const audioBuffer = await recorder.context.decodeAudioData(arrayBuffer);
		const player = new Player(audioBuffer).toDestination();
		await loaded();
		player.start();
		recordingStatus = 'off';
	}
</script>

<KeyEvents {synth} />

<div class="container h-full mx-auto flex justify-center items-center">
	<div class="flex flex-col gap-5">
		<h1 class="h1">Let's get cracking tones!</h1>
		<p>Start by exploring:</p>
		<button
			class:opacity-80={recordingStatus === 'off'}
			class:opacity-50={recordingStatus === 'processing'}
			class="transition-opacity"
			on:click={toggleRecording}
		>
			<Record version={recordingStatus === 'off' ? 'outline' : 'fill'} />
		</button>
		<button on:click={playSynth}>Play Synth</button>
	</div>
</div>
