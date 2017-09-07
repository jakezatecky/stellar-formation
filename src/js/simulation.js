const d3 = window.d3;
const defaultConfig = {
    FRAMES_PER_SECOND: 120,
    MAX_POINTS: 1000,
    DEFAULT_MASS: 1,
    DEFAULT_SIZE: 1,
    GRAVITATIONAL_CONSTANT: 1e-2,
    FILL: '#555555',
};

const startSimulation = (props, config = defaultConfig) => {
    const VOLUME_MULTIPLIER = config.DEFAULT_SIZE / config.DEFAULT_MASS;
    const SCROLL_SPEED = 5;
    const calculateVolume = mass => Math.log(mass * VOLUME_MULTIPLIER * Math.E);

    function getRandomInt(min, max) {
        const newMin = Math.ceil(min);
        const newMax = Math.floor(max);

        return Math.floor(Math.random() * (newMax - newMin)) + newMin;
    }

    function getVelocityTransfer(a, b, vector) {
        // KineticEnergy = (1/2)mv^2
        return Math.sqrt((b.mass * (b[vector] ** 2)) / a.mass) * Math.sign(a[vector]) * -1;
    }

    class Simulation {
        constructor(canvas) {
            // Compute initial points
            this.initialize(canvas);

            // Initial plot
            this.plotCanvas();

            // Initialize computation interval
            this.startInterval();

            // Deal with lexical binding issues
            this.onZoom = this.onZoom.bind(this);
        }

        initialize(canvas) {
            this.context = canvas.getContext('2d');
            this.width = parseFloat(canvas.width);
            this.height = parseFloat(canvas.height);

            this.points = [];
            this.cursor = {
                x: 0,
                y: 0,
                k: 1,
            };

            const used = [];
            let numPoints = 0;

            while (numPoints < config.MAX_POINTS) {
                const x = getRandomInt(0, this.width);
                const y = getRandomInt(0, this.height);

                if (used[x] === undefined) {
                    used[x] = [];
                }

                if (used[x][y] === undefined) {
                    used[x][y] = true;
                    this.points.push({
                        x,
                        y,
                        dx: 0,
                        dy: 0,
                        mass: config.DEFAULT_MASS,
                        volume: calculateVolume(config.DEFAULT_MASS),
                    });

                    numPoints += 1;
                }
            }
        }

        startInterval() {
            this.interval = setInterval(() => {
                this.clearCanvas();
                this.coalescePoints();
                this.gravitatePoints();
                this.adjustPositions();
                this.plotCanvas();
            }, 1000 / config.FRAMES_PER_SECOND);
        }

        clearInterval() {
            clearInterval(this.interval);

            this.interval = null;
        }

        plotCanvas() {
            this.context.save();
            this.context.clearRect(0, 0, this.width, this.height);
            this.context.translate(this.cursor.x, this.cursor.y);
            this.context.scale(this.cursor.k, this.cursor.k);
            this.plotPositions();
            this.context.restore();
        }

        plotPositions() {
            this.points.forEach(({ x, y, volume }) => {
                this.context.fillStyle = config.FILL;
                this.context.fillRect(x, y, volume, volume);
            });
        }

        clearCanvas() {
            this.context.clearRect(0, 0, this.width, this.height);
        }

        coalescePoints() {
            this.points.forEach((a, indexA) => {
                this.points.forEach((b, indexB) => {
                    if (indexA !== indexB && !a.consumed && !b.consumed) {
                        // Component distances to target
                        const dx = b.x - a.x;
                        const dy = b.y - a.y;

                        // Overall distances
                        const distance = Math.sqrt((dx * dx) + (dy * dy));

                        // If the two points intersect, the more massive point will consume the
                        // small point
                        if (distance <= Math.sqrt(a.volume * b.volume) / 2) {
                            if (a.mass >= b.mass) {
                                this.coalesce(a, b);
                            } else {
                                this.coalesce(b, a);
                            }
                        }
                    }
                });
            });

            this.points = this.points.filter(point => !point.consumed);
        }

        coalesce(a, b) {
            /* eslint-disable no-param-reassign */
            a.mass += b.mass;
            a.volume = calculateVolume(a.mass);
            b.consumed = true;

            // Assume elastic collision and transfer kinetic energy from b to slow down a
            a.dx += getVelocityTransfer(a, b, 'dx');
            a.dy += getVelocityTransfer(a, b, 'dy');
            /* eslint-enable no-param re-assign */
        }

        gravitatePoints() {
            this.points.forEach((a, indexA) => {
                this.points.forEach((b, indexB) => {
                    if (indexA !== indexB) {
                        this.gravitate(a, b);
                    }
                });
            });
        }

        gravitate(a, b) {
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

        adjustPositions() {
            this.points.forEach((point, index) => {
                this.points[index].x += point.dx;
                this.points[index].y += point.dy;
            });
        }

        onResetCursor() {
            this.cursor.x = this.getScaledOffset(this.width);
            this.cursor.y = this.getScaledOffset(this.height);

            this.onCursorUpdate();
        }

        onKeyDown(event) {
            if (event.key === 'ArrowLeft') {
                this.cursor.x += SCROLL_SPEED;
            } else if (event.key === 'ArrowRight') {
                this.cursor.x -= SCROLL_SPEED;
            } else if (event.key === 'ArrowUp') {
                this.cursor.y += SCROLL_SPEED;
            } else if (event.key === 'ArrowDown') {
                this.cursor.y -= SCROLL_SPEED;
            } else if (event.key === ' ') {
                if (this.interval) {
                    this.clearInterval();
                } else {
                    this.startInterval();
                }
            }

            this.onCursorUpdate();
        }

        onZoom() {
            this.cursor = d3.event.transform;
            this.onCursorUpdate();
        }

        onCursorUpdate() {
            const getText = (originalLength, translation) => String(
                Math.floor(this.getScaledOffset(originalLength) - translation),
            );

            props.onCursorUpdate({
                x: getText(this.width, this.cursor.x),
                y: getText(this.height, this.cursor.y),
                k: this.cursor.k.toFixed(2),
            });

            // If we are paused, go ahead and plot the current positions
            if (!this.interval) {
                this.plotCanvas();
            }
        }

        /**
         * Account for scaling `k` of canvas and return x/y offset.
         *
         * @returns {number}
         */
        getScaledOffset(originalLength) {
            return (originalLength - (originalLength * this.cursor.k)) / 2;
        }
    }

    const canvas = document.getElementById('canvas');
    const simulation = new Simulation(canvas);

    // Add zoom/dragging functionality
    d3.select('canvas').call(
        d3.zoom()
            .scaleExtent([1 / 4, 4])
            .on('zoom', simulation.onZoom),
    );

    // Add pause/moving functionality via keyboard
    document.onkeydown = (event) => {
        simulation.onKeyDown(event);
    };

    return simulation;
};

export {
    defaultConfig,
    startSimulation,
};
