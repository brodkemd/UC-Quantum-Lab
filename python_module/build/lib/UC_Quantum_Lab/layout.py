import json
from . import __states, __circs, __hists, __layout_file
import os

__layout = {}
__adjuster = lambda layout : layout

# turns path into absolute path if it isn't
def abs_path(path): return os.path.abspath(path.replace("~", os.path.expanduser("~")))

# converts list of image files to html img elements
def image_list_to_str(image_list:list[str])->str:
    to_return = ""
    for item in image_list:
        to_return+=f"<img src=\"{{URI}}{abs_path(item)}\" alt=\"no image to display\">"
    return to_return

def __inverter(layout):
    for item in list(layout):
        if item == "top":
            other = layout["top"]
            layout["top"] = layout["bottom"]
            layout["bottom"] = other
        elif item == "left":
            other = layout["left"]
            layout["left"] = layout["right"]
            layout["right"] = other
    
    for item in list(layout):
        if not isinstance(layout[item], str):
            layout[item] = __inverter(layout[item])

    return layout

def invert():
    global __layout, __adjuster, _states, __circs, __hists, __layout_file
    __adjuster = __inverter

def __horizontal_inverter(layout):
    return layout

def horizontal_invert():
    global __layout, __adjuster, _states, __circs, __hists, __layout_file
    __adjuster = __horizontal_inverter

def __vertical_inverter(layout):
    return layout

def vertical_invert():
    global __layout, __adjuster, _states, __circs, __hists, __layout_file
    __adjuster = __vertical_inverter


# default layout of the viewer
def default():
    global __layout, __adjuster, _states, __circs, __hists, __layout_file
    # if the statevector and an image is to be rendered
    if len(__states) and (len(__hists) or len(__circs)):
        #state_path = abs_path(os.path.join(__config_dir,  "__state__.html"))
        msg = "\\[\\begin{matrix} "
        length = len(__states)
        for i, item in enumerate(list(__states)):
            if i == 0:
                msg += ("\\text{bits}")
                for j in range(len(__states[item])):
                    msg += f" & \\text{{call {j+1}}}"
                msg += "\\\\"
            if i < length - 1:
                msg+=(f"{item} & " + "&".join(__states[item]) + "\\\\")
            else:
                msg+=(f"{item} & " + "&".join(__states[item]))
        msg+="\\end{matrix}\\]"
        __layout["left"] = msg #f"<div data-include=\"{{URI}}{state_path}\"></div>"

        if len(__hists) and len(__circs):
            __layout["right"] = {"top" : image_list_to_str(__circs), "bottom" : image_list_to_str(__hists)}
        elif len(__hists):
            __layout["right"] = image_list_to_str(__hists)
        elif len(__circs):
            __layout["right"] = image_list_to_str(__circs)
    
    elif len(__states):
        #state_path = abs_path(os.path.join(__config_dir,  "__state__.html"))
        msg = "\\[\\begin{matrix} "
        length = len(__states)
        for i, item in enumerate(list(__states)):
            if i == 0:
                msg += ("\\text{bits}")
                for j in range(len(__states[item])):
                    msg += f" & \\text{{call {j+1}}}"
                msg += "\\\\"
            if i < length - 1:
                msg+=(f"{item} & " + "&".join(__states[item]) + "\\\\")
            else:
                msg+=(f"{item} & " + "&".join(__states[item]))
        msg+="\\end{matrix}\\]"
        __layout["only"] = msg #f"<div data-include=\"{{URI}}{state_path}\"></div>"

    elif len(__hists) or len(__circs):
        if len(__hists) and len(__circs):
            __layout["top"] = image_list_to_str(__circs)
            __layout["bottom"] = image_list_to_str(__hists)
        elif len(__hists):
            __layout["only"] = image_list_to_str(__hists)
        elif len(__circs):
            __layout["only"] = image_list_to_str(__circs)
    
    else:
        __layout["only"] = "<h1>No data to display</h1>"

def __run():
    global __layout, __adjuster, __states, __circs, __hists

    # running the default layout generator
    default()
    __layout = __adjuster(__layout)

    print("unloading layout")
    with open(__layout_file, 'w') as f:
        f.write(json.dumps(__layout, indent=2))
    
    # clearing the values
    __adjuster = lambda layout : layout
    __layout = {}
    __states = []
    __circs = [] 
    __hists = []
    
        