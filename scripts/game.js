let frame;
let playerChar;
let jukeBox;

async function awakeGame() {
    // Sample:

    frame = 0;

    const playerCharSpriteOption = [32, 32, 0, 255, 0];

    playerChar = new PlayerChar([
            new Sprite([
            'images/char/right-1.png',
            'images/char/right-2.png',
            'images/char/right-1.png',
            'images/char/right-3.png'
        ], ...playerCharSpriteOption),
            new Sprite([
            'images/char/back-1.png',
            'images/char/back-2.png',
            'images/char/back-1.png',
            'images/char/back-3.png'
        ], ...playerCharSpriteOption),
            new Sprite([
            'images/char/left-1.png',
            'images/char/left-2.png',
            'images/char/left-1.png',
            'images/char/left-3.png'
        ], ...playerCharSpriteOption),
            new Sprite([
            'images/char/front-1.png',
            'images/char/front-2.png',
            'images/char/front-1.png',
            'images/char/front-3.png'
        ], ...playerCharSpriteOption)
    ], {
        posX: 1,
        posY: 5,
        sizeX: 2,
        sizeY: 2,
        spriteIndex: 3,
        moveSound: new SoundEffect('sounds/se/move.mp3'),
        collideSound: new SoundEffect('sounds/se/collide.mp3'),
        changeSound: new SoundEffect('sounds/se/change.mp3')
    });

    await playerChar.load();

    jukeBox = new JukeBox([
        'sounds/bgm/resort-1.mp3',
        'sounds/bgm/resort-2.mp3',
        'sounds/bgm/resort-3.mp3'
    ], JukeBox.Style.LOOP_ALL, 1, 1, true);

    await jukeBox.load();
}

async function startGame() {
    // Sample:

    await sleep(500);

    jukeBox.play();
}

async function updateGame(prop) {
    // Sample:

    fillRect(
        TILE, // Position X
        TILE, // Position Y
        WIDTH - TILE * 2, // Width
        HEIGHT - TILE * 2, // Height
        `hsl(${frame++ % 360}, 50%, 50%)`, // Fill color
        2, // Stroke width
        StrokeOffset.OUT, // Stroke offset ("OUT", "MIDDLE" or "IN")
        'white' // Stroke color
    );

    const pressedButtonList = [];

    const setPressedButtonList = (button, label) => {
        if (button.isPressed)
            pressedButtonList.push(`${label} (${button.onFire ? '1' : '0'}): ${button.count}`);
    };

    setPressedButtonList(startButton, 'Start');
    setPressedButtonList(selectButton, 'Select');
    setPressedButtonList(actionButtonA, 'A');
    setPressedButtonList(actionButtonB, 'B');

    fillText(
        `Waiting time: ${prop.waitingTime} ms ` +
        `(${(1000 / prop.waitingTime).toFixed(2)} fps)\n` +
        `Pressed button(s): ${pressedButtonList.length > 0 ? pressedButtonList.join(', ') : 'None'}\n` +
        `Tilt X: ${dPadX.value} (${dPadX.pulse}): ${dPadX.count}\n` +
        `Tilt Y: ${dPadY.value} (${dPadY.pulse}): ${dPadY.count}`, // Text (multiline)
        TILE, // Position X
        TILE, // Position Y
        'white', // Text color
        { sizeX: WIDTH - TILE * 2 } // Option
    );

    fillText(`${TITLE} (Ver. ${VERSION})`, TILE, TILE, 'black', {
        sizeX: WIDTH - TILE * 2, // Text box width
        sizeY: HEIGHT - TILE * 2, // Text box height
        textAlign: TextAlign.RIGHT, // Text align ("LEFT", "CENTER" or "RIGHT")
        verticalAlign: VerticalAlign.BOTTOM, // Vertical align ("TOP", "CENTER" or "BOTTOM")
        backgroundColor: 'white' // Text background color
    });

    playerChar.update(() => true, (tilt) => {
        const bound = playerChar.bound;

        return !(
            bound.startX === 0 && tilt.x < 0 ||
            bound.startY === 0 && tilt.y < 0 ||
            bound.endX === WIDTH / TILE && tilt.x > 0 ||
            bound.endY === HEIGHT / TILE && tilt.y > 0
        );
    });

    if (startButton.onFire)
        jukeBox.toggle();

    if (selectButton.onFire)
        jukeBox.next();
}
