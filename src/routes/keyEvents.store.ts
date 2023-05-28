import { derived, get, writable } from 'svelte/store';
import { Recorder, Synth, loaded, Players } from 'tone';
import { fileReaderLoadEnd } from '../utils.js';
import type { MaybePromise } from '@sveltejs/kit';

export type RecordingStatus = 'off' | 'on' | 'processing';

export const recorder = new Recorder();
export const synth = new Synth();

type Track = {
	name: string;
	audioBuffer: AudioBuffer;
	offsetSeconds: number;
};

export const tracks = writable<Track[]>([]);

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
		console.log(recorder.sampleTime);

		if (rawRecordingBlob.size === 0) {
			recordingStatus.set('off');
			return;
		}
		const fileReader = new FileReader();

		fileReader.readAsArrayBuffer(rawRecordingBlob);
		const arrayBuffer = await fileReaderLoadEnd(fileReader);
		const audioBuffer = await recorder.context.decodeAudioData(arrayBuffer);

		tracks.update(($tracks) =>
			$tracks.concat({
				name: `Track ${$tracks.length + 1}`,
				audioBuffer,
				offsetSeconds: 0
			})
		);
		recordingStatus.set('off');
	}
};

const play: KeyAction = {
	key: ' ',
	async action() {
		await loaded();
		const players = new Players();
		const $tracks = get(tracks);

		for (const track of $tracks) {
			players.add(track.name, track.audioBuffer);
		}

		await loaded();
		players.toDestination();

		for (const track of $tracks) {
			// Feels inefficient to create a new player for each track
			// TODO: combine audio buffers into one player?
			players.player(track.name).start();
		}
	}
};

const playSynth: KeyAction = {
	key: 'k',
	action() {
		synth.toDestination();
		synth.triggerAttack('A4', undefined, 0.5);

		return () => {
			synth.triggerRelease();
		};
	}
};

export const keyEvents = writable({ record, playSynth, play });
export const eventsByKey = derived(keyEvents, ($keyEvents) => {
	const actionsByKey: Record<string, KeyAction> = {};

	for (const keyEvent of Object.values($keyEvents)) {
		actionsByKey[keyEvent.key] = keyEvent;
	}

	return actionsByKey;
});
