export function draggable(
	node: HTMLElement,
	callback: (movementX: number, finished: boolean) => void
) {
	let moving = false;

	function onMouseDown() {
		moving = true;
	}

	function onMouseUp() {
		moving = false;
		callback(0, true);
	}

	function onMouseMove(e: MouseEvent) {
		if (!moving) return;

		callback(e.movementX, false);
	}

	node.addEventListener('mousedown', onMouseDown);

	window.addEventListener('mouseup', onMouseUp);
	window.addEventListener('mousemove', onMouseMove);

	return {
		destroy() {
			node.removeEventListener('mousedown', onMouseDown);
			window.removeEventListener('mouseup', onMouseUp);
			window.removeEventListener('mousemove', onMouseMove);
		}
	};
}
