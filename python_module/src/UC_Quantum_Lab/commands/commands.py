from qiskit import QuantumCircuit, Aer, execute
from qiskit.quantum_info import Statevector
from qiskit.visualization import plot_histogram
import matplotlib.pyplot as plt
from math import log
from ..config import _states, _circs, _hists, _master_show, _show_plt
from .. import get_path

_circ_count = 0
_state_count = 0
_hist_count = 0

# diplays the image in the viewer or saves the image to the inputted path
def display(circuit:QuantumCircuit, path:str=""):
    global _circ_count, _circs, _master_show, _show_plt
    circuit.draw(output='mpl')
    plt.tight_layout()
    if len(path): plt.savefig(path)
    elif _master_show:
        print("displaying circuit")
        p = get_path(f"_circ_{_circ_count}.png")
        plt.savefig(p)
        _circs.append(p)
        _circ_count+=1
    else: 
        print("setting plt")
        _show_plt = True
        print(_show_plt)

# generates binary strings
def getbin(n, s=['']):
    global _config
    if n > 0: return [*getbin(n - 1, [i + '0' for i in s]), *getbin(n - 1, [j + '1' for j in s])]
    return s

# displays the statevector of the circuit and can return it
def state(circuit:QuantumCircuit, show=True):
    global _state_count, _states, _master_show, _show_plt
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

    if show and _master_show:
        print("showing state vector")
        if len(_states):
            if len(_options[i]) > len(list(_states.keys())[0]):
                raise KeyError("States must be obtained from the same circuit")
            for item in _data:
                _states[item].append(_data[item])
        else:
            for item in _data:
                _states[item] = [_data[item]]

    return _state

# displays the histogram of the circuit after execution in the viewer
def counts(circuit:QuantumCircuit, backend=Aer.get_backend('qasm_simulator'), path:str=""):
    global _hist_count, _hists, _master_show, _show_plt
    counts = execute(circuit, backend=backend, shots=1024).result().get_counts()
    if len(path): plt.savefig(path)
    elif _master_show:
        print("displaying histogram")
        plot_histogram(counts)
        p = get_path(f"_hist_{_hist_count}.png")
        plt.savefig(p)
        _hists.append(p)
        _hist_count+=1
    else:
        print("setting plt")
        _show_plt = True
        print(_show_plt)
    return counts


