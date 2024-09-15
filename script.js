const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');

const widthSlider = document.getElementById('width-slider');
const heightSlider = document.getElementById('height-slider');
const widthValue = document.getElementById('width-value');
const heightValue = document.getElementById('height-value');
const newGameButton = document.getElementById('new-game');

let hexSize = 30;
const mineChance = 0.15;

let board = [];
let width, height;

function calculateMaxSize() {
    const maxWidth = Math.floor((window.innerWidth - 40) / (hexSize * 1.5));
    const maxHeight = Math.floor((window.innerHeight - 100) / (hexSize * 2));
    
    widthSlider.max = maxWidth;
    heightSlider.max = maxHeight;
    
    if (parseInt(widthSlider.value) > maxWidth) {
        widthSlider.value = maxWidth;
    }
    if (parseInt(heightSlider.value) > maxHeight) {
        heightSlider.value = maxHeight;
    }
    
    updateSizeValues();
}

function updateSizeValues() {
    widthValue.textContent = widthSlider.value;
    heightValue.textContent = heightSlider.value;
    width = parseInt(widthSlider.value);
    height = parseInt(heightSlider.value);
    initializeBoard();
}

function initializeBoard() {
    canvas.width = (width * 1.5 + 0.5) * hexSize * Math.sqrt(3);
    canvas.height = (height * 2 + 1) * hexSize;

    board = [];
    for (let q = -Math.floor(width/2); q <= Math.floor(width/2); q++) {
        for (let r = -Math.floor(height/2); r <= Math.floor(height/2); r++) {
            if (Math.abs(q + r) <= Math.floor(Math.max(width, height)/2)) {
                board.push({ q, r, revealed: false, mine: false, flag: false, generated: false });
            }
        }
    }
    drawBoard();
}

function drawHex(x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = 2 * Math.PI / 6 * (i + 0.5); // Rotate by 30 degrees
        const xPos = x + size * Math.cos(angle);
        const yPos = y + size * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(xPos, yPos);
        } else {
            ctx.lineTo(xPos, yPos);
        }
    }
    ctx.closePath();
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    board.forEach(hex => {
        const { x, y } = hexToPixel(hex.q, hex.r);
        ctx.fillStyle = hex.revealed ? (hex.mine ? 'red' : 'white') : '#ccc';
        drawHex(x, y, hexSize - 1);
        ctx.fill();
        ctx.stroke();

        if (hex.flag) {
            ctx.fillStyle = 'orange';
            ctx.beginPath();
            ctx.arc(x, y, hexSize / 3, 0, 2 * Math.PI);
            ctx.fill();
        } else if (hex.revealed && !hex.mine && hex.generated) {
            const count = getMineCount(hex.q, hex.r);
            if (count > 0) {
                ctx.fillStyle = 'black';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(count.toString(), x, y);
            }
        }
    });
}

function hexToPixel(q, r) {
    const x = hexSize * (Math.sqrt(3) * q + Math.sqrt(3)/2 * r) + canvas.width / 2;
    const y = hexSize * (3/2 * r) + canvas.height / 2;
    return { x, y };
}

function pixelToHex(x, y) {
    const q = ((x - canvas.width / 2) * Math.sqrt(3)/3 - (y - canvas.height / 2) / 3) / hexSize;
    const r = (y - canvas.height / 2) * 2/3 / hexSize;
    return { q: Math.round(q), r: Math.round(r) };
}

function getNeighbors(q, r) {
    return [
        { q: q+1, r: r }, { q: q+1, r: r-1 }, { q: q, r: r-1 },
        { q: q-1, r: r }, { q: q-1, r: r+1 }, { q: q, r: r+1 }
    ];
}

function generateCell(q, r) {
    const hex = board.find(h => h.q === q && h.r === r);
    if (!hex || hex.generated) return;

    hex.generated = true;
    hex.mine = Math.random() < mineChance;

    getNeighbors(q, r).forEach(({ q: nq, r: nr }) => {
        const neighbor = board.find(h => h.q === nq && h.r === nr);
        if (neighbor && !neighbor.generated) {
            generateCell(nq, nr);
        }
    });
}

function getMineCount(q, r) {
    return getNeighbors(q, r).reduce((count, { q: nq, r: nr }) => {
        const neighbor = board.find(h => h.q === nq && h.r === nr);
        return count + (neighbor && neighbor.generated && neighbor.mine ? 1 : 0);
    }, 0);
}

function revealHex(q, r) {
    const hex = board.find(h => h.q === q && h.r === r);
    if (!hex || hex.revealed || hex.flag) return;

    generateCell(q, r);
    hex.revealed = true;

    if (hex.mine) {
        alert('Game Over!');
        board.forEach(h => {
            if (h.generated) h.revealed = true;
        });
    } else {
        const count = getMineCount(q, r);
        if (count === 0) {
            getNeighbors(q, r).forEach(({ q: nq, r: nr }) => revealHex(nq, nr));
        }
    }

    drawBoard();
}

function toggleFlag(q, r) {
    const hex = board.find(h => h.q === q && h.r === r);
    if (!hex || hex.revealed) return;

    hex.flag = !hex.flag;
    drawBoard();
}

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const { q, r } = pixelToHex(x, y);
    revealHex(q, r);
});

canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const { q, r } = pixelToHex(x, y);
    toggleFlag(q, r);
});

function newGame() {
    initializeBoard();
}

window.addEventListener('resize', calculateMaxSize);
widthSlider.addEventListener('input', updateSizeValues);
heightSlider.addEventListener('input', updateSizeValues);
newGameButton.addEventListener('click', newGame);

calculateMaxSize();
updateSizeValues();
initializeBoard();