import os 

__config_dir = ".UCQ_config"
__layout_file = os.path.join(__config_dir, "layout.json")
__states = {}
__circs = []
__hists = []

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


if __config_dir in os.listdir():
    register(__exit)
    for item in os.listdir(__config_dir):
        if item.endswith(".png") or item.endswith(".html"):
            os.remove(os.path.join(__config_dir, item))
else:
    print(f"config dir {__config_dir} not in cur dir")