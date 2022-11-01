# uc-quantum-lab
**PLEASE** **PLEASE** report any bugs, features that you may want, or anything else in the github, they will be attended to. This is still an early release so feedback is appreciated.

This extension provides a UI that allows the results of a quantum circuit created simulated with qiskit to be presented cleanly and easily. This extension operates with the required python library [UC-Quantum-tools](https://github.com/UC-Advanced-Research-Computing/UC-Quantum-tools) (the extension will auto install this library as long as you have a working python and pip)

NOTE: If you want a feature or you find a bug, create an issue or start a discussion, please.

## Features
Can display a lot of information about your circuit including:
- The statevector of your circuit an arbitrary number of times from anywhere in your circuit as long as there is no measurements. (to show more than one just call the state function more than once)
- An image of your circuit an arbitrary number of times from anywhere in your circuit. (to show more than one just call the display function more than once)
- A histogram resprenting the results of the execution of your circuit an arbitrary number of times. (to show more than one just call the counts function more than once)

![interface](docs/images/annotated_ui.png)

This extension builds off of the python extension for vscode (see [python extension](https://code.visualstudio.com/docs/languages/python)). The python extension provides the python interpreter functionality for this extension.
## Requirements
- Python interpreter and pip on your device. Here is a good tutorial for installing python [python tutorial](https://realpython.com/installing-python/).
    - **NOTE**: we strongly recommend using anaconda for this (see [anaconda](https://www.anaconda.com/)) and it *must* be installed as user *not* as root (this is the better way to do it anyway). For a good tutorial on anaconda good to [anaconda tutorial](https://www.upgrad.com/blog/python-anaconda-tutorial/).
- Python extension, for install instructions and a tutorial see [python extension](https://code.visualstudio.com/docs/languages/python). This should be auto installed if it is not already installed.

## Using the extension
1. Open a folder in vscode.
2. set python interpreter to your desired one to via the python extension for vscode.
    - to do this you can either run the following command:
        ```
        python.setInterpreter
        ```
        or in the lower bar you can select the python interpreter.
    - for more help see: [using python environments](https://marketplace.visualstudio.com/items?itemName=ms-python.python#:~:text=Set%20up%20your%20environment)
3. Open the command palete and run 
    ```
    uc-quantum-lab.execute
    ```
    or, if you have an active editor with a python file in it, click the UC logo.
4. Answer the prompts. These only show up if the directory has not been initialized yet.
5. Everytime you want to run the python file, click the UC logo in the editor and it will execute your file with the python extension. You could also set a keybind to do this.
    - See examples/python directory on the repo page for example python files that can be used with this extension (link to this directory: [example python files](https://github.com/UC-Advanced-Research-Computing/UC-Quantum-Lab/tree/main/examples/python))

## Extension Commands
This extension contributes the following commands:
- `uc-quantum-lab.execute`: execute the extension, will detect if the directory is initialized or not and initializes it if need be. It will also open up a webview panel where it will display content. If you only ever run this command you should be fine.
    - **NOTE:** You should probably only ever have to run this command. You might have to run the `uc-quantum-lab.reinit` command as well if you encounter an error.
- `uc-quantum-lab.init`: setup the current workspace path for this extension.
- `uc-quantum-lab.reinit`: if you encounter an error try running this, it will wipe the extension setup in the workspace and setup it up again.

## Examples
See the examples folder, it contains the following:
- python:
    - examples of python files using the python library required for this extension
- json
    - examples using the json to html converter of this extension (you could write some python code to output to json then have this extension render it)

## About json to html converter
See [html docs](./HTMLDOCS.md).

## Known Issues
- There are issues on windows using the system provided python with this extension. If you have to install it with system python. Note:
    - If the extension stops, try running
        ```shell
        pip install UC-Quantum-tools
        ```
- Windows 11 has not been tested.
- Mac has also not been tested but linux has been tested extensively. Since linux and mac are very similar
- **NOTE** If you have any suggestions please put them on the github page, either in issues or discussions.
## Credits
- https://github.com/Tom-Rawlings/Resizable.js for the amazing js library that made the UI possible.
- https://github.com/jquery/jquery for a feature rich api that I use to dynamically load html.
- https://github.com/mathjax/MathJax for a feature rich api that allows latex to displayed in html.

## Release Notes
See changelog for the lastest on this extension