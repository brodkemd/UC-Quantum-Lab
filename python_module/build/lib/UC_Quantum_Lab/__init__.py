from atexit import register
import os 

__config_dir = ".UCQ_config"
__layout_file = os.path.join(__config_dir, "layout.json")
__trigger_file = ".trigger"
__states = {}
__circs = []
__hists = []

"""
Creates a file that triggers the vscode extension

"""
def __trigger():
    global __trigger_file
    print("triggering")
    if __config_dir in os.listdir():
        with open(os.path.join(__config_dir, __trigger_file), 'w'): pass

"""
prepends inputted path with the config directory if it exists

"""
def get_path(path:str):
    global __config
    if __config_dir in os.listdir(): 
        if os.path.isdir(__config_dir): return os.path.join(__config_dir, path)
    else: return path

"""
Function to execute on exit of python

"""
def __exit():
    print("here")
    from .layout import __run
    __run()
    __trigger()


# cleans up the config directory on init of this python module
if __config_dir in os.listdir():
    print("cleaning up config dir")
    register(__exit)
    for item in os.listdir(__config_dir):
        # deletes png html or the trigger file from the config dir
        if item.endswith(".png") or item.endswith(".html") or item == __trigger_file:
            os.remove(os.path.join(__config_dir, item))
else: print(f"config dir {__config_dir} not in cur dir")