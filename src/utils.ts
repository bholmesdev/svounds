import { context } from 'tone';

export function wait(ms: number) {
	return new Promise((resolve) => {
		setTimeout(() => resolve(null), ms);
	});
}

export function fileReaderLoadEnd(fileReader: FileReader): Promise<string | ArrayBuffer | null> {
	return new Promise((resolve) => {
		fileReader.onloadend = () => {
			resolve(fileReader.result);
		};
	});
}

export function padStartOfBuffer(audioBuffer: AudioBuffer, silenceInSeconds: number): AudioBuffer {
	const paddedBuffer = context.createBuffer(
		audioBuffer.numberOfChannels,
		audioBuffer.length + silenceInSeconds * audioBuffer.sampleRate,
		audioBuffer.sampleRate
	);
	for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
		const paddedData = paddedBuffer.getChannelData(channel);
		const data = audioBuffer.getChannelData(channel);
		paddedData.set(data, silenceInSeconds * audioBuffer.sampleRate);
	}
	return paddedBuffer;
}
