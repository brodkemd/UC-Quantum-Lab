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
import { get_config, Config } from "./config"

let print = src.print;

async function verifyPython(config:Config):Promise<boolean> {
	print("verifying python setup")
	if (await src.try_command(`${config.userConfig.python} -c "import ${config.pythonModuleName}"`)) {
		if (await src.get_version_of_python_module_with_name(config.userConfig.pip, config.pythonModuleName) !== config.curPythonModVer) {
			print(`Setting up ${config.pythonModuleName} for ${config.userConfig.python}`);
			vscode.window.showInformationMessage(`Setting up the python module ${config.pythonModuleName}`);
			if (await src.try_command(`${config.userConfig.pip} install ${config.pythonModulePath}`)) {
				vscode.window.showInformationMessage(`Successfully setup ${config.pythonModuleName}`);
				print(`Successfully setup ${config.pythonModuleName}`);
			}
			else {
				src.error(`error installing ${config.pythonModuleName} for ${config.userConfig.python}`);
				return false;
			}
		} else {
			print(`Package is already there for ${config.userConfig.python} and of the right version, do not need to install`);
		}
	} else {
		print(`Setting up ${config.pythonModuleName} for ${config.userConfig.python}`);
		// might need to use this flag at some point "--use-feature=in-tree-build"
		if (await src.try_command(`${config.userConfig.pip} install ${config.pythonModulePath}`)) {
			vscode.window.showInformationMessage(`Successfully setup ${config.pythonModuleName} for ${config.userConfig.python}`);
			print(`Successfully setup ${config.pythonModuleName} for ${config.userConfig.python}`);
		}
		else {
			src.error(`error setting up ${config.pythonModuleName} for ${config.userConfig.python}`);
			return false;
		}
	}
	return true;
}


async function setupPython(config:Config):Promise<boolean> {
    // checking on what python is installed and helps with installation
    if (await src.check_if_conda_installed()){
		print("detected conda")
        //print(`Detected conda, do you want to use it with this extension (this is the recommend method)?`);
		let choice:string|undefined = await vscode.window.showInformationMessage(`Detected conda, do you want to use it with this extension (this is the recommend method)?`, config.yes, config.no);
        //let choice:string = "yes";
        if (choice === config.yes) {
			print("setting up for conda");
            let dict:src.infoType  = await src.get_conda_envs();
            //print("Select env from list below")
            let arr:string[] = [];
            for (let key in dict) {
                if (dict[key]["has_qiskit"]) {
                    arr.push(`${key} at ${dict[key]["path"]} (suggested)`);
                } else {
                    arr.push(`${key} at ${dict[key]["path"]}`);
                }
            }
			let result:string|undefined = await vscode.window.showQuickPick(arr, {placeHolder: 'choose the conda environment from the list'});
			if (result !== undefined) {
				result = result.slice(0, result.indexOf(" "));
				
				print(`Setting up conda envrionment ${result}`);
				config.userConfig.python = dict[result]["exe"];
				config.userConfig.pip = dict[result]["pip"];
				
				if (await(verifyPython(config))) {
					config.userConfig.save();
					return true;
				} else { return false; }
			} else { 
				src.error("invalid selection for conda env");
				return false; 
			}
        } else if (choice === config.no) {
			print("setting up for system python");
			if (await src.setupSysPython(config)) {
				config.userConfig.save();
				return true;
			} else { return false; }
		}  else { 
			src.error("invalid choice for python setup");
			return false; 
		}
        
    } else {
        let opt:string|undefined = await vscode.window.showInformationMessage("Did not detect anaconda on this system do you want to continue with a system python install (it would be better to use this extension with anaconda)\nIf not go to https://docs.anaconda.com/anaconda/install/index.html for a guide to install anaconda and press \"no\"", config.yes, config.no);
        if (opt === config.yes) {
			if (await src.setupSysPython(config)) {
				config.userConfig.save();
				return true;
			} else { return false; }
        } else if (opt === undefined) {
			src.error("invalid choice for python setup");
			return false; 
		}
    }
    return false;
}

async function init(config:Config):Promise<boolean> {
 	print("Running \"init\"");
	if (!(fs.existsSync(config.configDir))) {
		if (await setupPython(config)) {
			let choice:string|undefined = await vscode.window.showInformationMessage(`Do you want to initialize your current directory for this extension (will make the dir ${src.get_last_from_path(config.configDir)} here)`, config.yes, config.no);
			if (choice === config.yes) {
				if (!(await src.mkDir(config.configDir))) { return false; }
				
			} else {
				print("User blocked config directory creation, returning");
				vscode.window.showErrorMessage("Can not execute this extension without a config directory, sorry");
				return false;
			}
			
			config.userConfig.save();
			let fname = src.get_last_from_path(config.templatePythonFile);
			if (!(await src.check_if_file_in_dir(config.workspacePath, fname))) {
				let selection:string|undefined = await vscode.window.showInformationMessage(`Do you want an example main file?`, config.yes, config.no)
				if (selection === config.yes) {
					print("Making main file");
					let to_return:boolean = true
					fs.copyFile(config.templatePythonFile, 
								path.join(config.workspacePath, fname), 
								(err) => {
						if (err){
							src.error(`Error copying ${config.templatePythonFile} to ${fname}`);
							to_return = false;
						}
					});
					if (to_return) {
						if (!(await src.try_command(`code ${path.join(config.workspacePath, fname)}`))) {
							src.error(`could not open "${path.join(config.workspacePath, fname)} in code"`);
						} else {
							vscode.commands.executeCommand("uc-quantum-lab.execute");
						}
					}
					return to_return;
				}
			} else {
				src.error(`"${fname}" is in your current directory and is not a directory please delete it from the current directory`);
			}
		} else { return false; }
	} else { 
		config.userConfig.get();
		if (!(await verifyPython(config))) { 
			print("detected faulty config");
			let choice:string|undefined = await vscode.window.showInformationMessage("Detected faulty config, do you want to reinit the workspace?", config.yes, config.no);
			if (choice === config.yes) {
				vscode.commands.executeCommand('uc-quantum-lab.reinit');
				return true;
			} else if (choice === undefined) {
				src.error("Invalid choice for whether or not to reinit");
				return false;
			}
			return false;
		}
	}

	return true;
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	print("In activate");
	context.subscriptions.push(
		vscode.commands.registerCommand("uc-quantum-lab.execute", async () => {
			print("--- executing ---");
			let config:Config = await get_config(context);
			if (config.errorEncountered) {
				src.error(config.errorMessage);
				return;
			}
			if (UCQ.currentPanel && vscode.window.activeTextEditor) {
				print("Window is activate");
				if (vscode.window.activeTextEditor.document !== undefined) {
					config.userConfig.get(); // loads python
					if (!(vscode.window.activeTextEditor.document.fileName.endsWith(".py"))) {
						src.error(`${vscode.window.activeTextEditor.document.fileName} is not a python file, can not execute it`);
						return;
					} else {
						print("executing in termial");
						if (vscode.window.activeTerminal) {
							print("Sending to active terminal");
							vscode.window.activeTerminal.show(true);
							vscode.window.activeTerminal.sendText(`${config.userConfig.python} ${vscode.window.activeTextEditor.document.fileName}`);
						} else {
							print("creating terminal and sending to it");
							let term = vscode.window.createTerminal();
							term.sendText(`${config.userConfig.python} ${vscode.window.activeTextEditor.document.fileName}`);
						}
						print("Waiting for trigger file");
						await src.wait_for_trigger_file(config);
						await src.delay(100);
						UCQ.currentPanel.update(config);
					}
				} else { return; }

			} else { 
				if (await init(config)) {
					print("Creating Window");
					UCQ.createOrShow(config);
					//vscode.commands.executeCommand("workbench.action.focusPreviousGroup");
				}
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('uc-quantum-lab.init', async () => {
			let config:Config = await get_config(context);
			if (config.errorEncountered) {
				src.error(config.errorMessage);
				return;
			}
			if (!(await init(config))) {
				src.error("error initializing this extension");
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('uc-quantum-lab.reinit', async () => {
			let config:Config = await get_config(context);
			if (config.errorEncountered) {
				src.error(config.errorMessage);
				return;
			}
			if (fs.existsSync(config.configDir)) {
				let choice:string|undefined = await vscode.window.showInformationMessage(`Will delete ${config.configDir} from the current directory, is this ok`, config.yes, config.no);
				if (choice === config.yes) {
					try {
						fs.rmSync(config.configDir, { recursive: true, force: true });
					} catch ( e ) {
						src.error(`error encountered when deleting config directory, with message ${e}`);
					}
				} else if (choice === undefined) {
					src.error("Invalid choice for deletion config dir");
					return;
				}
			}
			if (!(await init(config))) {
				src.error("error initializing this extension");
			}
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}