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

let print = src.print;



let package_name:string = "";
let cur_path:string = "";
let ext_path:string = "";
let config_dir:string = "";
let config_file:string = "";
let mirror_dir:string = "";
let template_python_file:string = "";
let circ_image = "__circ__.png";
let statevector = "__state__.txt";
let python:string = "";
let pip:string = "";
let cur_python_mod_ver = "0.0.1";

async function check_config(context:vscode.ExtensionContext, package_name:string, config_file:string):Promise<boolean> {
    print("In check config");
	// loading config from json file
	let config:{[name : string] : string|boolean}= {};
	if (fs.existsSync(config_file)) {
		let read_in = await src.readJsonFile(config_file)
		for (let val in read_in) {
			config[val] = read_in[val];
		}
	} else {
		print(`Could not find config file ${config_file}`);
		vscode.window.showErrorMessage(`Could not find config file ${config_file}`);
		return false;
	}
	if (config["python"] === undefined || config["pip"] === undefined) {
		vscode.window.showErrorMessage("python was not found in your config file, need to reinit, answer the following prompts");
		await checks_init(context, package_name, config);
	}
	if (config["python"] === undefined && config["pip"] === undefined) {
		print("Error: python and pip still not set");
		return false;
	} else {
		if (await src.try_command(`${config["python"]} -c "import ${package_name}"`)) {
			if (await src.get_version_of_python_module_with_name(config["pip"].toString(), package_name) !== cur_python_mod_ver) {
				print(`Setting up ${package_name} for ${config["python"]}`);
				if (await src.try_command(`${config["pip"]} install ${context.extensionPath.toString()}${path.sep}python_package`)) {
					vscode.window.showInformationMessage(`Success setup ${package_name}`);
				}
				else {
					vscode.window.showErrorMessage(`error installing ${package_name} for ${config["python"]}`);
				}
			} else {
				print(`Package is already there for ${config["python"]} and of the right version, do not need to install`);
			}
		} else {
			print(`Setting up ${package_name} for ${config["python"]}`);
			if (await src.try_command(`${config["pip"]} install ${context.extensionPath.toString()}${path.sep}python_package`)) {
				vscode.window.showInformationMessage(`Successfully setup ${package_name} for ${config["python"]}`);
			}
			else {
				vscode.window.showErrorMessage(`error setting up ${package_name} for ${config["python"]}`);
			}
		}
	}
	if (config["show_histogram"] === undefined) {
		config["show_histogram"] = false;
	}
	if (config["show_state_vector"] === undefined) {
		config["show_state_vector"] = false;
	}
	if (config["show_circ"] === undefined) {
		config["show_circ"] = false;
	}
	let to_return:boolean = true;
	// write JSON string to a file
	fs.writeFile(config_file, JSON.stringify(config, null, 4), err => {
		if (err) {
			vscode.window.showErrorMessage("could not save config back to file");
			to_return = false;
		}
	});
	return to_return;
}


async function checks_init(context:vscode.ExtensionContext, package_name:string, cur_config?:src.configType):Promise<boolean> {
    // checking on what python is installed and helps with installation
    if (await src.check_if_conda_installed()){
        //print(`Detected conda, do you want to use it with this extension (this is the recommend method)?`);
		let choice:string|undefined = await vscode.window.showInformationMessage(`Detected conda, do you want to use it with this extension (this is the recommend method)?`, "yes", "no");
        //let choice:string = "yes";
        if (choice === "yes") {
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
				if (cur_config) {
					cur_config["python"] = dict[result]["exe"];
					cur_config["pip"] = dict[result]["pip"];
				}
				// checks if qiskit is installed
				// if (await src.try_command(`${dict[result]["exe"]} -c "import qiskit"`)) {
				// 	print(`Qiskit already installed in ${dict[result]}`);
				// } else {
				// 	print("installing qiskit");
				// 	vscode.window.showInformationMessage("Installing qiskit");
				// 	if(await src.try_command(`${dict[result]["pip"]} install qiskit 'qiskit[visualization]'`)) {
				// 		vscode.window.showErrorMessage(`error encountered when installing qiskit and 'qiskit[visualization]' into the conda environment ${dict[result]}`);
				// 	}
				// }
				if (await src.try_command(`${dict[result]["exe"]} -c "import ${package_name}"`)) {
					if (await src.get_version_of_python_module_with_name(dict[result]["pip"], package_name) !== cur_python_mod_ver) {
						print(`Installing ${package_name} in ${result}`);
						if (await src.try_command(`${dict[result]["pip"]} install ${context.extensionPath.toString()}${path.sep}python_package`)) {
							vscode.window.showInformationMessage(`Success setup ${package_name}`);
						}
						else {
							vscode.window.showErrorMessage(`error installing ${package_name} into ${result}`);
						}
					}
					print(`Package is already there for ${result} and of the right version, do not need to install`)
				} else {
					print(`Installing ${package_name} in ${result}`);
					if (await src.try_command(`${dict[result]["pip"]} install ${context.extensionPath.toString()}${path.sep}python_package`)) {
						vscode.window.showInformationMessage(`Success setup ${package_name}`);
					}
					else {
						vscode.window.showErrorMessage(`error installing ${package_name} into ${result}`);
					}
				}
				return true;
			} else {
				return false;
			}
        } else if (choice === "no") {
			return await src.install_in_sys_python(package_name); 
		}  else { return false; }
        
    } else {
        print("Did not detect anaconda on this system do you want to continue with a system python install (it would be better to use this extension with anaconda)\nIf not go to https://docs.anaconda.com/anaconda/install/index.html for a guide to install anaconda");
        let choice:string = "yes";
        if (choice === "yes") {
            return await src.install_in_sys_python(package_name);
        }
    }
    return false;
}

async function init(context: vscode.ExtensionContext) {
	print("Running \"init\"");
	if(vscode.workspace.workspaceFolders !== undefined) {
		package_name= "UC_Quantum_Lab";
		cur_path = vscode.workspace.workspaceFolders[0].uri.fsPath;
		ext_path = context.extension.extensionPath;
		config_dir = path.join(cur_path, ".UCQ_config");
		config_file = path.join(config_dir, "config.json");
		mirror_dir = path.join(ext_path, "templates", "template_config");
		template_python_file = path.join(ext_path, "templates", "main.py");
		if (!(fs.existsSync(config_dir))) {
			print(`Config existence ${fs.existsSync(config_dir)}`);
			if (await checks_init(context, package_name)) {
				if (!(fs.existsSync(config_dir))) {
					//print(`Do you want to initialize your current directory for this extension (will make the dir ${config_dir.slice(config_dir.lastIndexOf(path.sep)+1, config_dir.length)} here)`);
					let choice:string|undefined = await vscode.window.showInformationMessage(`Do you want to initialize your current directory for this extension (will make the dir ${config_dir.slice(config_dir.lastIndexOf(path.sep)+1, config_dir.length)} here)`, "yes", "no");
					if (choice === "yes") {
						src.build_config_dir(config_dir, mirror_dir);
					} else {
						print("Can not execute this extension without a config directory, sorry");
						vscode.window.showErrorMessage("Can not execute this extension without a config directory, sorry");
						return false;
					}
				} else {
					print(`Config path ${config_dir} exists, checking it`);
					// makes sure that the config path is configured correctly
					if (!(await src.check_config_dir(config_dir, mirror_dir))) {
						print(`Error checking ${config_dir}`);
						vscode.window.showErrorMessage(`Error checking ${config_dir}`);
						return false;
					} else {
						print("Checks passed");
					}
				}
				let fname = template_python_file.slice(template_python_file.lastIndexOf(path.sep)+1, template_python_file.length);
				if (!(await src.check_if_file_in_dir(cur_path, fname))) {
					let selection:string|undefined = await vscode.window.showInformationMessage(`Do you want an example main file?`, "yes", "no")

					if (selection === "yes") {
						print("Making main file");
						fs.copyFile(template_python_file, 
									path.join(cur_path, fname), 
									(err) => {
							if (err){
								src.out.appendLine(`Error copying ${template_python_file} to ${fname}`);
								return false;
							}
						});
					}
				}
			} else {
				print("Error in checks function");
				vscode.window.showErrorMessage("error in checks function");
				return false;
			}
		} else { 
			print(`Workspace already setup, performing quick checks`);
			if (!(await src.check_config_dir(config_dir, mirror_dir))) {
				print(`Error checking ${config_dir}`);
				vscode.window.showErrorMessage(`Error checking ${config_dir}`);
				return false;
			} else {
				if (!(await check_config(context, package_name, config_file))) {
					print(`Error checking configuration`);
					vscode.window.showErrorMessage(`Error checking configuration`);
					return false;
				}
				print("Checks passed");
			}
		}
	} else {
		print("Must be in workspace with open folder");
		vscode.window.showErrorMessage("Must be in workspace with open folder");
		return false;
	}
	return true;
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	print("In activate");

	// activates extension on python file
	const handler = async (doc: vscode.TextDocument) => {
		if(!doc.fileName.endsWith('.py')) {
	 		return;
	 	}
	};
	
	// const didOpen = vscode.workspace.onDidOpenTextDocument(doc => handler(doc));
	// //const didChange = vscode.workspace.onDidChangeTextDocument(e => handler(e.document));
	
	// If we have an activeTextEditor when we open the workspace, trigger the handler
	if (vscode.window.activeTextEditor) {
		await handler(vscode.window.activeTextEditor.document);
	}
	
	// // Push all of the disposables that should be cleaned up when the extension is disabled
	// context.subscriptions.push(
	// 	didOpen
	// 	//didChange
	// );
	context.subscriptions.push(
		vscode.commands.registerCommand("uc-quantum-lab.execute", async () => {
			if (UCQ.currentPanel && vscode.window.activeTextEditor) {
				print("Window is activate");
				if (fs.existsSync(config_file)) {
					print("config file exists");
					let read_in = await src.readJsonFile(config_file)
					if (read_in["python"] === undefined) {
						print(`Config file does not have python`)
						vscode.window.showErrorMessage("Could not get python command from you config");
						return;
					} else {
						print("python in config");
						if (!(fs.existsSync(read_in["python"]))) {
							print(`python interpreter in config ${read_in["python"]} does not exist`);
							vscode.window.showErrorMessage(`python interpreter in config ${read_in["python"]} does not exist`);
							return;
						} else {
							print("python from config is valid");
							if (vscode.window.activeTextEditor.document !== undefined) {
								if (!(vscode.window.activeTextEditor.document.fileName.endsWith(".py"))) {
									print(`${vscode.window.activeTextEditor.document.fileName} is not a python file, can not execute it`);
									vscode.window.showErrorMessage(`${vscode.window.activeTextEditor.document.fileName} is not a python file, can not execute it`);
									return;
								} else {
									print("executing in termial");
									if (vscode.window.activeTerminal) {
										print("Sending to active terminal");
										vscode.window.activeTerminal.show(true);
										vscode.window.activeTerminal.sendText(`${read_in["python"]} ${vscode.window.activeTextEditor.document.fileName}`);
									} else {
										print("creating terminal and sending to it");
										let term = vscode.window.createTerminal();
										term.sendText(`${read_in["python"]} ${vscode.window.activeTextEditor.document.fileName}`);
		
									}
								}
							} else {
								return;
							}

							//vscode.window.activeTextEditor?.document
						}
					}
				} else {
					print(`Could not find config file ${config_file}`);
					vscode.window.showErrorMessage(`Could not find config file ${config_file}`);
					return;
				}
				UCQ.currentPanel.update();
			} else { 
				if (await init(context)) {
					print("Creating Window");
					let folders = vscode.workspace.workspaceFolders;
					if (folders !== undefined) {
						let cur_path:string|undefined = folders[0].uri.fsPath;
						if (cur_path !== undefined){
							let config_dir:string = path.join(cur_path, ".UCQ_config");
							UCQ.createOrShow(context, 
											 config_dir, 
											 [path.join(config_dir, circ_image)], 
											 [path.join(config_dir, statevector)]
											);
							vscode.commands.executeCommand("workbench.action.focusPreviousGroup");
						}
					}
				} else {
					print("error initializing this extension");
					vscode.window.showErrorMessage("error initializing this extension");
				}
			}
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('uc-quantum-lab.init', async () => {
			if (!(await init(context))) {
				print("error initializing this extension");
				vscode.window.showErrorMessage("error initializing this extension");
			}
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
