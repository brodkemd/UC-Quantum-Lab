from .src import display, state, __exit, __load
from atexit import register
__load()
register(__exit)