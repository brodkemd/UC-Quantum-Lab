# JSON to HTML converter
## Overview
This extension creates the webviewer using html generated from a json file. This is accomplished in the [src/getHtml.ts](https://github.com/UC-Advanced-Research-Computing/UC-Quantum-Lab/blob/main/src/getHtml.ts) file and template html code found in [media/format.html](https://github.com/UC-Advanced-Research-Computing/UC-Quantum-Lab/blob/main/media/format.html). The code in the typescript file that generates the html is almost entirely reliant on recursion.

## About the Converter
### The format of the json file
The keys in the json file must be from the list below. For an example json file see [examples/json/example_1.json](https://github.com/UC-Advanced-Research-Computing/UC-Quantum-Lab/blob/main/examples/json/example_1.json). NOTE: These keys can be nested as many times as you would like (obviously there is going to be a memory limit at some point).
- `"top"`
    - **Description**: Creates a top resizable subwindow whose content is the value of this key.
        - NOTE: this key must be paired with "bottom".
    - **Value of this key**: The value for this key can be html to render or a json object with the keys in this list.
    - **Example**: (of a .json file to be converted)
        ```json
        {
          "top" : "<h1>hello</h1>", 
          "bottom" : "<h1>hello</h1>"
        }
        ```
        or 
        ```json
        {
          "top" : {
            "top" : "<h1>hello</h1>", 
            "bottom" : "<h1>hello</h1>"
          }, 
          "bottom" : "<h1>hello</h1>"
        }
        ```
- `"bottom"`
    - **Description**: Creates a bottom resizable subwindow whose content is the value of this key.
        - NOTE: this key must be paired with "top".
    - **Value of this key**: The value for this key can be html to render or a json object with the keys in this list.
    - **Example**: (of a .json file to be converted)
        ```json
        {
          "top" : "<h1>hello</h1>", 
          "bottom" : "<h1>hello</h1>"
        }
        ```
        or 
        ```json
        {
          "top" : "<h1>hello</h1>",
          "bottom" : {
            "top" : "<h1>hello</h1>", 
            "bottom" : "<h1>hello</h1>"
          }
        }
        ```
- `"right"`
    - **Description**: Creates a right resizable subwindow whose content is the value of this key.
        - NOTE: this key must be paired with "left".
    - **Value of this key**: The value for this key can be html to render or a json object with the keys in this list.
    - **Example**: (of a .json file to be converted)
        ```json
        {
          "right" : "<h1>hello</h1>", 
          "left" : "<h1>hello</h1>"
        }
        ```
        or 
        ```json
        {
          "right" : {
            "right" : "<h1>hello</h1>", 
            "left" : "<h1>hello</h1>"
          },
          "left" : "<h1>hello</h1>"
        }
        ```
- `"left"`
    - **Description**: Creates a left resizable subwindow whose content is the value of this key.
        - NOTE: this key must be paired with "right".
    - **Value of this key**: The value for this key can be html to render or a json object with the keys in this list.
    - **Example**: (of a .json file to be converted)
        ```json
        {
          "right" : "<h1>hello</h1>", 
          "left" : "<h1>hello</h1>"
        }
        ```
        or 
        ```json
        {
          "right" : "<h1>hello</h1>",
          "left" : {
            "right" : "<h1>hello</h1>", 
            "left" : "<h1>hello</h1>"
          }
        }
        ```
- `"only"`
    - **Description**: Creates a single resizable subwindow whose content is the value of this key.
        - NOTE: must be the only key on a level (i.e. can not be paired with anything).
    - **Value of this key**: The value for this key can be html to render or a json object with the keys in this list.
    - **Example**: (of a .json file to be converted)
        ```json
        {
          "only" : "<h1>hello</h1>"
        }
        ```
        or 
        ```json
        {
          "only" : {
            "right" : "<h1>hello</h1>", 
            "left" : "<h1>hello</h1>"
          }
        }
        ```
- `"style"`
    - **Description**: The sets the style of the parent window. This key applies the window that the current window is nested in.
        - NOTE: can not be on the first level of the json object.
    - **Value of this key**: The value of this key is css with the following added css arguements:
        - size : takes a number from 0 to 1 that sets the fraction of the parent window to fill the window that this key applies to. Example: `size=0.6;`.
    - **Example**: (of a .json file to be converted)
        ```json
        {
          "only" : {
            "top" : "<h1>hello</h1>", 
            "bottom" : "<h1>hello</h1>",
            "style" :  "background-color:black;size:0.1;"
          }
        }
        ```
        In this example, the "style" key applies to the window created by the "only" key.

### Addition HTML formatting
The json to html converter provided by this extension also provides the ability
to format the html used in the json file by using the format `{VALUE}`. Where "VALUE" is in the following list:
- `URI`
    - **Description**: replaces this with the webview uri so that the webviewer can load resources.
    - **Example**: 
        ```html
        <img src="{URI}/path/or/url" alt="no image to display">
        ```
When the json is compiled into html the values in the above list and the brackets surrounding them are replaced by the resource that is available to the compiler.

There is also the additional html div tags avaiable:
- `data-include`
    - **Description**: Loads the contents of the provided path into the div. This is primarily useful for loading other html docs directly in the main html doc. This feature is thanks to jquery.
    - **Example**: 
        ```html
        <div data-include='{URI}/some/path/or/url'></div>
        ```

## How to use the Converter with the VS Code Extension
To use the capabilities described in the previous section with the vscode extension, the `custom` command from the [UC-Quantum-tools](https://github.com/UC-Advanced-Research-Computing/UC-Quantum-tools) python package. Just pass a json object (in python this is a dictionary object) following the rules above to this command and it will be rendered in the vscode extension.
- **Example**: (python code)
    ```python
    custom({"left" : "<h1>hello</h1>", "right" : "<h1>hello</h1>"})
    ```

## How to use the Converter without the VS Code Extension
There is no way to do this currently. It is definitely possible to make this happen with minor modifications to [src/getHtml.ts](https://github.com/UC-Advanced-Research-Computing/UC-Quantum-Lab/blob/main/src/getHtml.ts).