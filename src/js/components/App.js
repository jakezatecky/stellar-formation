import React from 'react';
import shortid from 'shortid';

import { startSimulation, defaultConfig } from 'js/simulation';

const configMap = {
    FRAMES_PER_SECOND: {
        label: 'Frames per second',
        type: 'number',
    },
    MAX_POINTS: {
        label: 'Initial points',
        type: 'number',
    },
    DEFAULT_MASS: {
        label: 'Initial mass',
        type: 'number',
    },
    DEFAULT_SIZE: {
        label: 'Initial size',
        type: 'number',
    },
    GRAVITATIONAL_CONSTANT: {
        label: 'Gravitational constant',
        type: 'input',
    },
    FILL: {
        label: 'Fill color',
        type: 'color',
    },
};

class App extends React.PureComponent {
    constructor() {
        super();

        this.state = {
            cursor: {
                x: '0',
                y: '0',
                k: '1.00',
            },
            config: { ...defaultConfig },
        };

        this.simulation = null;

        this.onConfigChange = this.onConfigChange.bind(this);
        this.onCursorUpdate = this.onCursorUpdate.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
    }

    componentDidMount() {
        this.startFormation();
    }

    onConfigChange(event) {
        const configKey = event.target.name;

        this.setState({
            config: {
                ...this.state.config,
                [configKey]: event.target.value,
            },
        });
    }

    onCursorUpdate(cursor) {
        this.setState({ cursor });
    }

    onUpdate() {
        this.simulation.clearInterval();

        this.startFormation();
    }

    startFormation() {
        const { config } = this.state;

        this.simulation = startSimulation({
            onCursorUpdate: this.onCursorUpdate,
        }, config);
    }

    render() {
        const { config, cursor } = this.state;
        const controls = Object.keys(configMap).map((configKey) => {
            const id = shortid.generate();
            const { label, type } = configMap[configKey];

            return (
                <div key={configKey} className="form-group">
                    <span className="header">
                        <label htmlFor={id}>{label}</label>
                    </span>
                    <span className="value">
                        <input
                            className="form-control form-control-sm"
                            id={id}
                            name={configKey}
                            type={type}
                            value={config[configKey]}
                            onChange={this.onConfigChange}
                        />
                    </span>
                </div>
            );
        });

        return (
            <div className="container">
                <canvas id="canvas" width="750" height="750" />
                <aside className="details">
                    <form className="configuration">
                        <div className="controls">
                            {controls}
                        </div>
                        <button className="btn btn-primary" type="button" onClick={this.onUpdate}>
                            Update
                        </button>
                    </form>
                    <ul className="cursor">
                        <li className="position">
                            <span className="header">Position</span>
                            <span className="value">
                                ({cursor.x}, {cursor.y})
                            </span>
                        </li>
                        <li className="zoom">
                            <span className="header">Zoom</span>
                            <span className="value">
                                {cursor.k}
                            </span>
                        </li>
                        <li>
                            <button className="btn btn-secondary" id="reset-cursor" type="button">Reset</button>
                        </li>
                    </ul>
                </aside>
            </div>
        );
    }
}

export default App;
