// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
/** known Isssues:
 * Possible overlap with file that has the same name as config_dir
 * 
 */
import * as vscode from 'vscode';
import { UCQ } from './panel';
import * as src from "./src";
import * as path from 'path';
import * as fs from 'fs';
import { getConfig, Config } from "./config";
import {platform} from "process";

// because I am lazy, easy way to print to output tab in vscode
let print = src.print;

/**
 * Verifies the current configuration of python to be used with this extension
 * @param config : configuration of the extension
 * @returns boolean indicating whether or not this function extension exceeded
 */
async function verifyPython(config:Config) {
	print("verifying python setup");
	// if importing the python module in python succeeds
	if (await src.tryCommand(`${config.userConfig.python} -c "import ${config.pythonModuleName}"`)) {
		// getting the version from the installed package and if it is not the current version, then update it
		if (await src.getVersionOfPythonModuleWithName(config.userConfig.pip, config.pythonModuleName) !== config.curPythonModVer) {
			// informing the user
			print(`Setting up ${config.pythonModuleName} for ${config.userConfig.python}`);
			vscode.window.showInformationMessage(`Setting up the python module ${config.pythonModuleName}`);
			
			// try installing the python module with pip, if it succeeds tell the user and if not tell the user
			// it did not
			if (await src.tryCommand(`${config.userConfig.pip} install ${config.pythonModulePyPi}`)) {
				vscode.window.showInformationMessage(`Successfully setup ${config.pythonModuleName}`);
				print(`Successfully setup ${config.pythonModuleName}`);
			}
			else {
				src.error(`error installing ${config.pythonModuleName} for ${config.userConfig.python}`);
			}
		// if the package is already the right version
		} else { print(`Package is already there for ${config.userConfig.python} and of the right version, do not need to install`); }
	// if importing the python module in python did not succeed
	} else {
		print(`Setting up ${config.pythonModuleName} for ${config.userConfig.python}`);
		
		// trying to install the python module, if it succeeds tell the user, if it does not tell the user
		// might need to use this flag at some point "--use-feature=in-tree-build"
		if (await src.tryCommand(`${config.userConfig.pip} install ${config.pythonModulePyPi}`)) {
			vscode.window.showInformationMessage(`Successfully setup ${config.pythonModuleName} for ${config.userConfig.python}`);
			print(`Successfully setup ${config.pythonModuleName} for ${config.userConfig.python}`);
		}
		else {
			src.error(`error setting up ${config.pythonModuleName} for ${config.userConfig.python}`);
		}
	}
}

/**
 * Sets up python for this extension
 * @param config : configuration of the extension
 * @returns boolean indicating whether or not this function extension exceeded
 */
async function setupPython(config:Config) {
    // if conda is installed
    if (await src.checkIfCondaInstalled()){
		print("detected conda");

		// asking the user if they want to use this extension with conda (hopefully they do)
		let choice:string|undefined = await vscode.window.showInformationMessage(`Detected conda, do you want to use it with this extension (this is the recommend method)?`, config.yes, config.no);
        
		// if they choose to setup python for conda
        if (choice === config.yes) {
			print("setting up for conda");
			// loading the available conda environments
            let dict:src.InfoType  = await src.getCondaEnvs();
            
			// creating a string array of the available environments to display to the user
            let arr:string[] = [];
            for (let key in dict) {
				// if qiskit is installed in an environment show it in the array
                if (dict[key]["hasQiskit"]) { arr.push(`${key} at ${dict[key]["path"]} (suggested)`); } 
				else { arr.push(`${key} at ${dict[key]["path"]}`); }
            }

			// creating drop down for the user to select their environment from
			let result:string|undefined = await vscode.window.showQuickPick(arr, {placeHolder: 'choose the conda environment from the list'});
			
			// if they chose something from the previously made list
			if (result !== undefined) {
				// getting the name of the environment from their selection
				result = result.slice(0, result.indexOf(" "));
				print(`Setting up conda envrionment ${result}`);

				// loading the python and pip paths from the dictionary holding the information
				config.userConfig.python = dict[result]["exe"];
				config.userConfig.pip = dict[result]["pip"];
				
				// checking if the python and pip paths are valid
				try {
					await verifyPython(config);
					
					// if they are valid saving the config to the config file
					config.userConfig.save();
				} catch ( e ){}
			} else { 
				// if the user chose nothing, this is not ok
				src.error("invalid selection for conda env");
			}
		// if the user does not want to use conda
        } else if (choice === config.no) {
			print("setting up for system python");
			// setting this extension up to use system python
			await src.setupSysPython(config);

			// if here then the steup succeeded, save the config to the config file
			config.userConfig.save();

		// if the user did not choose anything
		}  else {
			// this is no bueno	
			src.error("invalid choice for python setup");
		}
	// if here then did not detect conda
    } else {
		// prompting the user if they want to continue with system python install and 
		// tells them where they can get conda if they would rather use that
        let opt:string|undefined = await vscode.window.showInformationMessage("Did not detect anaconda on this system do you want to continue with a system python install (it would be better to use this extension with anaconda)\nIf not go to https://docs.anaconda.com/anaconda/install/index.html for a guide to install anaconda and press \"no\"", config.yes, config.no);
        
		// if they want to continue to a system install
		if (opt === config.yes) {
			// setting this extension up to use system python
			await src.setupSysPython(config);

			//if here then the setup succeeded, save the config to the config file
			config.userConfig.save();

		// if the user did not choose anything
        } else if (opt === undefined) {
			src.error("invalid choice for python setup");
		}
    }
}


/**
 * Initializes the workspace/current directory for this extension
 * @param config : configuration of the extension
 * @returns boolean indicating whether or not this function extension exceeded
 */
async function init(config:Config) {
 	print("Running \"init\"");
	
	// the config directory exists
	if (!(fs.existsSync(config.configDir))) {
		// setting up python if need be, if function returns true then the setup succeeded and vice versa
		await setupPython(config);

		// prompting the user if they want to make the config directory
		let choice:string|undefined = await vscode.window.showInformationMessage(`Do you want to initialize your current directory for this extension (will make the dir ${src.getLastFromPath(config.configDir)} here)`, config.yes, config.no);
		
		// if the user wants to make the config directory
		if (choice === config.yes) {
			// making the config directory, if making it returns false then it failed, so exit function
			await src.mkDir(config.configDir);
		} else {
			// can not operate without config directory
			src.error("User blocked config directory creation, can not execute without it");
		}
		// saving user config the config file in the config directory
		config.userConfig.save();

		try {
			await fs.promises.copyFile(config.templateLayoutFile, config.layoutFile);
		} catch ( e ) {
			src.error(`while trying to copy template layout file to config dir: ${(e as Error).message}`);
		}

		// getting the template main file name from the template main file path
		let fname = src.getLastFromPath(config.templatePythonFile);

		// if the main file is not in the current directory
		if (!(await src.checkIfFileInDir(config.workspacePath, fname))) {
			// prompting the user if they want an example main file
			let selection:string|undefined = await vscode.window.showInformationMessage(`Do you want an example main file?`, config.yes, config.no);
			
			// if they want a main file
			if (selection === config.yes) {
				print("Making main file");
				// copying template file to current directory, to_return to used to indicate if an error was encountered copying
				fs.copyFile(config.templatePythonFile, 
							path.join(config.workspacePath, fname), 
							(err) => {
					if (err){
						src.error(`Error copying ${config.templatePythonFile} to ${fname}`);
					}
				});
				// the copy file succeeded then open the file in the editor
				// if (to_return) {
				// 	// opening file in the editor
				// 	let documet:vscode.TextDocument|undefined = await vscode.workspace.openTextDocument(path.join(config.workspacePath, fname));

				// 	if (documet === undefined) {
				// 		// if the opening of the file failed let the user know
				// 		src.error(`could not open "${path.join(config.workspacePath, fname)} in code"`);
				// 	} else {
				// 		// if opening the file succeeded then run "execute"
				// 		await src.delay(1000);
				// 		vscode.commands.executeCommand("uc-quantum-lab.execute");
				// 	}
				// }

				// exiting the function returning the success status of the copy operation
			}

		}
		// the copy file succeeded then open the file in the editor
		// opening file in the editor
		// let documet:vscode.TextDocument|undefined = await vscode.workspace.openTextDocument(path.join(config.workspacePath, fname));
		// print("here")
		// if (documet === undefined) {
		// 	// if the opening of the file failed let the user know
		// 	src.error(`could not open "${path.join(config.workspacePath, fname)} in code"`);
		// } else {
		// 	// if opening the file succeeded then run "execute"
		// 	await src.delay(500);
		// 	vscode.commands.executeCommand("uc-quantum-lab.execute");
		// }
	
		// removed this because I did not think it is necessary
		// else {
			//src.error(`"${fname}" is in your current directory and is not a directory please delete it from the current directory`);
		//}
		// if setting up python failed then can not continue, function is exited
	} else {
		// if the user config file exists
		if (fs.existsSync(config.configFile)) {
			// loading the user config from the file
			config.userConfig.get();
			
			// if the current configuration of python
			try {
				await verifyPython(config);
			} catch ( e ) {
				print("detected faulty config");
				// asking the user if they want to reinitialize the current directory
				let choice:string|undefined = await vscode.window.showInformationMessage("Detected faulty config, do you want to reinit the workspace?", config.yes, config.no);
				
				// if yes, then reinit it
				if (choice === config.yes) {
					// running the reinit command
					vscode.commands.executeCommand('uc-quantum-lab.reinit');
				} else if (choice === undefined) {
					// if the user choose nothing
					src.error("Invalid choice for whether or not to reinit");
				}
			}

		// if there is no config file to pull information from
		} else {
			print("detected faulty config");
			// asking the user if they want to reinitialize the current directory
			let choice:string|undefined = await vscode.window.showInformationMessage("Detected faulty config, do you want to reinit the workspace?", config.yes, config.no);
			
			// if yes, then reinit it
			if (choice === config.yes) {
				// running the reinit command
				vscode.commands.executeCommand('uc-quantum-lab.reinit');
			} else if (choice === undefined) {
				// if the user choose nothing
				src.error("Invalid choice for whether or not to reinit");
			}
		}
	}
}

/**
 * This is essentially the main function for this extension, vscode calls this when
 * the extension is activated
 */
export async function activate(context: vscode.ExtensionContext) {
	print("In activate");

	// adding the command to vscode
	context.subscriptions.push(
		vscode.commands.registerCommand("uc-quantum-lab.execute", async () => {
			print("--- executing ---");
			try {
				// loading the configuration from the ./config.ts
				let config:Config = await getConfig(context);

				// if an error was encountered by config then, print it and exit command
				if (config.errorEncountered) { src.error(config.errorMessage); return; }
			
				// if the viewer panel is open and there is an active editor
				if (UCQ.currentPanel && vscode.window.activeTextEditor) {
					print("Window is active");
					// if there is a document open in the text editor
					if (vscode.window.activeTextEditor.document !== undefined) {
						// loads python from local config.json
						config.userConfig.get();

						// checking if the active editor file is a python file
						if (!(vscode.window.activeTextEditor.document.fileName.endsWith(".py"))) {
							// can not execute non python file, so telling the user that
							src.error(`${vscode.window.activeTextEditor.document.fileName} is not a python file, can not execute it`);
							return;
						} else {
							// if here, then the file is a python file
							print("executing in termial");

							// if there is an active terminal in editor
							if (vscode.window.activeTerminal) {
								print("Sending to active terminal");
								// making sure the user can see the terminal
								vscode.window.activeTerminal.show(true);
								// sending the python command to active terminal to execute the active python file
								vscode.window.activeTerminal.sendText(`${config.userConfig.python} ${vscode.window.activeTextEditor.document.fileName}`);
							} else {
								// if here, then there was no active terminal so one is made
								print("creating terminal and sending to it");
								// creating terminal in vscode
								let term = vscode.window.createTerminal();
								// sending the python command to active terminal to execute the active python file
								term.sendText(`${config.userConfig.python} ${vscode.window.activeTextEditor.document.fileName}`);
							}
							print("Waiting for trigger file");
							
							// waiting for trigger file to be made by the python module, this extension waits for it then continues
							await src.waitForTriggerFile(config);
							
							// this is temporary, waiting a bit to let things cool down in the filesystem
							await src.delay(100); // milliseconds
							
							// updating the panel, note: no longer need to pass the config because no longer html from config
							UCQ.currentPanel.update();
						}
					} else {
						// can not execute nothing
						src.error("Must have an active document open"); 
						return; 
					}
				} else {
					// if nothing is opening, first running init to make sure everything is setup correctly
					await init(config);
					print("Creating Window");
					// creating window
					UCQ.createOrShow(config);

						// something things that I am messing with
						// vscode.commands.executeCommand("uc-quantum-lab.execute");
						// vscode.commands.executeCommand("workbench.action.focusPreviousGroup");
				}
			} catch ( e ) {
				// if here then a reinit of the current directory will probably work
				src.error((e as Error).message);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('uc-quantum-lab.init', async () => {
			try {
				// loading the config from "./config.ts"
				let config:Config = await getConfig(context);
				
				// if an error was encountered by config then, print it and exit command
				if (config.errorEncountered) { src.error(config.errorMessage); return; }
				
				// initing the current directory, do not to wrap the function call in an "if" because the function will handle its own errors
				await init(config);
			} catch ( e ) {
				src.error((e as Error).message);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('uc-quantum-lab.reinit', async () => {
			try {
				// loading the config from "./config.ts"
				let config:Config = await getConfig(context);

				// if an error was encountered by config then, print it and exit command
				if (config.errorEncountered) { src.error(config.errorMessage); return; }

				// if the config directory exists in the current directory
				if (fs.existsSync(config.configDir)) {
					// prompting user with what it will do to the config directory
					let choice:string|undefined = await vscode.window.showInformationMessage(`Will delete ${config.configDir} from the current directory, is this ok`, config.yes, config.no);

					// if they agreed to the previous message
					if (choice === config.yes) {
						// removing the config directory and catching errors
						try { fs.rmSync(config.configDir, { recursive: true, force: true }); }
						catch ( e ) { src.error(`error encountered when deleting config directory, with message ${e}`); }

					} else if (choice === undefined) {
						// the user can not choose nothing
						src.error("Invalid choice for deletion config dir");
						return;
					}
				}
				// initing the current directory, do not to wrap the function call in an "if" because the function will handle its own errors
				await init(config);
			} catch ( e ) {
				src.error((e as Error).message);
			}
		})
	);
}

// This method is called when your extension is deactivated, currently does nothing
export function deactivate() {}