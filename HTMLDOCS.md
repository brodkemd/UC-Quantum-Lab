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