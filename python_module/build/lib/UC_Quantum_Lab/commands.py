from qiskit import QuantumCircuit, Aer, execute
from qiskit.quantum_info import Statevector
from qiskit.visualization import plot_histogram
import matplotlib.pyplot as plt
from math import log
from . import __states, __circs, __hists, get_path

__circ_count = 0
__state_count = 0
__hist_count = 0

# diplays the image in the viewer or saves the image to the inputted path
def display(circuit:QuantumCircuit, path:str=""):
    global __circ_count, __circs
    circuit.draw(output='mpl')
    plt.tight_layout()
    if len(path): plt.savefig(path)
    else:
        print("displaying circuit")
        p = get_path(f"__circ__{__circ_count}.png")
        plt.savefig(p)
        __circs.append(p)
        __circ_count+=1

# generates binary strings
def getbin(n, s=['']):
    global __config
    if n > 0: return [*getbin(n - 1, [i + '0' for i in s]), *getbin(n - 1, [j + '1' for j in s])]
    return s

# displays the statevector of the circuit and can return it
def state(circuit:QuantumCircuit, show=True):
    global __state_count, __states
    _state = Statevector.from_instruction(circuit).data
    _num_bits = int(log(len(_state))/log(2))
    
    _options = getbin(_num_bits)
    _data = {}
    for i in range(len(_state)):
        val = _state[i]
        if type(val) == complex:
            val = round(val.real, 10) + round(val.imag, 10) *1j
        else:
            val = round(val, 10)
        _data[_options[i]] = str(val).replace("(", "").replace(")", "")

    if show:
        print("showing state vector")
        if len(__states):
            if len(_options[i]) > len(list(__states.keys())[0]):
                raise KeyError("States must be obtained from the same circuit")
            for item in _data:
                __states[item].append(_data[item])
        else:
            for item in _data:
                __states[item] = [_data[item]]

    return _state

# displays the histogram of the circuit after execution in the viewer
def counts(circuit:QuantumCircuit, backend=Aer.get_backend('qasm_simulator'), show=True):
    global __hist_count, __hists
    counts = execute(circuit, backend=backend, shots=1024).result().get_counts()
    if show:
        print("displaying histogram")
        plot_histogram(counts)
        p = get_path(f"__hist__{__hist_count}.png")
        plt.savefig(p)
        __hists.append(p)
        __hist_count+=1
    return counts


