// BEGIN ADVANCED SETTINGS -----------------------------------------------------

const TITLE = APP_TITLE = "PC-26: Plastic Console 26";
const VERSION = APP_VERSION = "1.0.0";

const SHOW_ERROR_MESSAGE = true;

const waitingTimeCycle = [33, 33, 34]; // * 10 = 1,000 millisecond => 30 Hz

// ------------------------------------------------------- END ADVANCED SETTINGS

const rootPath = location.href.match(/^(.*[\/\\])/)[1];

let waitingTimeCycleIndex = 0;

function setSystemLabel(text, overwrite = false) {
    if (!overwrite)
        fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, '#000');

    fillText(text, 0, 0, '#000', {
        sizeX: CANVAS_WIDTH,
        sizeY: CANVAS_HEIGHT,
        textAlign: TextAlign.CENTER,
        verticalAlign: VerticalAlign.CENTER,
        backgroundColor: '#fff'
    });
}

function prepareAudioContext() {
    fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, '#000');

    fillText('PRESS START BUTTON (OR P KEY)', 0, TILE_SIZE * -1, '#000', {
        sizeX: CANVAS_WIDTH,
        sizeY: CANVAS_HEIGHT,
        textAlign: TextAlign.CENTER,
        verticalAlign: VerticalAlign.CENTER,
        backgroundColor: '#fff'
    });

    fillText('VOLUME WARNING', 0, TILE_SIZE, '#000', {
        sizeX: CANVAS_WIDTH,
        sizeY: CANVAS_HEIGHT,
        textAlign: TextAlign.CENTER,
        verticalAlign: VerticalAlign.CENTER,
        backgroundColor: '#ff0'
    });

    return new Promise((resolve, reject) => {
        let prepareByButton;
        let prepareByKey;

        prepareByButton = () => {
            soundEffectAudioContext.prepare();
            backgroundMusicAudioContext.prepare();

            startButtonElement.removeEventListener('click', prepareByButton);
            document.removeEventListener('keydown', prepareByKey);

            resolve();
        };

        prepareByKey = (event) => {
            if (event.code !== 'KeyP' || event.repeat)
                return;

            soundEffectAudioContext.prepare();
            backgroundMusicAudioContext.prepare();

            startButtonElement.removeEventListener('click', prepareByButton);
            document.removeEventListener('keydown', prepareByKey);

            resolve();
        };

        startButtonElement.addEventListener('click', prepareByButton);
        document.addEventListener('keydown', prepareByKey);
    });
}

async function gameWrapper(func) {
    if (SHOW_ERROR_MESSAGE) {
        try {
            await func();
        } catch (error) {
            soundEffectAudioContext.clear();
            backgroundMusicAudioContext.clear();

            console.error(error);

            const message = typeof error !== 'string'
                ? `${error.name}: ${error.message}\n${error.stack.replaceAll(rootPath, '')}`
                : error;

            fillText(message, 0, 0, '#f00', { sizeX: WIDTH, backgroundColor: '#000' });

            return false;
        }
    } else {
        await func();
    }

    return true;
}

async function runCycle(prop) {
    startRefTime = new Date().getTime();

    startButton.update();
    selectButton.update();
    dPadX.update();
    dPadY.update();
    actionButtonA.update();
    actionButtonB.update();

    fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, '#000');

    if (!await gameWrapper(() => updateGame(prop)))
        prop.killCycle = true;

    endRefTime = new Date().getTime();

    const calcDiffTime = endRefTime - startRefTime;

    let waitingTime = waitingTimeCycle[waitingTimeCycleIndex++];
    let interval = waitingTime - calcDiffTime;

    if (interval < 0) {
        waitingTime -= interval;
        interval = 0;
    }

    if (waitingTimeCycleIndex === waitingTimeCycle.length)
        waitingTimeCycleIndex = 0;

    prop.waitingTime = waitingTime;
    prop.interval = interval;

    if (!prop.killCycle)
        setTimeout(runCycle, interval, prop);
}

function drawLoadingAnimation() {
    const textList = [
        'LOADING   ',
        'LOADING.  ',
        'LOADING.. ',
        'LOADING...',
        'LOADING ..',
        'LOADING  .'
    ];

    let index = 0;

    const animation =
        (overwrite) => setSystemLabel(textList[index++ % textList.length], overwrite);

    animation(false);

    return setInterval(() => animation(true), 250);
}

Promise.all(fontList.map((font) => asyncLoadFont(font.name, font.path))).then(async () => {
    const loadingAnimation = drawLoadingAnimation();

    if (!await gameWrapper(awakeGame)) {
        clearInterval(loadingAnimation);

        setSystemLabel('LOADING FAILED', true);

        return;
    } else {
        clearInterval(loadingAnimation);
    }

    await prepareAudioContext();

    fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, '#000');

    if (!await gameWrapper(startGame))
        return;

    runCycle({
        waitingTime: 0,
        interval: 0,
        killCycle: false
    });
});
