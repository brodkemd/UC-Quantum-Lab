# uc-quantum-lab
**PLEASE** **PLEASE** report any bugs, features that you may want, or anything else in the github, they will be attended to. This is still an early release so feedback is appreciated.

This extension provides a UI that allows the results of a quantum circuit created simulated with qiskit to be presented cleanly and easily. This extension operates with the required python library https://github.com/UC-Advanced-Research-Computing/UC-Quantum-tools (the extension will auto install this library as long as you have a working python and pip)

NOTE: If you want a feature or you find a bug, create an issue or start a discussion, please.

## Features
Can display a lot of information about your circuit including:
- The statevector of your circuit an arbitrary number of times from anywhere in your circuit as long as there is no measurements. (to show more than one just call the state function more than once)
- An image of your circuit an arbitrary number of times from anywhere in your circuit. (to show more than one just call the display function more than once)
- A histogram resprenting the results of the execution of your circuit an arbitrary number of times. (to show more than one just call the counts function more than once)

![interface](docs/images/annotated_ui.png)

## Using the extension
1. Open a folder in vscode.
2. Open the command palete and run uc-quantum-lab.execute or, if you have an active editor with a python file in it, click the UC logo.
3. Answer the prompts. These only show up if the directory has not been initialized yet.
    - The following steps are for registering a python interpreter with this extension:
        1. Create a temporary python file or open up the repl (interactive python terminal) for the python interpreter that you want to register. Both of these actions must be performed in the directory that you want to use the extension in.
        2. Enter the following lines of code in the file or command line repl
            ```python
            from UC_Quantum_Lab import register
            register()
            ```
        3. 
4. Everytime you want to run the python file, click the UC logo in the editor and it will execute your file with the python interpreter (that you specificied in the setup) in the active terminal of the vscode window. You could also set a keybind to do this.
    - See examples/python directory on the repo page for example python files that can be used with this extension.

## Requirements
- Python and pip on your device. 
    - **NOTE**: we strongly recommend using anaconda for this (see https://www.anaconda.com/) and it *must* be installed as user *not* as root (this is the better way to do it anyway).
    - Also, if you are using anaconda you must make an environment, this extension will not use the base environment and it will not auto make an environment. There is plenty of info on the internet for this.
## Recommendations
- We strongly recommend that you have the python extension for vscode. It really helps with development. See the link for more info https://marketplace.visualstudio.com/items?itemName=ms-python.python.

## Extension Commands
This extension contributes the following commands:
- `uc-quantum-lab.execute`: execute the extension, will detect if the directory is initialized or not and initializes it if need be. It will also open up a webview panel where it will display content. If you only ever run this command you should be fine.
- `uc-quantum-lab.init`: setup the current workspace path for this extension.
- `uc-quantum-lab.reinit`: if you encounter an error try running this, it will wipe the extension setup in the workspace and setup it up again.

## Examples
See the examples folder, it contains the following:
- python:
    - examples of python files using the python library required for this extension
- json
    - examples using the json to html converter of this extension (you could write some python code to output to json then have this extension render it)

## About json to html converter
Available keys are "top", "bottom", "left", "right", "only", and "style". The value for these keys can be either html or another json object with the same keys. Except for "style" which takes css. See examples/json. Some things to note:
- The "style" key applies to the previous level of the json object. Also, if you pass 'size=0.ANY_NUMBER' as a css argument then the fraction of the window will be set to that.
- "only" must be the only key on a level
- if you format a string like "{VALUE}" where VALUE is in the following list, it will be replaced with that value:
    - URI: webview uri so that the webview can load resources.
- you can set your own layout by using the `custom` command from the UC_Quantum_Lab python module and passing a json like object (i.e. a dictionary).
- There is an addition html tag available called `data-include` used like 
    ```html
    <div data-include='some.path.or.url'></div>
    ```
    This tag inserts the data at that url or path into the current html file. This allows for seperate html files to be loaded into the main html file. This feature is thanks to jquery.
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