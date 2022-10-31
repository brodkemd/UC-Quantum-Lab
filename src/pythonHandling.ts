import * as vscode from "vscode";
import * as fs from "fs";
import { Config } from "./config";
import { checkIfCondaInstalled, getCondaEnvs } from "./condaHandling";
import { print, error, tryCommand, getOutputOfCommand, info, semmanticVersionToNum, InfoType, getVersionStringFrom } from "./src";
import { exit } from "process";
/**
 * Installs the inputted python module with the inputted pip
 * @param pip : pip exe
 * @param module : python module to install
 * @returns a bool indicating if the install suceeded
 */
 export async function pipInstall(pip:string, module:string):Promise<boolean> {
    return await tryCommand(`${pip} install --quiet ${module}`);
}

/**
 * Updates the inputted python module using the inputted pip
 * @param pip : pip exe
 * @param module : python module to update
 * @returns a bool indicating if the update succeeded
 */
 export async function pipUpdate(pip:string, module:string):Promise<boolean> {
    return await tryCommand(`${pip} install --quiet --upgrade ${module}`);
}

/**
 * Gets the current version of the inputted module from pip
 * @param pip : string path to pip executable
 * @param module : string name of module to check
 * @returns current version of the provided module
 */
 export async function getVersionOfPythonModuleWithName(pip:string, module:string):Promise<string> {
    // parsing the output and getting the version
    return await getVersionStringFrom(await getOutputOfCommand(`${pip} show ${module}`));
}

/**
 * Verifies the current configuration of python to be used with this extension
 * @param config : configuration of the extension
 * @returns boolean indicating whether or not this function extension exceeded
 */
export async function verifyPython(config:Config) {
	// if importing the python module in python succeeds
	if (await tryCommand(`${config.userConfig.python} -c "import ${config.pythonModuleName}"`)) {
		// getting the version from the installed package and if it is not the current version, then update it
		if (await semmanticVersionToNum((await getVersionOfPythonModuleWithName(config.userConfig.pip, config.pythonModulePyPi))) 
			< await semmanticVersionToNum(config.minPythonModVer)) {
			// informing the user
			info(`Updating "${config.pythonModuleName}" for "${config.userConfig.python}" from ${(await getVersionOfPythonModuleWithName(config.userConfig.pip, config.pythonModulePyPi))} to ${config.minPythonModVer}`);
			if (await pipUpdate(config.userConfig.pip , config.pythonModulePyPi)) {
				info("done");
			} else {
				error(`error updating "${config.pythonModuleName}" for "${config.userConfig.python}"`);
			}
		// if the package is already the right version
		} else { print(`"${config.pythonModuleName}" is already there for "${config.userConfig.python}" and of the right version, do not need to install`); }
	// if importing the python module in python did not succeed
	} else {
		info(`Setting up "${config.pythonModuleName}" for "${config.userConfig.python}"`);
		// trying to install the python module, if it succeeds tell the user, if it does not tell the user
		// might need to use this flag at some point "--use-feature=in-tree-build"
		if (await pipInstall(config.userConfig.pip, config.pythonModulePyPi)) {
			info("done");
		} else {
			error(`error setting up "${config.pythonModuleName}" for "${config.userConfig.python}"`);
		}
	}
}

/**
 * Sets up python for this extension
 * @param config : configuration of the extension
 * @returns boolean indicating whether or not this function extension exceeded
 */
export async function setupPython(config:Config) {
    if (!(fs.existsSync(config.pythonRegistryFile))) {
        error(`python interpreter registry file "${config.pythonRegistryFile}" does not exist`);
    }
    let out = JSON.parse(await fs.promises.readFile(config.pythonRegistryFile, "utf8"));
    if (out.pythons !== undefined) {
        let pythons:string[] = out.pythons;
        let enterInterpreter = "+ Enter Interpreter Path";
        let registerNewInterpreter = "+ Register Interpreter";
        let arr:vscode.QuickPickItem[] = [];
        arr.push({
            label:enterInterpreter
        });
        arr.push({
            label:registerNewInterpreter
        });
        for (let python in out.pythons) {
            // if qiskit is installed in an environment show it in the array, look and vscode api reference for this format
            if (fs.existsSync(python)) {
                if (await tryCommand(`${python} -c "import qiskit"`)) {
                    arr.push({
                        label: python,
                        description: "suggested"
                        //detail : `located at "${dict[key]["path"]}"`
                    });
                } else {
                    arr.push({
                        label: python
                        //description: "suggested"
                        //detail : `located at "${dict[key]["path"]}"`
                    });
                }
            }
        }

        let result:vscode.QuickPickItem|undefined = await vscode.window.showQuickPick(
                                                            arr, 
                                                            {
                                                                placeHolder: 'choose the python interpreter that you want to use from the list', 
                                                                title:"Choose python interpreter"
                                                            }
                                                        );
        if (result !== undefined) {
            if (result.label === enterInterpreter) {
                let interpreter:string|undefined = await vscode.window.showInputBox({placeHolder : "enter interpreter path"});
                print(`interpreter: ${interpreter}`);
                if (interpreter !== undefined) {
                    if (fs.existsSync(interpreter)) {
                        config.userConfig.python = interpreter;
                    } else {
                        error("inputted interpreter path is not valid");
                    }
                } else {
                    error("must enter an interpreter path");
                }
            } else if (result.label === registerNewInterpreter) {
                await vscode.window.showInformationMessage(`see the project repo README for guide on registering a python interpreter, at https://github.com/UC-Advanced-Research-Computing/UC-Quantum-Lab`);
                exit(0);
                // if (interpreter !== undefined) {
                //     if (fs.existsSync(interpreter)) {
                //         config.userConfig.python = interpreter;
                //     }
                // } else {
                //     error("must enter an interpreter path");
                // }
            } else {
                config.userConfig.python = result.label;
            }
        } else {
            error("can not run extension without specifying which python to use");
        }
    } else {
        print("Error: registry file is not valid");
    }
}

/**
 * 
 * DEPRICATED, SWITCHED TO EASY TO DEVELOP WAY OF HANDLING PYTHON
 * 
 */

/**
 * Sets up python for this extension
 * @param config : configuration of the extension
 * @returns boolean indicating whether or not this function extension exceeded
 */
// export async function setupPython(config:Config) {
//     // if conda is installed
//     if (await checkIfCondaInstalled()){
// 		print("detected conda");

// 		// asking the user if they want to use this extension with conda (hopefully they do)
// 		let choice:string|undefined = await vscode.window.showInformationMessage(`Detected conda, do you want to use it with this extension (this is the recommend method)?`, config.yes, config.no);
        
// 		// if they choose to setup python for conda
//         if (choice === config.yes) {
// 			print("setting up for conda");
// 			// loading the available conda environments
//             info("Loading conda envs, you will see a prompt at the top of the window soon");
//             let dict:InfoType  = await getCondaEnvs();
            
// 			// creating an array of the available environments to display to the user
//             let arr:vscode.QuickPickItem[] = [];
//             for (let key in dict) {
// 				// if qiskit is installed in an environment show it in the array, look and vscode api reference for this format
//                 if (dict[key]["hasQiskit"]) {
// 					arr.push({
// 						label: key,
// 						description: "suggested",
// 						detail : `located at "${dict[key]["path"]}"`
// 					});
// 				} else {
// 					arr.push({
// 						label: key,
// 						detail : `located at "${dict[key]["path"]}"`
// 					});
// 				}
//             }
// 			if (!(arr.length)) {
// 				error("no conda envs available, please make one, there are many resources online if you need help with this");
// 			}

// 			// creating drop down for the user to select their environment from
// 			let result:vscode.QuickPickItem|undefined = await vscode.window.showQuickPick(arr, {placeHolder: 'choose the conda environment from the list', title:"Choose conda Environment"});
			
// 			// if they chose something from the previously made list
// 			if (result !== undefined) {
// 				// getting the name of the environment from their selection
// 				//result = result.slice(0, result.indexOf(" "));
// 				print(`Setting up conda envrionment: "${result}"`);

// 				// loading the python and pip paths from the dictionary holding the information
// 				config.userConfig.python = dict[result.label]["exe"];
// 				config.userConfig.pip = dict[result.label]["pip"];
				
// 				// checking if the python and pip paths are valid
// 				await verifyPython(config);
// 			} else { 
// 				// if the user chose nothing, this is not ok
// 				error("invalid selection for conda env");
// 			}
// 		// if the user does not want to use conda
//         } else if (choice === config.no) {
// 			print("setting up for system python");
// 			// setting this extension up to use system python
// 			await setupSysPython(config);

// 		// if the user did not choose anything
// 		}  else {
// 			// this is no good	
// 			error("invalid choice for python setup");
// 		}
// 	// if here then did not detect conda
//     } else {
// 		print("did not detect conda");
// 		// prompting the user if they want to continue with system python install and 
// 		// tells them where they can get conda if they would rather use that
//         let opt:string|undefined = await vscode.window.showInformationMessage("Did not detect anaconda, continue with a system python install? (this is not recommended)", config.yes, config.no);
        
// 		// if they want to continue to a system install
// 		if (opt === config.yes) {
// 			// setting this extension up to use system python
// 			await setupSysPython(config);
// 		// if the user did not choose anything
//         } else if (opt === config.no) {
// 			await vscode.window.showInformationMessage("Go to https://docs.anaconda.com/anaconda/install/index.html for a guide to install anaconda");
// 			error("Run this extension again after you get anaconda installed");
// 		} else {
// 			error("invalid choice for python setup");
// 		}
//     }
// }


// /**
//  * Sets up system python for this extension and returns if it was sucessful or not as a boolean
//  * @param config : current configuration of the extension
//  * @returns boolean indicating if there was successful setup of system python for this extension
//  */
// export async function setupSysPython(config:Config) {
//     print("Setting up for sys python");
//     // if python is installed
//     let version:string = "";
//     let output:string = "";
//     if (!(await tryCommand("python3 --version")) && !(await tryCommand("python --version"))) {
//         // no
//         info("Python was not detected on your system, please install it");
//     } else {
//         // yes
//         // getting the python command
//         if (await tryCommand("python --version")) {
//             config.userConfig.python = "python";
//             // extracting the python version and making sure it is an allowed version of python
//             output = await getOutputOfCommand(`${config.userConfig.python} --version`);
//             version = output.slice(output.search(/[0-9]/), output.length).trim();
//             if (version.length) {
//                 // if the "python" command provided the wrong versin of python
//                 if ((await semmanticVersionToNum(version)) < (await semmanticVersionToNum(config.minPythonVer))) {
//                     config.userConfig.python = "python3";
//                     // extracting the python version and making sure it is an allowed version of python
//                     output = await getOutputOfCommand(`${config.userConfig.python} --version`);
//                     version = output.slice(output.search(/[0-9]/), output.length).trim();
//                     if (version.length) {
//                         if ((await semmanticVersionToNum(version)) < (await semmanticVersionToNum(config.minPythonVer))) {
//                             error("Your system python is too old for this extension, you need to update it");
//                         }
//                     } else {
//                         error("could not detect python version, trying installing python");
//                     }
//                 }
//             }
//         } else {
//             config.userConfig.python = "python3";
//             // extracting the python version and making sure it is an allowed version of python
//             output = await getOutputOfCommand(`${config.userConfig.python} --version`);
//             version = output.slice(output.search(/[0-9]/), output.length).trim();
//             if (version.length) {
//                 if ((await semmanticVersionToNum(version)) < (await semmanticVersionToNum(config.minPythonVer))) {
//                     error("Your system python is too old for this extension, you need to update it");
//                 }
//             }
//         }

//         // if pip is installed
//         if (!(await tryCommand(`${config.userConfig.python} -m pip --version`)) && !(await tryCommand("${config.userConfig.python} -m pip3 --version"))) {
//             // no
//             error("python pip was not detected on your system, please install it");
//         } else {
//             /**
//              * If the proper version of python is installed then the proper version of pip is probably installed, so do need to check
//              */
//             if (await tryCommand(`${config.userConfig.python} -m pip --version`)) {
//                 config.userConfig.pip = `${config.userConfig.python} -m pip`;
//             } else {
//                 if (await tryCommand(`${config.userConfig.python} -m pip3 --version`)) {
//                     config.userConfig.pip = `${config.userConfig.python} -m pip3`;
//                 } else {
//                     error("pip is not installed");
//                 }
//             }
//             // makes sure python is good
//             await verifyPython(config);
//         }
//     }
// }