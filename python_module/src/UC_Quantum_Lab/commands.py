from qiskit import QuantumCircuit, Aer, execute
from qiskit.quantum_info import Statevector
from qiskit.visualization import plot_histogram
import matplotlib.pyplot as plt
from math import log
from . import __states, __circs, __hists, get_path

__circ_count = 0
__state_count = 0
__hist_count = 0

def display(circuit:QuantumCircuit, path:str=""):
    global __circ_count
    circuit.draw(output='mpl')
    plt.tight_layout()
    if len(path): plt.savefig(path)
    else:
        p = get_path(f"__circ__{__circ_count}.png")
        plt.savefig(p)
        __circs.append(p)
        __circ_count+=1


def getbin(n, s=['']):
    global __config
    if n > 0: return [*getbin(n - 1, [i + '0' for i in s]), *getbin(n - 1, [j + '1' for j in s])]
    return s

 
def state(circuit:QuantumCircuit, show=True):
    global __state_count
    _state = Statevector.from_instruction(circuit).data
    _num_bits = int(log(len(_state))/log(2))
    
    _options = getbin(_num_bits)
    to_return = {}
    for i in range(len(_state)):
        to_return[_options[i]] = str(_state[i]).replace("(", "").replace(")", "")

    del _state
    if show:
        if len(__states):
            if len(_options[i]) > len(list(__states.keys())[0]):
                raise KeyError("States must be obtained from the same circuit")
            for item in to_return:
                __states[item].append(to_return[item])
        else:
            for item in to_return:
                __states[item] = [to_return[item]]

    return to_return

def counts(circuit:QuantumCircuit, backend=Aer.get_backend('qasm_simulator'), show=True):
    global __hist_count
    counts = execute(circuit, backend=backend, shots=1024).result().get_counts()
    if show:
        plot_histogram(counts)
        p = get_path(f"__hist__{__hist_count}.png")
        plt.savefig(p)
        __hists.append(p)
        __hist_count+=1
    return counts


