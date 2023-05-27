<script>
	/** @type {import('tone').Synth} */
	export let synth;

	/** @param {KeyboardEvent} event */
	function onSpaceDown(event) {
		synth.toDestination();
		if (event.key === 'k') {
			synth.triggerAttack('A4', undefined, 0.5);
		}
	}

	/** @param {KeyboardEvent} event */
	function onKeyUp(event) {
		synth.toDestination();
		if (event.key === 'k') {
			synth.triggerRelease();
		}
	}
</script>

<svelte:body on:keydown={onSpaceDown} on:keyup={onKeyUp} />
