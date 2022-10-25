# uc-quantum-lab

This extension provides a UI that allows the results of a quantum circuit simulated with qiskit to be presented cleanly. This extension operates with the required python library https://github.com/brodkemd/UCQ_tools.

NOTE: If you want a feature or you find a bug create an issue or start a discussion, please.

## Features
Can display a lot of information about your circuit including:
- The statevector of your circuit an arbitrary number of times from anywhere in your circuit as long as there is no measurements.
- An image of your circuit an arbitrary number of times from anywhere in your circuit.
- A histogram resprenting the results of the execution of your circuit an arbitrary number of times.

![interface](docs/images/annotated_ui.png)

## Using the extension
1. Open a folder in vscode.
2. Open the command palete and run uc-quantum-lab.init or if you have an active editor click the UC logo.
3. Answer the prompts.
4. Everytime you want to run the python file, click the UC logo in the editor and it will execute your file with the python interpreter (that you specificied in the setup) in the terminal in the vscode window.

## Requirements
- Python and pip on your device, NOTE: we strongly recommend using anaconda for this (see https://www.anaconda.com/) and it must be installed as user not as root (this is the better way to do it anyway)

## Extension Commands
This extension contributes the following commands:
- `uc-quantum-lab.execute`: execute the extension, will detect if the directory is initialize or not and initializes it if need be. It will also open up a webview panel where it will display content.
- `uc-quantum-lab.init`: setup the current workspace path for this extension.
- `uc-quantum-lab.reinit`: if you encounter an error try running this, it will wipe the extension setup in the workspace and setup it up again.

## Examples
See the examples folder, it contains the following:
- python:
    - examples of python files
- json
    - examples using the json to html converter of this extension (you could write some python code to output to json then have this extension render it)

## About json to html converter
Available keys are "top", "bottom", "left", "right", "only", and "style". The value for these keys can be either html or another json object with these keys except for "style" which takes css. See examples/json.
- "style" key applies to the previous level of the json object. Also, if you pass 'size=0.ANY_NUMBER' as a css argument then the fraction of the window will be set to that.
- "only" must be the only key on a level
- if you format a string like "{VALUE}" where VALUE is in the following list, it will be replaced with that value:
    - URI: webview uri so that the webview can load resources.
- you can set your own layout by using the `custom` command from the UC_Quantum_Lab python module.
## Known Issues
Do not know any currently but there is more than likely some because of  being in beta.

## Release Notes
### 0.0.1
Works on windows and linux relatively well, need to test on mac os.
