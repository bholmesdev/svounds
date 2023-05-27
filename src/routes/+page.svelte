<script lang="ts">
	import Record from '../icons/Record.svelte';
	import KeyEvents from './KeyEvents.svelte';
	import { keyEvents, recordingStatus } from './keyEvents.store';
</script>

<KeyEvents />

<button
	class:opacity-80={$recordingStatus === 'off'}
	class:opacity-50={$recordingStatus === 'processing'}
	class="transition-opacity"
	on:click={() => $keyEvents.record.action()}
>
	<Record version={$recordingStatus === 'off' ? 'outline' : 'fill'} />
</button>
