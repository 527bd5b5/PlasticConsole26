const directionAndTiltDict = [
    { d: 0, x: 1, y: 0 },
    { d: 1, x: 1, y: -1 },
    { d: 2, x: 0, y: -1 },
    { d: 3, x: -1, y: -1 },
    { d: 4, x: -1, y: 0 },
    { d: 5, x: -1, y: 1 },
    { d: 6, x: 0, y: 1 },
    { d: 7, x: 1, y: 1 }
];

function sleep(waitingTime) {
    return new Promise((resolve) => setTimeout(resolve, waitingTime));
}

class PlayerChar {
    constructor(sprites, option = null) {
        this.spritesOrigin = sprites; // [<right>, <back>, <left>, <front>]
        this.posX = option?.posX || 0; // tile
        this.posY = option?.posY || 0; // tile
        this.sizeX = option?.sizeX || 1; // tile
        this.sizeY = option?.sizeY || 1; // tile
        this.spriteIndex = option?.spriteIndex || 0;
        this.frameLength = option?.frameLength || 1;
        this.frameCycle = option?.frameCycle || 1;
        this.moveSound = option?.moveSound || null;
        this.collideSound = option?.collideSound || null;
        this.changeSound = option?.changeSound || null;

        this.sprites = null;
        this.mode = 0;
        this.frameCount = this.maxCount;
        this.direction = 0;
    }

    get sprite() {
        return this.sprites[this.mode][this.spriteIndex];
    }

    get maxCount() {
        return this.spritesOrigin.length * this.frameLength * this.frameCycle;
    }

    get isMoving() {
        return this.frameCount < this.maxCount;
    }

    get bound() {
        return {
            startX: this.posX,
            startY: this.posY,
            endX: this.posX + this.sizeX,
            endY: this.posY + this.sizeY
        };
    }

    async load() {
        await Promise.all(this.spritesOrigin.map((sprite) => sprite.load()));

        const createColoredSprites = (color) => this.spritesOrigin.map(
            (sprite) => new Sprite(
                sprite.imageList.map(
                    (image) => createColoredImage(image, color, 'screen')
                )
            )
        );

        this.sprites = [
            this.spritesOrigin,
            createColoredSprites('blue'),
            createColoredSprites('red'),
            createColoredSprites('green')
        ];

        if (this.moveSound !== null)
            await this.moveSound.load();

        if (this.collideSound !== null)
            await this.collideSound.load();

        if (this.changeSound !== null)
            await this.changeSound.load();
    }

    update(canControl, canMove) {
        if (this.isMoving) {
            this.frameCount++;
        } else if (canControl() && (dPadX.value !== 0 || dPadY.value !== 0)) {
            const directionAndTilt = directionAndTiltDict.find(
                (v) => v.x === dPadX.value && v.y === dPadY.value
            );

            if (canMove(directionAndTilt)) {
                this.frameCount = 0;
                this.posX += dPadX.value;
                this.posY += dPadY.value;

                if (this.moveSound !== null)
                    this.moveSound.play();
            } else {
                this.frameCount = this.maxCount;

                if (this.collideSound !== null && (dPadX.pulse !== 0 || dPadY.pulse !== 0))
                    this.collideSound.play();
            }

            this.direction = directionAndTilt.d;

            if (this.direction % 2 === 0) {
                this.spriteIndex = Math.floor(this.direction / 2);
            } else {
                this.spriteIndex = directionAndTilt.y > 0 ? 3 : 1;
            }
        }

        const bufferedMode = (actionButtonA.isPressed ? 1 : 0) + (actionButtonB.isPressed ? 2 : 0);

        if (this.mode !== bufferedMode) {
            this.mode = bufferedMode;

            this.changeSound.play();
        }

        const tick = Math.floor(this.frameCount / this.frameLength);
        const offset = TILE - Math.floor(TILE * tick / (this.sprite.length * this.frameCycle));
        const shift = directionAndTiltDict.find((v) => v.d === this.direction);

        this.sprite.draw(
            this.posX * TILE + shift.x * offset * -1,
            this.posY * TILE + shift.y * offset * -1,
            tick % this.sprite.length
        );
    }
}

class JukeBox {
    static Style = Object.freeze({
        NORMAL: 0,
        CONTINUOUS: 1,
        LOOP_ONE: 2,
        LOOP_ALL: 3
    });

    constructor(musicPathList, style, volume = 1, fadeTime = 0, crossFade = false) {
        this.audioList = musicPathList.map((musicPath) => new BackgroundMusic(musicPath));
        this.style = style;
        this.volume = volume;
        this.fadeTime = fadeTime;
        this.crossFade = crossFade;

        this.currentIndex = -1;
    }

    get currentAudio() {
        return this.currentIndex >= 0 ? this.audioList[this.currentIndex] : null;
    }

    get nextIndex() {
        return this.currentIndex < this.audioList.length - 1
            ? this.currentIndex + 1
            : this.style === JukeBox.Style.LOOP_ALL ? 0 : -1;
    }

    get prevIndex() {
        return this.currentIndex > 0
            ? this.currentIndex - 1
            : this.style === JukeBox.Style.LOOP_ALL ? audioList.length - 1 : -1;
    }

    async load() {
        await Promise.all(this.audioList.map((audio) => audio.load()));
    }

    play(index = 0) {
        const start = () => {
            this.audioList[index].play(
                this.volume,
                this.fadeTime,
                this.style === JukeBox.Style.LOOP_ONE,
                this.style === JukeBox.Style.CONTINUOUS || this.style === JukeBox.Style.LOOP_ALL
                    ? () => this.next()
                    : () => { this.currentIndex = -1; }
            );

            this.currentIndex = index;
        };

        if (this.currentIndex < 0) {
            start();
        } else if (this.crossFade) {
            this.currentAudio.stop(this.fadeTime);

            start();
        } else {
            this.currentAudio.stop(this.fadeTime, start);
        }
    }

    next() {
        if (this.nextIndex >= 0) {
            this.play(this.nextIndex);
        } else {
            this.stop();
        }
    }

    prev() {
        if (this.prevIndex >= 0) {
            this.play(this.prevIndex);
        } else {
            this.stop();
        }
    }

    pause() {
        this.currentAudio?.pause(this.fadeTime);
    }

    resume() {
        this.currentAudio?.resume(this.fadeTime);
    }

    stop() {
        this.currentAudio?.stop(this.fadeTime, () => { this.currentIndex = -1; });
    }

    toggle() {
        (this.currentAudio || this.audioList[0]).toggle(
            this.fadeTime,
            { volume: this.volume, loop: this.style === JukeBox.Style.LOOP_ONE }
        );
    }
}
