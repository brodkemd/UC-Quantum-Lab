from UC_Quantum_Lab.commands import state, display, counts
from UC_Quantum_Lab.layout import invert, horizontal_invert, vertical_invert
from qiskit import QuantumCircuit

qc = QuantumCircuit(6, 6)
state(qc)
qc.h(0)
state(qc)
qc.measure_all()
display(qc)
counts(qc)