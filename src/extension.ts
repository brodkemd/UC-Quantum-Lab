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
		if (await src.try_command(`${config.userConfig.pip} install ${config.pythonModulePath}`)) {
			vscode.window.showInformationMessage(`Successfully setup ${config.pythonModuleName} for ${config.userConfig.python}`);
			print(`Successfully setup ${config.pythonModuleName} for ${config.userConfig.python}`);
		}
		else {
			src.error(`error setting up ${config.pythonModuleName} for ${config.userConfig.python}`);
			return false;
		}
	}
	
	// loading config from json file
	// let config:{[name : string] : string|boolean}= {};
	// if (fs.existsSync(config_file)) {
	// 	let read_in = await src.readJsonFile(config_file)
	// 	for (let val in read_in) {
	// 		config[val] = read_in[val];
	// 	}
	// } else {
	// 	print(`Could not find config file ${config_file}`);
	// 	vscode.window.showErrorMessage(`Could not find config file ${config_file}`);
	// 	return false;
	// }
	// if (config["python"] === undefined || config["pip"] === undefined) {
	// 	vscode.window.showErrorMessage("python was not found in your config file, need to reinit, answer the following prompts");
	// 	await checks_init(context, package_name, config);
	// }
	// if (config["python"] === undefined && config["pip"] === undefined) {
	// 	print("Error: python and pip still not set");
	// 	return false;
	// } else {
	// if (await src.try_command(`${config["python"]} -c "import ${package_name}"`)) {
	// 	if (await src.get_version_of_python_module_with_name(config["pip"].toString(), package_name) !== cur_python_mod_ver) {
	// 		print(`Setting up ${package_name} for ${config["python"]}`);
	// 		if (await src.try_command(`${config["pip"]} install ${context.extensionPath.toString()}${path.sep}python_package`)) {
	// 			vscode.window.showInformationMessage(`Success setup ${package_name}`);
	// 		}
	// 		else {
	// 			vscode.window.showErrorMessage(`error installing ${package_name} for ${config["python"]}`);
	// 		}
	// 	} else {
	// 		print(`Package is already there for ${config["python"]} and of the right version, do not need to install`);
	// 	}
	// } else {
	// 	print(`Setting up ${package_name} for ${config["python"]}`);
	// 	if (await src.try_command(`${config["pip"]} install ${context.extensionPath.toString()}${path.sep}python_package`)) {
	// 		vscode.window.showInformationMessage(`Successfully setup ${package_name} for ${config["python"]}`);
	// 	}
	// 	else {
	// 		vscode.window.showErrorMessage(`error setting up ${package_name} for ${config["python"]}`);
	// 	}
	// }
	//}

	// if (config["show_histogram"] === undefined) {
	// 	config["show_histogram"] = false;
	// }
	// if (config["show_state_vector"] === undefined) {
	// 	config["show_state_vector"] = false;
	// }
	// if (config["show_circ"] === undefined) {
	// 	config["show_circ"] = false;
	// }
	// let to_return:boolean = true;
	// // write JSON string to a file
	// fs.writeFile(config.configFile, JSON.stringify(config, null, 4), err => {
	// 	if (err) {
	// 		vscode.window.showErrorMessage("could not save config back to file");
	// 		to_return = false;
	// 	}
	// });
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
			let fname = src.get_last_from_path(config.templatePythonFile);
			if (!(await src.check_if_file_in_dir(config.workspacePath, fname))) {
				let selection:string|undefined = await vscode.window.showInformationMessage(`Do you want an example main file?`, config.yes, config.no)
				if (selection === config.yes) {
					print("Making main file");
					fs.copyFile(config.templatePythonFile, 
								path.join(config.workspacePath, fname), 
								(err) => {
						if (err){
							src.error(`Error copying ${config.templatePythonFile} to ${fname}`);
							return false;
						}
					});
				}
			}
		} else { return false; }
	} else { 
		// print(`Workspace already setup, performing quick checks`);
		// if (!(await src.check_config_dir(config_dir, mirror_dir))) {
		// 	print(`Error checking ${config_dir}`);
		// 	vscode.window.showErrorMessage(`Error checking ${config_dir}`);
		// 	return false;
		// } else {
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
		// }
	}

	return true;
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	print("In activate");

	// activates extension on python file
	// const handler = async (doc: vscode.TextDocument) => {
	// 	if(!doc.fileName.endsWith('.py')) {
	//  		return;
	//  	}
	// };
	
	// const didOpen = vscode.workspace.onDidOpenTextDocument(doc => handler(doc));
	// //const didChange = vscode.workspace.onDidChangeTextDocument(e => handler(e.document));
	
	// If we have an activeTextEditor when we open the workspace, trigger the handler
	// if (vscode.window.activeTextEditor) {
	// 	await handler(vscode.window.activeTextEditor.document);
	// }
	
	// // Push all of the disposables that should be cleaned up when the extension is disabled
	// context.subscriptions.push(
	// 	didOpen
	// 	//didChange
	// );
	context.subscriptions.push(
		vscode.commands.registerCommand("uc-quantum-lab.execute", async () => {
			let config:Config = await get_config(context, false);
			if (config.errorEncountered) {
				src.error(config.errorMessage);
				return;
			}
			if (UCQ.currentPanel && vscode.window.activeTextEditor) {
				print("Window is activate");
				if (vscode.window.activeTextEditor.document !== undefined) {
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
					}
				} else { return; }

				UCQ.currentPanel.update();
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
			let config:Config = await get_config(context, false);
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
			let config:Config = await get_config(context, false);
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

				// if (fs.existsSync(config.configFile)) {
				// 	print("config file exists");
				// 	let read_in = await src.readJsonFile(config_file)
				// 	if (read_in["python"] === undefined) {
				// 		print(`Config file does not have python`)
				// 		vscode.window.showErrorMessage("Could not get python command from you config");
				// 		return;
				// 	} else {
				// 		print("python in config");
				// 		if (!(fs.existsSync(read_in["python"]))) {
				// 			print(`python interpreter in config ${read_in["python"]} does not exist`);
				// 			vscode.window.showErrorMessage(`python interpreter in config ${read_in["python"]} does not exist`);
				// 			return;
				// 		} else {
				// 			print("python from config is valid");
				/*			}
					}
				} else {
					print(`Could not find config file ${config_file}`);
					vscode.window.showErrorMessage(`Could not find config file ${config_file}`);
					return;
				}
				*/
				//print("Running \"init\"");
// 	let config:Config = await get_config(context, false);
// 	if (!config.errorEncountered) {
// 		if (!(fs.existsSync(config.configDir))) {
// 			if (await checks_init(context, package_name)) {
// 				if (!(fs.existsSync(config_dir))) {
// 					//print(`Do you want to initialize your current directory for this extension (will make the dir ${config_dir.slice(config_dir.lastIndexOf(path.sep)+1, config_dir.length)} here)`);
// 					let choice:string|undefined = await vscode.window.showInformationMessage(`Do you want to initialize your current directory for this extension (will make the dir ${config_dir.slice(config_dir.lastIndexOf(path.sep)+1, config_dir.length)} here)`, "yes", "no");
// 					if (choice === "yes") {
// 						src.build_config_dir(config_dir, mirror_dir);
// 					} else {
// 						print("Can not execute this extension without a config directory, sorry");
// 						vscode.window.showErrorMessage("Can not execute this extension without a config directory, sorry");
// 						return false;
// 					}
// 				} else {
// 					print(`Config path ${config_dir} exists, checking it`);
// 					// makes sure that the config path is configured correctly
// 					if (!(await src.check_config_dir(config_dir, mirror_dir))) {
// 						print(`Error checking ${config_dir}`);
// 						vscode.window.showErrorMessage(`Error checking ${config_dir}`);
// 						return false;
// 					} else {
// 						print("Checks passed");
// 					}
// 				}
// 				let fname = template_python_file.slice(template_python_file.lastIndexOf(path.sep)+1, template_python_file.length);
// 				if (!(await src.check_if_file_in_dir(cur_path, fname))) {
// 					let selection:string|undefined = await vscode.window.showInformationMessage(`Do you want an example main file?`, "yes", "no")

// 					if (selection === "yes") {
// 						print("Making main file");
// 						fs.copyFile(template_python_file, 
// 									path.join(cur_path, fname), 
// 									(err) => {
// 							if (err){
// 								src.out.appendLine(`Error copying ${template_python_file} to ${fname}`);
// 								return false;
// 							}
// 						});
// 					}
// 				}
// 			} else {
// 				print("Error in checks function");
// 				vscode.window.showErrorMessage("error in checks function");
// 				return false;
// 			}
// 		} else { 
// 			print(`Workspace already setup, performing quick checks`);
// 			if (!(await src.check_config_dir(config_dir, mirror_dir))) {
// 				print(`Error checking ${config_dir}`);
// 				vscode.window.showErrorMessage(`Error checking ${config_dir}`);
// 				return false;
// 			} else {
// 				if (!(await check_config(context, package_name, config_file))) {
// 					print(`Error checking configuration`);
// 					vscode.window.showErrorMessage(`Error checking configuration`);
// 					return false;
// 				}
// 				print("Checks passed");
// 			}
// 		}
// 	} else {
// 		print(config.errorMessage);
// 		vscode.window.showErrorMessage(config.errorMessage);
// 		return false;
// 	}
// 	return true;
// }