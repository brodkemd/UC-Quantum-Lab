import matplotlib.pyplot as plt
from atexit import register
import os 

_config_dir = ".UCQ_config"
_layout_file = os.path.join(_config_dir, "layout.json")
_trigger_file = ".trigger"
_master_show = False
_show_plt = False
_states = {}
_circs = []
_hists = []

# class Views:
#     def __init__(self) -> None:
#         from .commands import display, state, counts
#         self.display = display
#         self.counts = counts
#         self.state = state

"""
Creates a file that triggers the vscode extension

"""
def _trigger():
    global _config_dir, _trigger_file
    print("triggering")
    if _config_dir in os.listdir():
        with open(os.path.join(_config_dir, _trigger_file), 'w'): pass

"""
prepends inputted path with the config directory if it exists

"""
def get_path(path:str):
    global _config_dir
    if _config_dir in os.listdir(): 
        if os.path.isdir(_config_dir): return os.path.join(_config_dir, path)
    else: return path

"""
Function to execute on exit of python

"""
def _exit():
    from .config import _show_plt, _master_show
    print(_show_plt)
    if _master_show:
        print("here")
        from .Layout.layout import _run
        _run()
        _trigger()

    if _show_plt: plt.show()

register(_exit)


# cleans up the config directory on init of this python module
from .config import _config_dir, _trigger_file, _master_show
if _config_dir in os.listdir():
    _master_show = True
    print("cleaning up config dir")
    for item in os.listdir(_config_dir):
        # deletes png html or the trigger file from the config dir
        if item.endswith(".png") or item.endswith(".html") or item == _trigger_file:
            os.remove(os.path.join(_config_dir, item))