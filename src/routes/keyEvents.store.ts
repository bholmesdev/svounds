import { get, writable } from 'svelte/store';
import { Recorder, Synth, loaded, Players, Player, Transport } from 'tone';
import type { MaybePromise } from '@sveltejs/kit';
import { beatsToSeconds, fileReaderLoadEnd } from '../utils';

export type PlaybackStatus = 'off' | 'recording' | 'recording-processing' | 'playing';

const recorder = new Recorder();
const synth = new Synth();

type TransportStore = {
	status: PlaybackStatus;
	seconds: number;
	beats: number;
};

function createTransportStore() {
	const store = writable<TransportStore>({
		status: 'off',
		seconds: 0,
		beats: 0
	});

	function setStatus(status: PlaybackStatus) {
		store.update((s) => ({ ...s, status }));
	}
	return {
		subscribe: store.subscribe,
		setStatus,
		setBpm(bpm: number) {
			Transport.bpm.value = bpm;
			store.update((s) => ({ ...s, beats: (s.seconds * bpm) / 60 }));
		},
		setTime(seconds: number) {
			const beats = (seconds * Transport.bpm.value) / 60;
			store.update((s) => ({ ...s, seconds, beats }));
		},
		updateTime(callback: (seconds: number) => number) {
			store.update((s) => {
				const seconds = callback(s.seconds);
				const beats = (seconds * Transport.bpm.value) / 60;
				return { ...s, seconds, beats };
			});
		},
		start() {
			Transport.start(undefined, get(store).seconds);
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
	transport.updateTime((progress) => {
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
	transport.updateTime((p) => {
		if (get(transport).status !== 'playing') return p;
		return Transport.seconds;
	});
	requestAnimationFrame(playInterval);
}

type FinishedTrack = {
	type: 'track';
	offset: number;
	durationSeconds: number;
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
							players.player(name).sync().start(beatsToSeconds(track.offset, Transport.bpm.value));
						} else if ($tracks.get(name)?.offset !== track.offset) {
							// Resync to register the new offset
							players
								.player(name)
								.unsync()
								.stop()
								.sync()
								.start(beatsToSeconds(track.offset, Transport.bpm.value));
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

let recordingStartBeats = 0;
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
		// TODO: disable bpm setting during recording
		recordingStartBeats = $transport.beats;
		recordingName = `Track ${get(tracks).size + 1}`;
		tracks.set(recordingName, {
			type: 'recording',
			offset: recordingStartBeats
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
		offset: recordingStartBeats,
		durationSeconds: duration
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
	transport.updateTime((p) => p + 1);
};

const movePlayheadBackward: Action = () => {
	return transport.updateTime((p) => {
		const newProgress = p - 1;
		if (newProgress < 0) return 0;
		return newProgress;
	});
};

const movePlayheadToStart: Action = () => {
	transport.setTime(0);
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
