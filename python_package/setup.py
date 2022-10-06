from setuptools import setup
setup(
    name='UC_Quantum_Lab',
    version='0.0.1',
    author='Marek Brodke with support from the University of Cincinnati',
    description='Provides functionaliy for UC_Quantum_Lab',
    keywords='development',
    python_requires='>=3.7, <4',
    license="",
    install_requires=[
        'qiskit>=0.36',
        'matplotlib>=2.2.0',
        'qiskit-aer>=0.10.4',
        'qiskit-ibmq-provider>=0.19.1',
        'qiskit-ignis>=0.7.0',
        'qiskit-terra==0.20.1'
    ]
)