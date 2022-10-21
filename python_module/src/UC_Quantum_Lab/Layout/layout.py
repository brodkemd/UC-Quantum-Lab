import json
from ..config import _states, _circs, _hists, _layout_file, _master_show
import os

_layout = {}
_adjuster = lambda layout : layout

# turns path into absolute path if it isn't
def abs_path(path): return os.path.abspath(path.replace("~", os.path.expanduser("~")))

# converts list of image files to html img elements
def image_list_to_str(image_list:list[str])->str:
    to_return = ""
    for item in image_list:
        to_return+=f"<img src=\"{{URI}}{abs_path(item)}\" alt=\"no image to display\">"
    return to_return

def _inverter(layout):
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
            layout[item] = _inverter(layout[item])

    return layout

def invert():
    global _layout, _adjuster, _states, _circs, _hists, _layout_file
    _adjuster = _inverter

def _horizontal_inverter(layout):
    return layout

def horizontal_invert():
    global _layout, _adjuster, _states, _circs, _hists, _layout_file
    _adjuster = _horizontal_inverter

def _vertical_inverter(layout):
    return layout

def vertical_invert():
    global _layout, _adjuster, _states, _circs, _hists, _layout_file
    _adjuster = _vertical_inverter


# default layout of the viewer
def default():
    global _layout, _adjuster, _states, _circs, _hists, _layout_file
    # if the statevector and an image is to be rendered
    if len(_states) and (len(_hists) or len(_circs)):
        #state_path = abs_path(os.path.join(_config_dir,  "_state_.html"))
        msg = "\\[\\begin{matrix} "
        length = len(_states)
        for i, item in enumerate(list(_states)):
            if i == 0:
                msg += ("\\text{bits}")
                for j in range(len(_states[item])):
                    msg += f" & \\text{{call {j+1}}}"
                msg += "\\\\"
            if i < length - 1:
                msg+=(f"{item} & " + "&".join(_states[item]) + "\\\\")
            else:
                msg+=(f"{item} & " + "&".join(_states[item]))
        msg+="\\end{matrix}\\]"
        _layout["left"] = msg #f"<div data-include=\"{{URI}}{state_path}\"></div>"

        if len(_hists) and len(_circs):
            _layout["right"] = {"top" : image_list_to_str(_circs), "bottom" : image_list_to_str(_hists)}
        elif len(_hists):
            _layout["right"] = image_list_to_str(_hists)
        elif len(_circs):
            _layout["right"] = image_list_to_str(_circs)
    
    elif len(_states):
        #state_path = abs_path(os.path.join(_config_dir,  "_state_.html"))
        msg = "\\[\\begin{matrix} "
        length = len(_states)
        for i, item in enumerate(list(_states)):
            if i == 0:
                msg += ("\\text{bits}")
                for j in range(len(_states[item])):
                    msg += f" & \\text{{call {j+1}}}"
                msg += "\\\\"
            if i < length - 1:
                msg+=(f"{item} & " + "&".join(_states[item]) + "\\\\")
            else:
                msg+=(f"{item} & " + "&".join(_states[item]))
        msg+="\\end{matrix}\\]"
        _layout["only"] = msg #f"<div data-include=\"{{URI}}{state_path}\"></div>"

    elif len(_hists) or len(_circs):
        if len(_hists) and len(_circs):
            _layout["top"] = image_list_to_str(_circs)
            _layout["bottom"] = image_list_to_str(_hists)
        elif len(_hists):
            _layout["only"] = image_list_to_str(_hists)
        elif len(_circs):
            _layout["only"] = image_list_to_str(_circs)
    
    else:
        _layout["only"] = "<h1>No data to display</h1>"

def _run():
    global _layout, _adjuster, _states, _circs, _hists, _master_show
    if _master_show:
        # running the default layout generator
        default()
        _layout = _adjuster(_layout)

        print("unloading layout")
        with open(_layout_file, 'w') as f:
            f.write(json.dumps(_layout, indent=2))
        
        # clearing the values
        _adjuster = lambda layout : layout
        _layout = {}
        _states = []
        _circs = [] 
        _hists = []
    
        