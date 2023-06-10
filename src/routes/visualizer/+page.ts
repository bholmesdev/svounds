import { ToneAudioBuffer, context, loaded } from 'tone';

export const ssr = false;

export async function load() {
	// const response = await fetch('/loading.m4a');
	// const arrayBuffer = await response.arrayBuffer();
	// const audioBuffer = await context.decodeAudioData(arrayBuffer);
	const audioBuffer = new ToneAudioBuffer('/loading.m4a');
	await loaded();
	return {
		audioBuffer
	};
}
