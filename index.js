function getRandomInt(min, max) {
    const newMin = Math.ceil(min);
    const newMax = Math.floor(max);
    return Math.floor(Math.random() * (newMax - newMin)) + newMin;
}

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const used = [];
const points = [];
const maxPoints = 100;
let numPoints = 0;

while (numPoints < maxPoints) {
    const x = getRandomInt(0, 200);
    const y = getRandomInt(0, 200);

    if (used[x] !== undefined && used[x][y] !== undefined) {
        continue;
    }

    if (used[x] === undefined) {
        used[x] = [];
    }

    used[x][y] = true;
    points.push({ x, y });

    numPoints += 1;
}

points.forEach(({ x, y }) => ctx.fillRect(x, y, 1, 1));
