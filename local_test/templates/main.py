from UC_Quantum_Lab import state, display
from qiskit import QuantumCircuit

qc = QuantumCircuit(1, 1)
qc.h(0)
state(qc)
qc.measure_all()
display(qc)