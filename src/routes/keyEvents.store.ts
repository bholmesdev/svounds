import { get, writable } from 'svelte/store';
import { Recorder, Synth, loaded, Players, Player } from 'tone';
import type { MaybePromise } from '@sveltejs/kit';
import { fileReaderLoadEnd, padStartOfBuffer } from '../utils';

export type RecordingStatus = 'off' | 'on' | 'processing';

const recorder = new Recorder();
const synth = new Synth();

type Track = {
	offset: number;
	duration: number;
	audioBuffer: AudioBuffer;
};

type TracksByName = Map<string, Track>;

function createTrackStore() {
	const tracks = writable<TracksByName>(new Map());
	const players = new Players();
	players.toDestination();
	const { subscribe, update } = tracks;

	return {
		subscribe,
		getPlayer(name: string): Player {
			return players.player(name);
		},
		add(name: string, track: Track) {
			update(($tracks) => {
				$tracks.set(name, track);
				return $tracks;
			});
			players.add(name, track.audioBuffer);
		},
		remove(name: string) {
			update(($tracks) => {
				$tracks.delete(name);
				return $tracks;
			});
			players.player(name)?.dispose();
		}
	};
}

export const tracks = createTrackStore();

synth.connect(recorder);

export const recordingStatus = writable<RecordingStatus>('off');

/**
 * Execute `onKeyDown`
 * Optionally returns function to execute `onKeyUp`
 */
type Action<TPayload = undefined> = TPayload extends undefined
	? () => ActionReturnType
	: (payload: TPayload) => ActionReturnType;

type ActionReturnType = MaybePromise<void | (() => MaybePromise<void>)>;

const record: Action<number> = async (offset) => {
	const $recordingStatus = get(recordingStatus);
	// Hack: trigger silent synth note to force padding
	// on recording start and end
	const triggerSilence = () => synth.triggerAttack('A4', 0, 0);

	if ($recordingStatus === 'off') {
		recorder.start();
		recordingStatus.set('on');
		triggerSilence();
		return;
	}

	if ($recordingStatus === 'processing') {
		return;
	}

	recordingStatus.set('processing');
	triggerSilence();

	const blob = await recorder.stop();
	const fileReader = new FileReader();

	fileReader.readAsArrayBuffer(blob);
	const arrayBuffer = await fileReaderLoadEnd(fileReader);
	if (!(arrayBuffer instanceof ArrayBuffer)) throw new Error('Failed to save recording.');
	const unpaddedBuffer = await recorder.context.decodeAudioData(arrayBuffer);
	const { duration } = unpaddedBuffer;
	const audioBuffer = padStartOfBuffer(unpaddedBuffer, offset);

	tracks.add(`Track ${get(tracks).size + 1}`, {
		// Pre-pad the buffer with the offset
		// To ensure playback starts at the correct time.
		// Tried using Tone's `start(startTime)` but it didn't work
		// when using multiple players or on repeat plays.
		audioBuffer,
		offset,
		duration
	});
	recordingStatus.set('off');
};

const play: Action<number> = async (playHeadOffset) => {
	await loaded();
	for (const name of get(tracks).keys()) {
		tracks.getPlayer(name).start(0, playHeadOffset);
	}
};

const playSynth: Action = () => {
	synth.toDestination();
	synth.triggerAttack('A4');

	return () => {
		synth.triggerRelease();
	};
};

export const actions = { record, playSynth, play };

export const actionsByKeyboardShortcut = writable<Record<string, keyof typeof actions>>({
	r: 'record',
	p: 'play',
	k: 'playSynth'
});
