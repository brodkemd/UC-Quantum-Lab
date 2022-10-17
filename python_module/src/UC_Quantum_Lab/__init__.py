import os 
__config_dir = ".UCQ_config"
__layout_file = os.path.join(__config_dir, "layout.json")
__states = {}
__circs = []
__hists = []

#from .commands import display, state, __exit, __load
from atexit import register

def __trigger():
    print("triggering")
    trigger_file = ".trigger"
    if __config_dir in os.listdir():
        with open(os.path.join(__config_dir, trigger_file), 'w'): pass

def get_path(path:str):
    global __config
    if __config_dir in os.listdir(): 
        if os.path.isdir(__config_dir): return os.path.join(__config_dir, path)
    else: return path

def __exit():
    print("here")
    from .layout import __run
    __run()
    __trigger()

register(__exit)