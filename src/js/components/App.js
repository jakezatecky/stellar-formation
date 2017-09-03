import React from 'react';

import stellarFormation from 'js/stellarFormation';

class App extends React.PureComponent {
    constructor() {
        super();

        this.state = {
            cursor: {
                x: '0',
                y: '0',
                k: '1.00',
            },
        };

        this.onCursorUpdate = this.onCursorUpdate.bind(this);
    }

    componentDidMount() {
        stellarFormation({
            onCursorUpdate: this.onCursorUpdate,
        });
    }

    onCursorUpdate(cursor) {
        this.setState({ cursor });
    }
    
    render() {
        const { cursor } = this.state;

        return (
            <div className="container">
                <canvas id="canvas" width="750" height="750" />
                <ul className="details">
                    <li className="cursor">
                        <span className="header">Position</span>
                        <span className="value">
                            ({cursor.x}, {cursor.y})
                        </span>
                        <span className="actions">
                            <button id="reset-cursor" type="button">Reset</button>
                        </span>
                    </li>
                    <li className="zoom">
                        <span className="header">Zoom</span>
                        <span className="value">
                            {cursor.k}
                        </span>
                    </li>
                </ul>
            </div>
        );
    }
}

export default App;
