import { get, writable } from 'svelte/store';
import { Recorder, Synth, loaded, Players, Player, Transport } from 'tone';
import type { MaybePromise } from '@sveltejs/kit';
import { fileReaderLoadEnd } from '../utils';

export type PlaybackStatus = 'off' | 'recording' | 'recording-processing' | 'playing';

const recorder = new Recorder();
const synth = new Synth();

Transport.bpm.value = 120;

type TransportStore = {
	status: PlaybackStatus;
	progress: number;
};

function createTransportStore() {
	const store = writable<TransportStore>({
		status: 'off',
		progress: 0
	});

	function setStatus(status: PlaybackStatus) {
		store.update((s) => ({ ...s, status }));
	}
	return {
		subscribe: store.subscribe,
		setStatus,
		setProgress(progress: number) {
			store.update((s) => ({ ...s, progress }));
		},
		updateProgress(callback: (progress: number) => number) {
			store.update((s) => {
				const progress = callback(s.progress);
				return { ...s, progress };
			});
		},
		start() {
			Transport.start(undefined, get(store).progress);
			setStatus('playing');
			requestAnimationFrame(playInterval);
		},
		record() {
			setStatus('recording');
			requestAnimationFrame(recordingInterval);
		},
		stop() {
			Transport.stop();
			setStatus('off');
		}
	};
}

export const transport = createTransportStore();

let prevTimestamp: DOMHighResTimeStamp | undefined;
function recordingInterval(timestamp: DOMHighResTimeStamp) {
	transport.updateProgress((progress) => {
		if (!prevTimestamp) return progress;
		if (get(transport).status !== 'recording') {
			prevTimestamp = undefined;
			return progress;
		}
		return progress + (timestamp - prevTimestamp) / 1000;
	});
	prevTimestamp = timestamp;
	requestAnimationFrame(recordingInterval);
}

function playInterval() {
	transport.updateProgress((p) => {
		if (get(transport).status !== 'playing') return p;
		return Transport.seconds;
	});
	requestAnimationFrame(playInterval);
}

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

export type Track = FinishedTrack | Recording;
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
				switch (track.type) {
					case 'recording':
						$tracks.set(name, track);
						return $tracks;
					case 'track':
						if (!players.has(name)) {
							players.add(name, track.audioBuffer);
							players.player(name).sync().start(track.offset);
						} else if ($tracks.get(name)?.offset !== track.offset) {
							// Resync to register the new offset
							players.player(name).unsync().stop().sync().start(track.offset);
						}
						$tracks.set(name, track);
						return $tracks;
				}
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
	const $transport = get(transport);
	// Hack: trigger silent synth note to force padding
	// on recording start and end
	const triggerSilence = () => synth.triggerAttack('A4', 0, 0);

	if ($transport.status === 'off') {
		recorder.start();
		transport.record();
		triggerSilence();
		recordingStartPosition = $transport.progress;
		recordingName = `Track ${get(tracks).size + 1}`;
		tracks.set(recordingName, {
			type: 'recording',
			offset: recordingStartPosition
		});
		return;
	}

	if ($transport.status !== 'recording') return;

	transport.setStatus('recording-processing');
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
	transport.stop();
};

const play: Action = async () => {
	const $transport = get(transport);
	if ($transport.status === 'off') {
		await loaded();
		transport.start();
	} else if ($transport.status === 'playing') {
		transport.stop();
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
	transport.updateProgress((p) => p + 1);
};

const movePlayheadBackward: Action = () => {
	return transport.updateProgress((p) => {
		const newProgress = p - 1;
		if (newProgress < 0) return 0;
		return newProgress;
	});
};

const movePlayheadToStart: Action = () => {
	transport.setProgress(0);
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
	'^': 'movePlayheadToStart'
});
