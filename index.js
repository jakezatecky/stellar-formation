const FRAMES_PER_SECOND = 120;
const MAX_POINTS = 1000;
const DEFAULT_MASS = 1;
const DEFAULT_SIZE = 1;
const GRAVITATIONAL_CONSTANT = 1e-2;
const VOLUME_MULTIPLIER = DEFAULT_SIZE  / DEFAULT_MASS;
const SCROLL_SPEED = 5;
const calculateVolume = mass => Math.log(mass * VOLUME_MULTIPLIER * Math.E);

let cursor = {
    x: 0,
    y: 0,
    k: 1,
};

document.onkeydown = (event) => {
    if (event.key === 'ArrowLeft') {
        cursor.x += SCROLL_SPEED;
    } else if (event.key === 'ArrowRight') {
        cursor.x -= SCROLL_SPEED;
    } else if (event.key === 'ArrowUp') {
        cursor.y += SCROLL_SPEED;
    } else if (event.key === 'ArrowDown') {
        cursor.y -= SCROLL_SPEED;
    }

    updateCursorText();
};

document.querySelector('#reset-cursor').onclick = () => {
    cursor.x = 0;
    cursor.y = 0;

    updateCursorText();
};

function updateCursorText() {
    document.querySelector('.cursor-x').innerHTML = String(Math.floor(-1 * cursor.x));
    document.querySelector('.cursor-y').innerHTML = String(Math.floor(-1 * cursor.y));
}

function getRandomInt(min, max) {
    const newMin = Math.ceil(min);
    const newMax = Math.floor(max);

    return Math.floor(Math.random() * (newMax - newMin)) + newMin;
}

function plotPositions(ctx, points) {
    points.forEach(({ x, y, volume }) => {
        ctx.fillStyle = '#555';
        ctx.fillRect(x, y, volume, volume);
    });
}

function clearCanvas(ctx) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
}

function coalescePoints(points) {
    points.forEach((a, indexA) => {
        points.forEach((b, indexB) => {
            if (indexA !== indexB && !a.consumed && !b.consumed) {
                // Component distances to target
                const dx = b.x - a.x;
                const dy = b.y - a.y;

                // Overall distances
                const distance = Math.sqrt((dx * dx) + (dy * dy));

                // If the two points intersect, the more massive point will consume the small point
                if (distance <= Math.sqrt(a.volume * b.volume) / 2) {
                    if (a.mass >= b.mass) {
                        coalesce(a, b);
                    } else {
                        coalesce(b, a);
                    }
                }
            }
        })
    });

    return points.filter(point => !point.consumed);
}

function coalesce(a, b) {
    a.mass += b.mass;
    a.volume = calculateVolume(a.mass);
    b.consumed = true;

    // Assume elastic collision and transfer kinetic energy from b to slow down a
    a.dx += getVelocityTransfer(a, b, 'dx');
    a.dy += getVelocityTransfer(a, b, 'dy');
}

function getVelocityTransfer(a, b, vector) {
    // KineticEnergy = (1/2)mv^2
    return Math.sqrt((b.mass * b[vector] ** 2) / a.mass) * Math.sign(a[vector]) * -1;
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

function plotCanvas(ctx, points) {
    ctx.save();
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.translate(cursor.x, cursor.y);
    ctx.scale(cursor.k, cursor.k);
    plotPositions(ctx, points);
    ctx.restore();
}

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const used = [];
let points = [];
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
        volume: calculateVolume(DEFAULT_MASS),
    });

    numPoints += 1;
}

// Initial plot
plotCanvas(ctx, points);

setInterval(() => {
    clearCanvas(ctx);
    points = coalescePoints(points);
    gravitatePoints(points);
    adjustPositions(points);
    plotCanvas(ctx, points);
}, 1000 / FRAMES_PER_SECOND);

// Add zoom/dragging functionality
d3.select('canvas').call(
    d3.zoom()
        .scaleExtent([1 / 2, 4])
        .on('zoom', zoom)
);

function zoom() {
    cursor = d3.event.transform;
    updateCursorText();
}
