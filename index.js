const FRAMES_PER_SECOND = 120000;
const MAX_POINTS = 200;
const DEFAULT_MASS = 1;
const DEFAULT_SIZE = 3;
const GRAVITATIONAL_CONSTANT = 1e-2;

function getRandomInt(min, max) {
    const newMin = Math.ceil(min);
    const newMax = Math.floor(max);

    return Math.floor(Math.random() * (newMax - newMin)) + newMin;
}

function plotPositions(ctx, points) {
    points.forEach(({ x, y, width, height }) => {
        ctx.fillStyle = '#888';
        ctx.fillRect(x, y, width, height);
    });
}

function clearCanvas(ctx) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
}

function gravitatePoints(points) {
    points.forEach((a, indexA) => {
        points.forEach((b, indexB) => {
            if (indexA !== indexB) {
                gravitate(a, b);
            }
        })
    });
}

function gravitate(a, b) {
    // Component distances to target
    let dx = b.x - a.x;
    let dy = b.y - a.y;

    // Overall distances
    let distance = Math.sqrt((dx * dx) + (dy * dy));

    // Normalize for direction
    dx /= distance;
    dy /= distance;

    // Calculate the force between the object (assumed 1 mass) and planet
    let force = (a.mass * b.mass * GRAVITATIONAL_CONSTANT) / Math.pow(distance, 2);

    // Apply the force to the distance to move
    dx *= force;
    dy *= force;

    // Apply this acceleration
    a.dx += dx;
    a.dy += dy;
}

function adjustPositions(points) {
    points.forEach((point, index) => {
        points[index].x += point.dx;
        points[index].y += point.dy;
    })
}

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const used = [];
const points = [];
let numPoints = 0;

while (numPoints < MAX_POINTS) {
    const x = getRandomInt(0, WIDTH);
    const y = getRandomInt(0, HEIGHT);

    if (used[x] !== undefined && used[x][y] !== undefined) {
        continue;
    }

    if (used[x] === undefined) {
        used[x] = [];
    }

    used[x][y] = true;
    points.push({
        x,
        y,
        dx: 0,
        dy: 0,
        mass: DEFAULT_MASS,
        width: DEFAULT_SIZE,
        height: DEFAULT_SIZE,
    });

    numPoints += 1;
}

// Initial plot
plotPositions(ctx, points);

setInterval(() => {
    clearCanvas(ctx);
    gravitatePoints(points);
    adjustPositions(points);
    plotPositions(ctx, points);
}, 1000 / FRAMES_PER_SECOND);
