from qiskit import QuantumCircuit, Aer, execute
from qiskit.quantum_info import Statevector
from qiskit.visualization import plot_histogram
import matplotlib.pyplot as plt
from math import log
import os, json


__config_dir = ".UCQ_config"
__config = {}

__circ_key = "show_circ"
__hist_key = "show_histogram"
__state_key = "show_state_vector"
__circ_file = "__circ__.png"
__hist_file = "__hist__.png"
__state_file = "__state__.txt"


def __save():
    global __config
    print("saving:", __config)
    if __config_dir in os.listdir():
        with open(os.path.join(__config_dir, "config.json"), 'w') as f:
            f.write(json.dumps(__config, indent=4))
        print("saved to config")

def __trigger():
    global __config
    print("triggering")
    trigger_file = ".trigger"
    if __config_dir in os.listdir():
        with open(os.path.join(__config_dir, trigger_file), 'w'): pass


def __load():
    global __config
    print("loading")
    if __config_dir in os.listdir():
        with open(os.path.join(__config_dir, "config.json"), 'r') as f:
            __config = json.loads(f.read())
        
        for item in __config:
            if isinstance(__config[item], bool):
                __config[item] = False

    print("Config:", __config)

def __exit():
    global __config
    # cleaning up files
    try:
        if not __config[__circ_key]:
            print("trying to remove", os.path.join(__config_dir, __circ_file))
            if os.path.exists(os.path.join(__config_dir, __circ_file)):
                os.remove(os.path.join(__config_dir, __circ_file))
                print("removed", os.path.join(__config_dir, __circ_file))
    except KeyError: pass
    
    try:
        if not __config[__hist_key]:
            print("trying to remove", os.path.join(__config_dir, __hist_file))
            if os.path.exists(os.path.join(__config_dir, __hist_file)):
                os.remove(os.path.join(__config_dir, __hist_file))
                print("removed", os.path.join(__config_dir, __hist_file))
    except KeyError: pass

    try:
        if not __config[__state_key]:
            print("trying to remove", os.path.join(__config_dir, __state_file))
            if os.path.exists(os.path.join(__config_dir, __state_file)):
                os.remove(os.path.join(__config_dir, __state_file))
                print("removed", os.path.join(__config_dir, __state_file))
    except KeyError: pass
    
    __save()
    __trigger()

def get_path(path:str):
    global __config
    if __config_dir in os.listdir(): 
        if os.path.isdir(__config_dir): return os.path.join(__config_dir, path)
    else: return path


def display(circuit:QuantumCircuit, path:str=""):
    global __config
    circuit.draw(output='mpl')
    plt.tight_layout()
    if len(path): plt.savefig(path)
    else:
        __config["show_circ"] = True
        plt.savefig(get_path("__circ__.png"))
    
    print("Display:", __config)


def getbin(n, s=['']):
    global __config
    if n > 0:
        return [
            *getbin(n - 1, [i + '0' for i in s]),
            *getbin(n - 1, [j + '1' for j in s])
        ]
    return s

 
def state(circuit:QuantumCircuit, show=True):
    global __config
    _state = Statevector.from_instruction(circuit).data
    _num_bits = int(log(len(_state))/log(2))
    
    _options = getbin(_num_bits)
    to_return = {}
    for i in range(len(_state)): to_return[_options[i]] = str(_state[i]).replace("(", "").replace(")", "")

    del _state
    if show:
        _f_path = get_path("__state__.txt")
        with open(_f_path, 'w') as f:
            for item in to_return:
                f.write(f"{item}:{to_return[item]}\n")
        
        __config["show_state_vector"] = True
    print("State:", __config)
    return to_return

def counts(circuit:QuantumCircuit, backend=Aer.get_backend('qasm_simulator'), show=True):
    global __config
    counts = execute(circuit, backend=backend, shots=1024).result().get_counts()
    if show:
        plot_histogram(counts)
        plt.savefig(get_path("__hist__.png"))
        __config["show_histogram"] = True
    print("hist:", __config)
    return counts


