// BEGIN ADVANCED SETTINGS -----------------------------------------------------

const WIDTH = CANVAS_WIDTH = 512; // px
const HEIGHT = CANVAS_HEIGHT = 384; // px
const TILE = TILE_SIZE = 16; // px
const ADJUST_TEXT_BASELINE = 2; // px
const MAX_LOAD_TIME = 5000; // millisecond
const IMAGE_SMOOTHING = false;

const fontList = [
    {
        name: 'ufo',
        path: 'fonts/ufo-subset.ttf'
    }
];

// ------------------------------------------------------- END ADVANCED SETTINGS

const StrokeOffset = Object.freeze({
    OUT: 0,
    MIDDLE: 1,
    IN: 2
});

const TextAlign = Object.freeze({
    LEFT: 0,
    CENTER: 1,
    RIGHT: 2
});

const VerticalAlign = Object.freeze({
    TOP: 0,
    CENTER: 1,
    BOTTOM: 2
});

const displayElement = document.getElementById('display');
const canvas = displayElement.getContext('2d');

displayElement.width = CANVAS_WIDTH;
displayElement.height = CANVAS_HEIGHT;
displayElement.style.aspectRatio = `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`;
canvas.imageSmoothingEnabled = IMAGE_SMOOTHING;

class Sprite {
    constructor(imageList, width = 0, height = 0, r = -1, g = -1, b = -1) {
        if (typeof imageList[0] === 'string') {
            this.imagePathList = imageList;
            this.imageList = null;
        } else {
            this.imagePathList = null;
            this.imageList = imageList;
        }

        this.length = imageList.length;
        this.width = width;
        this.height = height;
        this.chromakey = b >= 0 ? [r, g, b] : null;
    }

    async load() {
        this.imageList = await Promise.all(
            this.imagePathList.map((imagePath) => new Promise((resolve, reject) => {
                createImage(imagePath)
                    .then((image) => {
                        if (this.chromakey !== null) {
                            try {
                                resolve(createChromakeydImage(image, ...this.chromakey));
                            } catch {
                                reject(
'If you are running this website locally, you may encounter errors due to security features.\n' +
'This issue can be resolved by following the steps below:\n\n' +

'For Firefox:\n' +
'Type "about:config" into the address bar and set "security.fileuri.strict_origin_policy" to "false".\n\n' +

'For Google Chrome:\n' +
'Add "--allow-file-access-from-files" to the launch arguments.'
                                );
                            }
                        } else {
                            resolve(image);
                        }
                    })
                    .catch((error) => reject(error));
            }))
        );
    }

    draw(posX, posY, index) {
        const image = this.imageList[index];
        const width = this.width > 0 ? this.width : image.width;
        const height = this.height > 0 ? this.height : image.height;

        drawImage(image, posX, posY, width, height);
    }
}

async function asyncLoadFont(fontName, fontPath) {
    const fontFace = new FontFace(fontName, `url('${fontPath}')`);

    return new Promise((resolve, reject) => {
        fontFace.load()
            .then(() => {
                document.fonts.add(fontFace);

                resolve();
            })
            .catch(() => reject(`Failed to load font file "${fontPath}".`));
    });
}

function fillRect(posX, posY, sizeX, sizeY, color, width = 0, offset = 1, strokeColor = null) {
    canvas.beginPath();

    canvas.fillStyle = color;

    if (width !== 0) {
        const half = width / 2;

        switch (offset) {
            case StrokeOffset.OUT:
                canvas.rect(posX - half, posY - half, sizeX + width, sizeY + width);
                break;
            case StrokeOffset.MIDDLE:
                canvas.rect(posX, posY, sizeX, sizeY);
                break;
            case StrokeOffset.IN:
                canvas.rect(posX + half, posY + half, sizeX - width, sizeY - width);
                break;
        }
    } else {
        canvas.rect(posX, posY, sizeX, sizeY);
    }

    canvas.fill();

    if (width !== 0) {
        canvas.strokeStyle = strokeColor || color;
        canvas.lineWidth = Math.abs(width);

        canvas.stroke();
    }

    canvas.closePath();
}

function fillText(text, posX, posY, color = '#fff', option = null) {
    const sizeX = option?.sizeX || 0;
    const sizeY = option?.sizeY || 0;
    const lineGap = option?.lineGap || 0;
    const fontSize = option?.fontSize || TILE_SIZE;
    const fontName = option?.fontName || fontList[0].name;
    const backgroundColor = option?.backgroundColor || null;

    let textAlign;

    switch (option?.textAlign || TextAlign.LEFT) {
        case TextAlign.LEFT:
            textAlign = 0.0;
            break;
        case TextAlign.CENTER:
            textAlign = 0.5;
            break;
        case TextAlign.RIGHT:
            textAlign = 1.0;
            break;
    }

    let verticalAlign;

    switch (option?.verticalAlign || VerticalAlign.TOP) {
        case VerticalAlign.TOP:
            verticalAlign = 0.0;
            break;
        case VerticalAlign.CENTER:
            verticalAlign = 0.5;
            break;
        case VerticalAlign.BOTTOM:
            verticalAlign = 1.0;
            break;
    }

    const bufferedTextList = [];

    let bufferedText = '';
    let bufferedPosY = 0;

    canvas.font = `${fontSize}px ${fontName}`;

    for (const char of text.split('')) {
        if (char === '\n' || sizeX > 0 && canvas.measureText(bufferedText + char).width > sizeX) {
            bufferedTextList.push(bufferedText);

            bufferedText = '';
            bufferedPosY += fontSize + lineGap;

            if (sizeY > 0 && bufferedPosY + fontSize > sizeY)
                break;
        }

        if (char !== '\n')
            bufferedText += char;
    }

    if (bufferedText.length > 0)
        bufferedTextList.push(bufferedText);

    const boxHeight = bufferedTextList.length * (fontSize + lineGap) - lineGap;

    for (const text of bufferedTextList) {
        const textWidth = canvas.measureText(text).width;
        const x = posX + Math.floor(sizeX > 0 ? (sizeX - textWidth) * textAlign : 0);
        const y = posY + Math.floor(sizeY > 0 ? (sizeY - boxHeight) * verticalAlign : 0);

        if (backgroundColor !== null)
            fillRect(x, y, textWidth, fontSize, backgroundColor);

        canvas.beginPath();

        canvas.fillStyle = color;
        canvas.fillText(text, x, y + fontSize - ADJUST_TEXT_BASELINE);

        canvas.closePath();

        posY += fontSize + lineGap;
    }
}

async function createImage(imagePath) {
    const image = new Image();

    image.src = imagePath;

    return new Promise((resolve, reject) => {
        image.decode()
            .then(() => resolve(image))
            .catch(() => reject(`Failed to load image file "${imagePath}".`));
    });
}

function drawImage(...args) {
    canvas.drawImage(...args);
}

function createBufferedCanvas(image = null, width = 0, height = 0) {
    const bufferedCanvasElement = document.createElement('canvas');

    if (image !== null) {
        // image.crossOrigin = 'anonymous';

        if (width <= 0)
            width = image.width;

        if (height <= 0)
            height = image.height;
    }

    bufferedCanvasElement.width = width;
    bufferedCanvasElement.height = height;

    const bufferedCanvas = bufferedCanvasElement.getContext('2d');

    if (image !== null)
        bufferedCanvas.drawImage(image, 0, 0);

    return {
        width: width,
        height: height,
        element: bufferedCanvasElement,
        canvas: bufferedCanvas
    };
}

function createChromakeydImage(image, r, g, b) {
    const bufferedCanvas = createBufferedCanvas(image);
    const imageData = bufferedCanvas.canvas.getImageData(0, 0, bufferedCanvas.width, bufferedCanvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const pixel = {
            r: data[i],
            g: data[i + 1],
            b: data[i + 2]
        };

        if (pixel.r === r && pixel.g === g && pixel.b === b)
            data[i + 3] = 0;
    }

    bufferedCanvas.canvas.putImageData(imageData, 0, 0);

    return bufferedCanvas.element;
}

function createColoredImage(image, color, mode) {
    const bufferedCanvas = createBufferedCanvas(image);
    const canvas = bufferedCanvas.canvas;

    canvas.globalCompositeOperation = mode;

    canvas.fillStyle = color;
    canvas.fillRect(0, 0, bufferedCanvas.width, bufferedCanvas.height);

    canvas.globalCompositeOperation = 'destination-in';

    canvas.drawImage(image, 0, 0);

    canvas.globalCompositeOperation = 'source-over';

    return bufferedCanvas.element;
}
