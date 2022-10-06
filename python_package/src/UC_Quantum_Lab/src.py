from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector
import matplotlib.pyplot as plt
from math import log
import os

__config_dir__ = ".UC_Quantum_Lab"

def get_path(path:str):
    if __config_dir__ in os.listdir(): 
        if os.path.isdir(__config_dir__): return os.path.join(__config_dir__, path)
    else: return path


def display(circuit:QuantumCircuit, path:str=""):
    circuit.draw(output='mpl')
    plt.tight_layout()
    if not len(path): plt.savefig(get_path("_circ_.png"))
    else: plt.savefig(path)


def getbin(n, s=['']):
    if n > 0:
        return [
            *getbin(n - 1, [i + '0' for i in s]),
            *getbin(n - 1, [j + '1' for j in s])
        ]
    return s

 
def state(circuit:QuantumCircuit, show=True, path=""):
    _state = Statevector.from_instruction(circuit).data
    _num_bits = int(log(len(_state))/log(2))
    
    _options = getbin(_num_bits)
    to_return = {}
    if show:
        _f_path = "__state__.txt"
        if not len(path): _f_path = get_path(_f_path)

        with open(_f_path, 'w') as f:
            for ii, item in enumerate(_state):
                to_return[_options[ii]] = item
                item = str(item).replace("(", "").replace(")", "")
                f.write(f"{_options[ii]} : {item}\n")
    
    else:
        for ii, item in enumerate(_state):
            to_return[_options[ii]] = item
            item = str(item).replace("(", "").replace(")", "")

    return to_return