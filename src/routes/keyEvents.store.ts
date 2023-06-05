import { get, writable } from 'svelte/store';
import { Recorder, Synth, loaded, Players, Player, Transport } from 'tone';
import type { MaybePromise } from '@sveltejs/kit';
import { fileReaderLoadEnd } from '../utils';

export type PlaybackStatus = 'off' | 'recording' | 'recording-processing' | 'playing';

const recorder = new Recorder();
const synth = new Synth();

export const playbackStatus = writable<PlaybackStatus>('off');
export const playheadPosition = writable(0);

Transport.bpm.value = 120;

playheadPosition.subscribe(($playheadPosition) => {
	// Don't sync playhead position while playing
	if (get(playbackStatus) === 'playing' || get(playbackStatus) === 'recording') return;
	Transport.seconds = $playheadPosition;
});

type FinishedTrack = {
	type: 'track';
	offset: number;
	duration: number;
	audioBuffer: AudioBuffer;
};

type Recording = {
	type: 'recording';
	offset: number;
};

type Track = FinishedTrack | Recording;
type TracksByName = Map<string, Track>;

function createTrackStore() {
	const tracks = writable<TracksByName>(new Map());
	const players = new Players();
	players.toDestination();
	const { subscribe, update } = tracks;

	return {
		subscribe,
		players,
		getPlayer(name: string): Player {
			return players.player(name);
		},
		async set(name: string, track: Track) {
			update(($tracks) => {
				$tracks.set(name, track);
				if (track.type === 'track' && !players.has(name)) {
					players.add(name, track.audioBuffer);
					players.player(name).sync().start(track.offset);
				}
				return $tracks;
			});
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

/**
 * Execute `onKeyDown`
 * Optionally returns function to execute `onKeyUp`
 */
type Action<TPayload = undefined> = TPayload extends undefined
	? () => ActionReturnType
	: (payload: TPayload) => ActionReturnType;

type ActionReturnType = MaybePromise<void | (() => MaybePromise<void>)>;

let recordingStartPosition = 0;
let recordingName = '';
const record: Action = async () => {
	const $playbackStatus = get(playbackStatus);
	// Hack: trigger silent synth note to force padding
	// on recording start and end
	const triggerSilence = () => synth.triggerAttack('A4', 0, 0);

	if ($playbackStatus === 'off') {
		recorder.start();
		playbackStatus.set('recording');
		triggerSilence();
		recordingStartPosition = get(playheadPosition);
		recordingName = `Track ${get(tracks).size + 1}`;
		tracks.set(recordingName, {
			type: 'recording',
			offset: recordingStartPosition
		});
		return;
	}

	if ($playbackStatus !== 'recording') return;

	playbackStatus.set('recording-processing');
	triggerSilence();

	const blob = await recorder.stop();
	const fileReader = new FileReader();

	fileReader.readAsArrayBuffer(blob);
	const arrayBuffer = await fileReaderLoadEnd(fileReader);
	if (!(arrayBuffer instanceof ArrayBuffer)) throw new Error('Failed to save recording.');
	const audioBuffer = await recorder.context.decodeAudioData(arrayBuffer);
	const { duration } = audioBuffer;

	tracks.set(recordingName, {
		type: 'track',
		audioBuffer,
		offset: recordingStartPosition,
		duration
	});
	playbackStatus.set('off');
};

// let recomputePaddedAudioBuffer = false;
const play: Action = async () => {
	const $playbackStatus = get(playbackStatus);
	if ($playbackStatus === 'off') {
		await loaded();
		Transport.start();
		playbackStatus.set('playing');
	} else if ($playbackStatus === 'playing') {
		Transport.stop();
		playbackStatus.set('off');
	}
};

const playSynth: Action = () => {
	synth.toDestination();
	synth.triggerAttack('A4', undefined, 0.5);

	return () => {
		synth.triggerRelease();
	};
};

const movePlayheadForward: Action = () => {
	return playheadPosition.update(($playheadPosition) => $playheadPosition + 1);
};

const movePlayheadBackward: Action = () => {
	return playheadPosition.update(($playheadPosition) => {
		const newPosition = $playheadPosition - 1;
		if (newPosition < 0) return 0;
		return newPosition;
	});
};

const movePlayheadToStart: Action = () => {
	playheadPosition.set(0);
};

export const actions = {
	record,
	playSynth,
	play,
	movePlayheadForward,
	movePlayheadBackward,
	movePlayheadToStart
};

export const actionsByKeyboardShortcut = writable<Record<string, keyof typeof actions>>({
	r: 'record',
	p: 'play',
	k: 'playSynth',
	l: 'movePlayheadForward',
	h: 'movePlayheadBackward',
	$: 'movePlayheadToStart'
});
