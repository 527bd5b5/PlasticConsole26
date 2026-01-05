// BEGIN ADVANCED SETTINGS -----------------------------------------------------

const REVERSE_Y = true; // true: Positive is down, false: Positive is up
const LONG_PRESS_TIME = 15; // frame

// ------------------------------------------------------- END ADVANCED SETTINGS

const seVolumeElement = document.getElementById('volume-se');
const bgmVolumeElement = document.getElementById('volume-bgm');
const startButtonElement = document.getElementById('primary-button-start');
const selectButtonElement = document.getElementById('primary-button-select');
const dPadBodyElement = document.getElementById('d-pad-body');
const actionButtonBodyElement = document.getElementById('action-button-body');
const openDocumentButtonElement = document.getElementById('open-document-button');
const closeDocumentButtonElement = document.getElementById('close-document-button');

function setVolumeEvent(element, changeVolumeFunc) {
    const update = () => {
        const percent = element.value / element.max;

        element.style.background =
            'linear-gradient(to right, ' +
            `var(--volume-control-color-2) ${percent * 100}%, ` +
            `var(--volume-control-color-3) ${percent * 100}%)`;

        changeVolumeFunc(percent);
    };

    element.addEventListener('input', () => update());

    update();
}

const detectKeyList = [
    'KeyP', // Start button
    'KeyO', // Select button
    'KeyW', // D-pad up (left)
    'KeyA', // D-pad left (left)
    'KeyS', // D-pad down (left)
    'KeyD', // D-pad right (left)
    'ArrowUp', // D-pad up (right)
    'ArrowLeft', // D-pad left (right)
    'ArrowDown', // D-pad down (right)
    'ArrowRight', // D-pad right (right)
    'KeyL', // A button (right)
    'KeyK', // B button (right)
    'KeyX', // A button (left)
    'KeyZ' // B button (left)
];

class Button {
    constructor() {
        this.isPressed = false;
        this.onFire = false;
        this.onFireLong = false;
        this.onFireFlag = false;
        this.count = 0;
    }

    update() {
        this.isPressed ? this.count++ : this.count = 0;

        if (this.isPressed !== this.onFireFlag) {
            this.onFire = this.isPressed;
            this.onFireFlag = this.isPressed;
        } else {
            this.onFire = false;
        } // ... or this.onFire = this.count === 1;

        this.onFireLong = this.count === 1 || this.count > LONG_PRESS_TIME;
    }
}

class Stick {
    constructor() {
        this.value = 0;
        this.pulse = 0;
        this.pulseLong = 0;
        this.bufferedValue = 0;
        this.count = 0;
    }

    update() {
        this.value !== 0 ? this.count++ : this.count = 0;

        if (this.value !== this.bufferedValue) {
            this.pulse = this.value;
            this.bufferedValue = this.value;
        } else {
            this.pulse = 0;
        } // ... or this.pulse = this.value * (this.count === 1 ? 1 : 0);

        this.pulseLong = this.value * (this.count === 1 || this.count > LONG_PRESS_TIME ? 1 : 0);
    }
}

let isPressedLeftClick = false;

const startButton = new Button();
const selectButton = new Button();
const dPadX = new Stick();
const dPadY = new Stick();
const actionButtonA = new Button();
const actionButtonB = new Button();

const pressedKeys = {};
const onGoingTouches = [];

function pressStartButton(isPressed) {
    startButtonElement.className = 'primary-button' + (isPressed ? ' pressed' : '');

    startButton.isPressed = isPressed;
}

function pressSelectButton(isPressed) {
    selectButtonElement.className = 'primary-button' + (isPressed ? ' pressed' : '');

    selectButton.isPressed = isPressed;
}

function pressDPad(direction) {
    switch (direction) {
        case 0:
            dPadBodyElement.className = '';

            dPadX.value = 0;
            dPadY.value = 0;
            break;
        case 1:
            dPadBodyElement.className = 'right';

            dPadX.value = 1;
            dPadY.value = 0;
            break;
        case 2:
            dPadBodyElement.className = 'up-right';

            dPadX.value = 1;
            dPadY.value = 1;
            break;
        case 3:
            dPadBodyElement.className = 'up';

            dPadX.value = 0;
            dPadY.value = 1;
            break;
        case 4:
            dPadBodyElement.className = 'up-left';

            dPadX.value = -1;
            dPadY.value = 1;
            break;
        case 5:
            dPadBodyElement.className = 'left';

            dPadX.value = -1;
            dPadY.value = 0;
            break;
        case 6:
            dPadBodyElement.className = 'down-left';

            dPadX.value = -1;
            dPadY.value = -1;
            break;
        case 7:
            dPadBodyElement.className = 'down';

            dPadX.value = 0;
            dPadY.value = -1;
            break;
        case 8:
            dPadBodyElement.className = 'down-right';

            dPadX.value = 1;
            dPadY.value = -1;
            break;
    }

    dPadY.value *= REVERSE_Y ? -1 : 1;

    return direction;
}

function pressActionButton(action) {
    switch (action) {
        case 0:
            actionButtonBodyElement.className = '';

            actionButtonA.isPressed = false;
            actionButtonB.isPressed = false;
            break;
        case 1:
            actionButtonBodyElement.className = 'a';

            actionButtonA.isPressed = true;
            actionButtonB.isPressed = false;
            break;
        case 2:
            actionButtonBodyElement.className = 'b';

            actionButtonA.isPressed = false;
            actionButtonB.isPressed = true;
            break;
        case 3:
            actionButtonBodyElement.className = 'a-b';

            actionButtonA.isPressed = true;
            actionButtonB.isPressed = true;
            break;
    }

    return action;
}

function pointerDownPrimaryButton(pointedElement) {
    switch (pointedElement.id) {
        case 'primary-button-start':
            pressStartButton(true);
            return 1;
        case 'primary-button-select':
            pressSelectButton(true);
            return 2;
        default:
            return 0;
    }
}

function pointerDownDPad(pointedElement) {
    switch (pointedElement.id) {
        case 'd-pad-right':
            return pressDPad(1);
        case 'd-pad-top-right':
            return pressDPad(2);
        case 'd-pad-top':
            return pressDPad(3);
        case 'd-pad-top-left':
            return pressDPad(4);
        case 'd-pad-left':
            return pressDPad(5);
        case 'd-pad-bottom-left':
            return pressDPad(6);
        case 'd-pad-bottom':
            return pressDPad(7);
        case 'd-pad-bottom-right':
            return pressDPad(8);
        default:
            return 0;
    }
}

function pointerDownActionButton(pointedElement) {
    switch (pointedElement.id) {
        case 'action-button-a':
            return pressActionButton(1);
        case 'action-button-b':
            return pressActionButton(2);
        case 'action-button-a-b':
            return pressActionButton(3);
        default:
            return 0;
    }
}

function getPointedElement(event) {
    return document.elementFromPoint(event.clientX, event.clientY);
}

function updateTouchEvent() {
    let pressedPrimaryButton = 0;
    let pressedDPad = 0;
    let pressedActionButton = 0;

    for (const touch of onGoingTouches) {
        const pointedElement = getPointedElement(touch);

        pressedPrimaryButton += pointerDownPrimaryButton(pointedElement);
        pressedDPad += pointerDownDPad(pointedElement);
        pressedActionButton += pointerDownActionButton(pointedElement);
    }

    if (!(pressedPrimaryButton & 0b01))
        pressStartButton(false);

    if (!(pressedPrimaryButton & 0b10))
        pressSelectButton(false);

    if (pressedDPad === 0)
        pressDPad(0);

    if (pressedActionButton === 0)
        pressActionButton(0);
}

if (window.ontouchstart !== undefined && navigator.maxTouchPoints > 0) {
    const copyTouch = (touch) => ({
        identifier: touch.identifier,
        clientX: touch.clientX,
        clientY: touch.clientY
    });

    const getOnGoingTouchIndex =
        (touch) => onGoingTouches.findIndex((v) => v.identifier === touch.identifier);

    document.addEventListener('touchstart', (event) => {
        const touches = event.changedTouches;

        for (let i = 0; i < touches.length; i++)
            onGoingTouches.push(touches[i]);

        updateTouchEvent();
    });

    document.addEventListener('touchend', (event) => {
        const touches = event.changedTouches;

        for (let i = 0; i < touches.length; i++) {
            const touchIndex = getOnGoingTouchIndex(touches[i]);

            if (touchIndex >= 0)
                onGoingTouches.splice(touchIndex, 1);
        }

        updateTouchEvent();
    });

    document.addEventListener('touchmove', (event) => {
        const touches = event.changedTouches;

        for (let i = 0; i < touches.length; i++) {
            const touchIndex = getOnGoingTouchIndex(touches[i]);

            if (touchIndex >= 0)
                onGoingTouches[touchIndex] = copyTouch(touches[i]);
        }

        updateTouchEvent();
    });

    document.addEventListener('touchcancel', (event) => {
        const touches = event.changedTouches;

        for (let i = 0; i < touches.length; i++) {
            const touchIndex = getOnGoingTouchIndex(touches[i]);

            if (touchIndex >= 0)
                onGoingTouches.splice(touchIndex, 1);
        }

        updateTouchEvent();
    });
} else {
    document.addEventListener('mousedown', (event) => {
        const pointedElement = getPointedElement(event);

        pointerDownPrimaryButton(pointedElement);
        pointerDownDPad(pointedElement);
        pointerDownActionButton(pointedElement);

        isPressedLeftClick = true;
    });

    document.addEventListener('mouseup', (event) => {
        pressStartButton(false);
        pressSelectButton(false);
        pressDPad(0);
        pressActionButton(0);

        isPressedLeftClick = false;
    });

    document.addEventListener('mousemove', (event) => {
        const pointedElement = getPointedElement(event);

        if (isPressedLeftClick) {
            pressStartButton(pointedElement.id === 'primary-button-start');
            pressSelectButton(pointedElement.id === 'primary-button-select');

            if (pointerDownDPad(pointedElement) === 0)
                pressDPad(0);

            if (pointerDownActionButton(pointedElement) === 0)
                pressActionButton(0);
        }
    });
}

function pressedKeyEvent() {
    const commandList = [];

    const addCommandList = (command) => !commandList.includes(command) && commandList.push(command);

    for (const key in pressedKeys) {
        if (!pressedKeys[key])
            continue;

        switch (key) {
            case 'KeyP':
                addCommandList(1);
                break;
            case 'KeyO':
                addCommandList(2);
                break;
            case 'KeyW':
            case 'ArrowUp':
                addCommandList(3);
                break;
            case 'KeyA':
            case 'ArrowLeft':
                addCommandList(4);
                break;
            case 'KeyS':
            case 'ArrowDown':
                addCommandList(5);
                break;
            case 'KeyD':
            case 'ArrowRight':
                addCommandList(6);
                break;
            case 'KeyL':
            case 'KeyX':
                addCommandList(7);
                break;
            case 'KeyK':
            case 'KeyZ':
                addCommandList(8);
                break;
        }
    }

    pressStartButton(commandList.includes(1));
    pressSelectButton(commandList.includes(2));

    let tiltDPadX = (commandList.includes(6) ? 1 : 0) - (commandList.includes(4) ? 1 : 0);
    let tiltDPadY = (commandList.includes(3) ? 1 : 0) - (commandList.includes(5) ? 1 : 0);

    switch (tiltDPadY) {
        case 1:
            switch (tiltDPadX) {
                case 1:
                    pressDPad(2);
                    break;
                case -1:
                    pressDPad(4);
                    break;
                case 0:
                    pressDPad(3);
                    break;
            }
            break;
        case -1:
            switch (tiltDPadX) {
                case 1:
                    pressDPad(8);
                    break;
                case -1:
                    pressDPad(6);
                    break;
                case 0:
                    pressDPad(7);
                    break;
            }
            break;
        case 0:
            switch (tiltDPadX) {
                case 1:
                    pressDPad(1);
                    break;
                case -1:
                    pressDPad(5);
                    break;
                case 0:
                    pressDPad(0);
                    break;
            }
            break;
    }

    pressActionButton((commandList.includes(7) ? 1 : 0) + (commandList.includes(8) ? 2 : 0));
}

document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyI') {
        (documentWrapperElement.classList.contains('hide')
            ? openDocumentButtonElement
            : closeDocumentButtonElement
        ).click();
    } else if (detectKeyList.includes(event.code) && !event.repeat) {
        pressedKeys[event.code] = true;

        pressedKeyEvent();
    }
});

document.addEventListener('keyup', (event) => {
    if (detectKeyList.includes(event.code)) {
        pressedKeys[event.code] = false;

        pressedKeyEvent();
    }
});
