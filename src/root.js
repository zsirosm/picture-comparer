import React from "react";
import ReactDOM from "react-dom";
import { ipcRenderer } from "electron";

// const electron = window.require('electron');
// const ipcRenderer  = electron.ipcRenderer;

const rootEl = document.getElementById("root");

class AppContainer extends React.Component {
  state = {
    input: ""
  };

  sendEvent = () => {
    const { input } = this.state;
    ipcRenderer.send("reactInputState", input);
  };

  render() {
    const { input } = this.state;
    return (
      <div>
        Rendered in React
        <input
          name="file"
          value={input}
          type="text"
          onChange={event => {
            this.setState({ input: event.target.value });
          }}
        />
        <button type="button" onClick={this.sendEvent}>
          Send event
        </button>
      </div>
    );
  }
}

export const App = ReactDOM.render(<AppContainer />, rootEl);
