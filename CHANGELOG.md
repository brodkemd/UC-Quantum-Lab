# Changelog
## [0.1.3] - 2023-1-17
- removed pip functionality
- updated example python file
- increased iteration limit on html formatter, so a user has capabilities
- updated README

## [0.1.2] - 2022-11-4
- increased python module minimum version to "0.1.11" (has bug fixes required)
- fixed bug with viewer not being able to scroll with only images on it.
- fixed bug with the viewer updating

## [0.1.1] - 2022-11-1
- increased python module minimum version to "0.1.10" (has bug fixes required)
- increased python minimum version to "3.8.0"

## [0.1.0] - 2022-11-1
### Notes to user
- If you have ".trigger" or "config.json" in the extension directory ".UCQ_config", you can delete them. This extension will delete them as well.

### Added
- improved config directory handling
- improved viewer updating
- improved info messages and created loading status objects in the status bar
- Python api from vscode, this now handles all communication with python

### Removed
- all original code that communicated to python, this is now done by the python extension and api for vscode

### Changed
- increased lowest python version library version allowed to 0.1.9 (there were required features added)
- improved documentation in the README and in the HTMLDOCS files

## [0.0.7] - 2022-10-28
### Added
- improved config directory handling
- increased lowest python version library version allowed to 0.1.8 (there were required features added)
- improved viewer updating

## [0.0.6] - 2022-10-27
### Added
- improvements to the README
- increased lowest python version library version allowed to 0.1.6
- migrated repos, modified python package name

## [0.0.5] - 2022-10-26
### Added
- improvements to the UX and UI, mostly with regard to system python setup
- improved error and information messages
- auto open the example main file and viewer if the user chooses to have that file
- fixed a bug with windows system python setup
### Changed
- ts file layout and import structure in an effort to the code cleaner

### Removed 
- cleanup lines of code 

## [0.0.4] - 2022-10-26
### Added
- improvements to the UX and UI, mostly with regard to anaconda
- improved version detection of python package
- improved error and information messages
- improved marketplace representation in package.json (added logo and some other stuff)

## [0.0.3] - 2022-10-26
### Added
- pipInstall, pipUpdate commands added to src
- saves active file when "execute" command is run
- will auto update python package
- a bunch of small bug fixes
### Removed
- many redundant lines of code

## [0.0.2] - 2022-10-25
### Added
- Correct file structure to install path
### Removed
- unnecessary js files

## [0.0.1] - 2022-10-24
### Added
- Cross platform capability with Windows and Linux, have not tested mac os yet
### Changed
- how python is setup in the extension, made play nicer with windows system python and also windows anaconda pip
### Removed
- python module from this extension, it is now in a separate repo at https://github.com/brodkemd/UCQ_tools
