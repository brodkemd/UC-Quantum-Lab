# for showing info in the viewer
from UC_Quantum_Lab import state, display, counts
# for changing how data is formatted in the viewer
from UC_Quantum_Lab import invert, horizontal_invert, vertical_invert, custom

# the quantum computing package
from qiskit import QuantumCircuit

# a simple circuit
qc = QuantumCircuit(6, 6)
# displaying the statevector at this point in the circuit
state(qc)

# applying a simple gate to make the circuit interesting
qc.h(0)

# displaying the statevector at this point in the circuit
state(qc)

# measuring all of the qubits
qc.measure_all()

# displaying the circuit diagram
display(qc)

# displaying the histogram counts for this circuit
counts(qc)