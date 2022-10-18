import json
from . import __states, __circs, __hists, __config_dir, get_path, __layout_file
import os

__layout = {}

__adjuster = lambda layout : layout

# turns path into absolute path if it isn't
def abs_path(path): return os.path.abspath(path.replace("~", os.path.expanduser("~")))

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
    global __adjuster
    __adjuster = __inverter

def __horizontal_inverter(layout):
    return layout

def horizontal_invert():
    global __adjuster
    __adjuster = __horizontal_inverter

def __vertical_inverter(layout):
    return layout

def vertical_invert():
    global __adjuster
    __adjuster = __vertical_inverter

def default():
    if len(__states) and (len(__hists) or len(__circs)):
        #state_path = abs_path(os.path.join(__config_dir,  "__state__.html"))
        msg = "\\[\\begin{matrix} "
        length = len(__states)
        for i, item in enumerate(list(__states)):
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

def __run():
    global __layout, __adjuster, __states
    # if len(__states):
    #     _f_path = get_path(f"__state__.html")
    #     with open(_f_path, 'w') as f:
    #         f.write("")
    #         f.write("\\[\\begin{matrix} ")
    #         length = len(__states)
    #         for i, item in enumerate(list(__states)):
    #             if i < length - 1:
    #                 f.write(f"{item} & " + "&".join(__states[item]) + "\\\\")
    #             else:
    #                 f.write(f"{item} & " + "&".join(__states[item]))
    #         f.write("\\end{matrix}\\]")

    default()
    __layout = __adjuster(__layout)

    print("unloading layout")
    with open(__layout_file, 'w') as f:
        f.write(json.dumps(__layout, indent=2))
    
    __layout = {}
    __states = []
    __circs = [] 
    __hists = []
    
        