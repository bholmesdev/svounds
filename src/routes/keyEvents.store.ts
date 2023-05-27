import { derived, get, writable, type Writable } from 'svelte/store';
import { Recorder, loaded, Player, Synth } from 'tone';
import { fileReaderLoadEnd } from '../utils.js';
import type { MaybePromise } from '@sveltejs/kit';

export type RecordingStatus = 'off' | 'on' | 'processing';

export const recorder = new Recorder();
export const synth = new Synth();

synth.connect(recorder);

export const recordingStatus = writable<RecordingStatus>('off');

export type KeyAction = {
	key: string;
	/**
	 * Execute `onKeyDown`
	 * Optionally returns function to execute `onKeyUp`
	 */
	action: () => MaybePromise<void | (() => MaybePromise<void>)>;
};

const record: KeyAction = {
	key: 'r',
	async action() {
		const $recordingStatus = get(recordingStatus);

		if ($recordingStatus === 'off') {
			recorder.start();
			recordingStatus.set('on');
			return;
		}

		if ($recordingStatus === 'processing') {
			return;
		}

		recordingStatus.set('processing');
		const rawRecordingBlob = await recorder.stop();

		if (rawRecordingBlob.size === 0) {
			recordingStatus.set('off');
			return;
		}
		const fileReader = new FileReader();

		fileReader.readAsArrayBuffer(rawRecordingBlob);
		const arrayBuffer = await fileReaderLoadEnd(fileReader);
		const audioBuffer = await recorder.context.decodeAudioData(arrayBuffer);
		const player = new Player(audioBuffer).toDestination();
		await loaded();
		player.start();
		recordingStatus.set('off');
	}
};

const playSynth: KeyAction = {
	key: 'k',
	action() {
		console.log('play time');
		synth.toDestination();
		synth.triggerAttack('A4', undefined, 0.5);

		return () => {
			synth.triggerRelease();
		};
	}
};

export const keyEvents = writable({ record, playSynth });
export const eventsByKey = derived(keyEvents, ($keyEvents) => {
	const actionsByKey: Record<string, KeyAction> = {};

	for (const keyEvent of Object.values($keyEvents)) {
		actionsByKey[keyEvent.key] = keyEvent;
	}

	return actionsByKey;
});
