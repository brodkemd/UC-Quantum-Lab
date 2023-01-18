/*
Deprecated

*/

// import * as vscode from "vscode";
// //import * as fs from "fs";
// import { Config } from "./config";
// import { print, error, tryCommand, getOutputOfCommand, semanticVersionToNum, getVersionStringFrom } from "./src";

// /**
//  * Installs the inputted python module with the inputted pip
//  * @param pip : pip exe
//  * @param module : python module to install
//  * @returns a bool indicating if the install succeeded
//  */
// async function pipInstall(pip:string, module:string):Promise<boolean> {
//     return await tryCommand(`${pip} install --disable-pip-version-check --no-warn-script-location --quiet ${module}`);
// }

// /**
//  * Updates the inputted python module using the inputted pip
//  * @param pip : pip exe
//  * @param module : python module to update
//  * @returns a bool indicating if the update succeeded
//  */
// async function pipUpdate(pip:string, module:string):Promise<boolean> {
//     return await tryCommand(`${pip} install --quiet --no-warn-script-location --disable-pip-version-check --upgrade ${module}`);
// }

// /**
//  * Gets the current version of the inputted module from pip
//  * @param pip : string path to pip executable
//  * @param module : string name of module to check
//  * @returns current version of the provided module
//  */
// async function getVersionOfPyMod(pip:string, module:string):Promise<string> {
//     // parsing the output and getting the version
//     return await getVersionStringFrom(await getOutputOfCommand(`${pip} show --disable-pip-version-check ${module}`));
// }

// /**
//  * Verifies the current configuration of python to be used with this extension
//  * @param config : configuration of the extension
//  * @returns boolean indicating whether or not this function extension exceeded
//  */
// export async function verifyPython(config:Config) {
//     // some checks to make sure python was set right
//     if (config.userConfig.python === undefined || !(config.userConfig.python.length)) {
//         error("python was not found, please set it in the lower right corner");
//     }
    
//     // maybe implement this someday
//     // if (!(await tryCommand(config.userConfig.python)) && !(fs.existsSync(config.userConfig.python))) {
//     //     error("Invalid python interpreter chosen");
//     // }

// 	// if importing the python module in python succeeds
// 	if (await tryCommand(`${config.userConfig.python} -c "import ${config.pythonModuleName}"`)) {
// 		// getting the version from the installed package and if it is not the current version, then update it
// 		if (await semanticVersionToNum((await getVersionOfPyMod(config.userConfig.pip, config.pythonModulePyPi))) 
// 			< await semanticVersionToNum(config.minPythonModVer)) {
// 			// informing the user
//             print(`Updating "${config.pythonModuleName}" for "${config.userConfig.python}" from ${(await getVersionOfPyMod(config.userConfig.pip, config.pythonModulePyPi))} to ${config.minPythonModVer}`);

//             // setting up the package, using a loading icon in the status bar (it is simple and clean)
//             vscode.window.withProgress({
//                 location: vscode.ProgressLocation.Window,
//                 cancellable: false,
//                 title: `Updating "${config.pythonModuleName}" from ${(await getVersionOfPyMod(config.userConfig.pip, config.pythonModulePyPi))} to ${config.minPythonModVer}`
//             }, async (progress) => {
//                 progress.report({  increment: 0 });
//                 // updating the python module with pip
//                 if (!(await pipUpdate(config.userConfig.pip , config.pythonModulePyPi))) {
//                     error(`error updating "${config.pythonModuleName}" for "${config.userConfig.python}"`);
//                 }
//                 progress.report({ increment: 100 });
//             });
// 		// if the package is already the right version
// 		} else { print(`"${config.pythonModuleName}" is already there for "${config.userConfig.python}" and of the right version, do not need to install`); }
// 	// if importing the python module in python did not succeed
// 	} else {
//         let choice:string|undefined = await vscode.window.showInformationMessage(`Do you want to setup the python interpreter "${config.userConfig.python}"`, config.yes, config.no);
//         // if they agreed to the previous message
//         if (choice === config.yes) {
//             print(`Setting up "${config.pythonModuleName}" for "${config.userConfig.python}"`);
//             // setting up the package, using a loading icon in the status bar (it is simple and clean)
//             vscode.window.withProgress({
//                 location: vscode.ProgressLocation.Window,
//                 cancellable: false,
//                 title: `Setting up "${config.userConfig.python}"`
//             }, async (progress) => {
//                 progress.report({  increment: 0 });
//                 // trying to install the python module, if it succeeds tell the user, if it does not tell the user
//                 // might need to use this flag at some point "--use-feature=in-tree-build"
//                 if (!(await pipInstall(config.userConfig.pip, config.pythonModulePyPi))) {
//                     error(`error setting up "${config.pythonModuleName}" for "${config.userConfig.python}"`);
//                 }
//                 progress.report({ increment: 100 });
//             });
//         } else if (choice === undefined) {
//             // the user can not choose nothing
//             error("Invalid choice for setup of python interpreter");
//             return;
//         }
// 	}
// }