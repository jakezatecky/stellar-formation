import React from 'react';
import shortid from 'shortid';

import { startFormation, defaultConfig } from 'js/stellarFormation';

const configMap = {
    FRAMES_PER_SECOND: 'Frames per second',
    MAX_POINTS: 'Initial points',
    DEFAULT_MASS: 'Initial mass',
    DEFAULT_SIZE: 'Initial size',
    GRAVITATIONAL_CONSTANT: 'Gravitational constant',
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

        this.interval = null;

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
        clearInterval(this.interval);

        this.startFormation();
    }

    startFormation() {
        const { config } = this.state;

        this.interval = startFormation({
            onCursorUpdate: this.onCursorUpdate,
        }, config);
    }

    render() {
        const { config, cursor } = this.state;
        const controls = Object.keys(configMap).map((configKey) => {
            const id = shortid.generate();

            return (
                <div key={configKey} className="form-group">
                    <span className="header">
                        <label htmlFor={id}>{configMap[configKey]}</label>
                    </span>
                    <span className="value">
                        <input
                            id={id}
                            name={configKey}
                            type="input"
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
                        <button type="button" onClick={this.onUpdate}>
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
                            <button id="reset-cursor" type="button">Reset</button>
                        </li>
                    </ul>
                </aside>
            </div>
        );
    }
}

export default App;
