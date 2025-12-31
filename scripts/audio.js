// BEGIN ADVANCED SETTINGS -----------------------------------------------------

const SE_TRACK_NUM = 4;
const BGM_TRACK_NUM = 2;
const DEFAULT_SE_VOLUME = 80; // percent
const DEFAULT_BGM_VOLUME = 50; // percent

// ------------------------------------------------------- END ADVANCED SETTINGS

const AudioContext = getAudioContext();

function getAudioContext() {
    return new window.AudioContext() || new window.webkitAudioContext();
}

class AudioContextManager {
    constructor(stackNum) {
        this.stack = [];

        for (let i = 0; i < stackNum; i++)
            this.stack.push({
                user: null,
                context: getAudioContext(),
                updateAt: 0,
                onRelease: null,
                onChangeVolume: null
            });
    }

    prepare() {
        for (const item of this.stack)
            if (item.context.state === 'suspended')
                item.context.resume();
    }

    allocate(setFunc, releaseFunc, changeVolumeFunc, force = false) {
        let target = this.stack.find((item) => item.user === null);

        if (!target) {
            if (force) {
                this.stack.sort((a, b) => a.updateAt - b.updateAt);

                target = this.stack[0];

                if (target.onRelease !== null)
                    target.onRelease();
            } else {
                return null;
            }
        }

        target.user = setFunc(target.context);
        target.onRelease = releaseFunc;
        target.onChangeVolume = changeVolumeFunc;
        target.updateAt = new Date().getTime();

        return target.context;
    }

    release(user) {
        const target = this.stack.find((item) => item.user === user);

        if (!target)
            return;

        if (target.onRelease !== null)
            target.onRelease();

        target.user = null;
        target.onRelease = null;
        target.onChangeVolume = null;

        target.context.resume();
    }

    clear() {
        for (const item of this.stack)
            this.release(item.user);
    }

    changeVolume(percent) {
        for (const item of this.stack) {
            if (item.onChangeVolume !== null)
                item.onChangeVolume(percent);
        }
    }
}

class Audio {
    constructor(audioPath) {
        this.audioPath = audioPath;
        this.audioData = null;
    }

    async load() {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();

            request.open('GET', this.audioPath, true);

            request.responseType = 'arraybuffer';
            request.timeout = MAX_LOAD_TIME;

            request.onload = () => AudioContext.decodeAudioData(
                request.response,
                (audioData) => {
                    this.audioData = audioData;

                    resolve();
                },
                () => reject(`Failed to decode audio file "${this.audioPath}".`)
            );

            request.onerror =
                () => reject(`Failed to load audio file "${this.audioPath}".`);
            request.onabort =
                () => reject(`Failed to load audio file "${this.audioPath}" (interrupt).`);
            request.ontimeout =
                () => reject(`Failed to load audio file "${this.audioPath}" (timeout).`);

            request.send();
        });
    }
}

const soundEffectAudioContext = new AudioContextManager(SE_TRACK_NUM);
const backgroundMusicAudioContext = new AudioContextManager(BGM_TRACK_NUM);

seVolumeElement.value = DEFAULT_SE_VOLUME;
bgmVolumeElement.value = DEFAULT_BGM_VOLUME;

setVolumeEvent(seVolumeElement, (percent) => soundEffectAudioContext.changeVolume(percent));
setVolumeEvent(bgmVolumeElement, (percent) => backgroundMusicAudioContext.changeVolume(percent));

class SoundEffect extends Audio {
    play(volume = 1) {
        let bufferSource;
        let gain;

        const audioContext = soundEffectAudioContext.allocate(
            (context) => {
                bufferSource = context.createBufferSource();
                gain = context.createGain();

                return bufferSource;
            },
            () => {
                bufferSource.stop();

                return bufferSource;
            },
            (percent) => { gain.gain.value = volume * percent; },
            true
        );

        if (!audioContext)
            return;

        bufferSource.connect(gain);
        gain.connect(audioContext.destination);

        bufferSource.buffer = this.audioData;
        gain.gain.value = volume * (seVolumeElement.value / 100);

        bufferSource.onended = () => soundEffectAudioContext.release(bufferSource);

        bufferSource.start(0);
    }
}

class BackgroundMusic extends Audio {
    static State = Object.freeze({
        READY: 0,
        PLAY: 1,
        PAUSE: 2,
        STOP: 3
    });

    constructor(audioPath) {
        super(audioPath);

        this.audioContext = null;
        this.bufferSource = null;
        this.gain = null;
        this.volume = 0;
        this.state = BackgroundMusic.State.READY;
    }

    setFade(fadeTime, startVolume = -1, endVolume = -1, func = null) {
        const currentTime = this.audioContext.currentTime;
        const currentVolume = this.gain.gain.value;
        const percent = bgmVolumeElement.value / 100;

        startVolume = startVolume < 0 ? currentVolume : startVolume * percent;
        endVolume = endVolume < 0 ? currentVolume : endVolume * percent;

        if (fadeTime > 0) {
            this.gain.gain.linearRampToValueAtTime(startVolume, currentTime);
            this.gain.gain.linearRampToValueAtTime(endVolume, currentTime + fadeTime);

            if (func !== null)
                setTimeout(func, fadeTime * 1000);
        } else {
            this.gain.gain.value = endVolume;

            if (func !== null)
                func();
        }
    }

    changeVolume(volume, transition = 0) {
        if (volume >= 0)
            this.volume = volume;

        if (transition > 0) {
            this.setFade(transition, -1, this.volume);
        } else {
            this.gain.gain.value = this.volume * (bgmVolumeElement.value / 100);
        }
    }

    play(volume = 1, fadeInTime = 0, loop = false, onEnded = null) {
        this.volume = volume;

        this.audioContext = backgroundMusicAudioContext.allocate(
            (context) => {
                this.bufferSource = context.createBufferSource();
                this.gain = context.createGain();

                return this.bufferSource;
            },
            () => {
                this.bufferSource.onended = null;

                this.bufferSource.stop();

                return this.bufferSource;
            },
            (_) => this.changeVolume(-1, 0.25),
            true
        );

        this.bufferSource.connect(this.gain);
        this.gain.connect(this.audioContext.destination);

        this.bufferSource.buffer = this.audioData;
        this.gain.gain.value = 0;

        if (loop) {
            this.bufferSource.loop = true;
        } else {
            this.bufferSource.onended = () => {
                backgroundMusicAudioContext.release(this.bufferSource);

                if (onEnded !== null)
                    onEnded();
            };
        }

        this.changeVolume(volume, fadeInTime);

        this.bufferSource.start(0);

        this.state = BackgroundMusic.State.PLAY;
    }

    pause(fadeOutTime = 0) {
        if (this.audioContext === null)
            return;

        const suspend = () => {
            this.audioContext.suspend();

            this.state = BackgroundMusic.State.PAUSE;
        };

        if (fadeOutTime > 0) {
            this.setFade(fadeOutTime, -1, 0, suspend);
        } else {
            suspend();
        }
    }

    resume(fadeInTime = 0) {
        if (this.audioContext === null)
            return;

        if (fadeInTime > 0)
            this.setFade(fadeInTime, 0, this.volume);

        this.audioContext.resume();

        this.state = BackgroundMusic.State.PLAY;
    }

    stop(fadeOutTime = 0, onEnded = null) {
        if (this.audioContext === null)
            return;

        this.bufferSource.onended = null;

        const release = () => {
            backgroundMusicAudioContext.release(this.bufferSource);

            this.state = BackgroundMusic.State.STOP;

            if (onEnded !== null)
                onEnded();
        };

        if (fadeOutTime > 0) {
            this.setFade(fadeOutTime, -1, 0, release);
        } else {
            release();
        }
    }

    toggle(fadeTime = 0, playArgs = null) {
        switch (this.state) {
            case BackgroundMusic.State.PLAY:
                this.pause(fadeTime);
                break;
            case BackgroundMusic.State.PAUSE:
                this.resume(fadeTime);
                break;
            case BackgroundMusic.State.STOP:
            case BackgroundMusic.State.READY: {
                const volume = playArgs?.volume || 1;
                const loop = playArgs?.loop || false;
                const onEnded = playArgs?.onEnded || null;

                this.play(volume, fadeTime, loop, onEnded);
                break;
            }
        }
    }
}
