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
