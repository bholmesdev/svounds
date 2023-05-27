/** @param {number} ms */
export function wait(ms) {
	return new Promise((resolve) => {
		setTimeout(() => resolve(null), ms);
	});
}

/** @param {FileReader} fileReader */
export function fileReaderLoadEnd(fileReader) {
	return new Promise((resolve) => {
		fileReader.onloadend = () => {
			resolve(fileReader.result);
		};
	});
}
