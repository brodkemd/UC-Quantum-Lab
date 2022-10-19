from UC_Quantum_Lab.commands import state, display, counts
from UC_Quantum_Lab.layout import invert, horizontal_invert, vertical_invert
from qiskit import QuantumCircuit

qc = QuantumCircuit(1, 1)
qc.h(0)
state(qc)
qc.measure_all()
display(qc)