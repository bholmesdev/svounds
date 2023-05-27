<script>
	/** @type {'outline' | 'fill'} */
	export let version = 'outline';

	let className = '';
	export { className as class };
</script>

{#if version === 'outline'}
	<svg
		class={className}
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		viewBox="0 0 24 24"
		><path
			fill="currentColor"
			fillRule="evenodd"
			d="M12 2.75a9.25 9.25 0 1 0 0 18.5a9.25 9.25 0 0 0 0-18.5ZM1.25 12C1.25 6.063 6.063 1.25 12 1.25S22.75 6.063 22.75 12S17.937 22.75 12 22.75S1.25 17.937 1.25 12Z"
			clipRule="evenodd"
		/></svg
	>
{:else}
	<svg
		class={className}
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor" /></svg
	>
{/if}
