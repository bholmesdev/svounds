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

export function beatsToSeconds(beats: number, bpm: number) {
	return beats * (60 / bpm);
}

export function secondsToBeats(seconds: number, bpm: number) {
	return seconds / (60 / bpm);
}
