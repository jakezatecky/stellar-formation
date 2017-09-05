const d3 = window.d3;
const defaultConfig = {
    FRAMES_PER_SECOND: 120,
    MAX_POINTS: 1000,
    DEFAULT_MASS: 1,
    DEFAULT_SIZE: 1,
    GRAVITATIONAL_CONSTANT: 1e-2,
};

const startFormation = (props, config = defaultConfig) => {
    const VOLUME_MULTIPLIER = config.DEFAULT_SIZE / config.DEFAULT_MASS;
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
        } else if (event.key === ' ') {
            if (interval) {
                clearInterval(interval);
                interval = null;
            } else {
                interval = startInterval(ctx, points);
            }
        }

        onCursorUpdate();
    };

    document.querySelector('#reset-cursor').onclick = () => {
        cursor.x = getScaledOffset(WIDTH);
        cursor.y = getScaledOffset(HEIGHT);

        onCursorUpdate();
    };

    // Add zoom/dragging functionality
    d3.select('canvas').call(
        d3.zoom()
            .scaleExtent([1 / 4, 4])
            .on('zoom', zoom),
    );

    /**
     * Account for scaling `k` of canvas and return x/y offset.
     *
     * @returns {number}
     */
    function getScaledOffset(originalLength) {
        return (originalLength - (originalLength * cursor.k)) / 2;
    }

    function onCursorUpdate() {
        const getText = (originalLength, translation) => String(
            Math.floor(getScaledOffset(originalLength) - translation)
        );

        props.onCursorUpdate({
            x: getText(WIDTH, cursor.x),
            y: getText(HEIGHT, cursor.y),
            k: cursor.k.toFixed(2),
        });

        // If we are paused, go ahead and plot the current positions
        if (!interval) {
            plotCanvas(ctx, points);
        }
    }

    function zoom() {
        cursor = d3.event.transform;
        onCursorUpdate();
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

    function getVelocityTransfer(a, b, vector) {
        // KineticEnergy = (1/2)mv^2
        return Math.sqrt((b.mass * (b[vector] ** 2)) / a.mass) * Math.sign(a[vector]) * -1;
    }

    function coalesce(a, b) {
        /* eslint-disable no-param-reassign */
        a.mass += b.mass;
        a.volume = calculateVolume(a.mass);
        b.consumed = true;

        // Assume elastic collision and transfer kinetic energy from b to slow down a
        a.dx += getVelocityTransfer(a, b, 'dx');
        a.dy += getVelocityTransfer(a, b, 'dy');
        /* eslint-enable no-param re-assign */
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

                    // If the two points intersect, the more massive point will consume the small
                    // point
                    if (distance <= Math.sqrt(a.volume * b.volume) / 2) {
                        if (a.mass >= b.mass) {
                            coalesce(a, b);
                        } else {
                            coalesce(b, a);
                        }
                    }
                }
            });
        });

        return points.filter(point => !point.consumed);
    }

    function gravitate(a, b) {
        // Component distances to target
        let dx = b.x - a.x;
        let dy = b.y - a.y;

        // Overall distances
        const distance = Math.sqrt((dx * dx) + (dy * dy));

        // Normalize for direction
        dx /= distance;
        dy /= distance;

        // Calculate the force between the object (assumed 1 mass) and planet
        const force = (a.mass * b.mass * config.GRAVITATIONAL_CONSTANT) / (distance ** 2);

        // Apply the force to the distance to move
        dx *= force;
        dy *= force;

        // Apply this acceleration
        a.dx += dx;
        a.dy += dy;
    }

    function gravitatePoints(points) {
        points.forEach((a, indexA) => {
            points.forEach((b, indexB) => {
                if (indexA !== indexB) {
                    gravitate(a, b);
                }
            });
        });
    }

    function adjustPositions(points) {
        points.forEach((point, index) => {
            points[index].x += point.dx;
            points[index].y += point.dy;
        });
    }

    function plotCanvas(ctx, points) {
        ctx.save();
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.translate(cursor.x, cursor.y);
        ctx.scale(cursor.k, cursor.k);
        plotPositions(ctx, points);
        ctx.restore();
    }

    const startInterval = (ctx, points) => (
        setInterval(() => {
            clearCanvas(ctx);
            points = coalescePoints(points);
            gravitatePoints(points);
            adjustPositions(points);
            plotCanvas(ctx, points);
        }, 1000 / config.FRAMES_PER_SECOND)
    );

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const WIDTH = parseFloat(canvas.width);
    const HEIGHT = parseFloat(canvas.height);

    const used = [];
    let points = [];
    let numPoints = 0;

    while (numPoints < config.MAX_POINTS) {
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
            mass: config.DEFAULT_MASS,
            volume: calculateVolume(config.DEFAULT_MASS),
        });

        numPoints += 1;
    }

    // Initial plot
    plotCanvas(ctx, points);

    let interval = startInterval(ctx, points);

    return interval;
};

export {
    defaultConfig,
    startFormation,
};
