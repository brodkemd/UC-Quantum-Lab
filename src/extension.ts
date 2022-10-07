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

// let ext_name = "UC Quantum Lab";
// let mirror_dir = path.join("templates", "template_config"); 
// let config_dir = ".UC_Quantum_Lab"
// let template_python_file = path.join("templates", "main.py");
// let python_package_name = "UC_Quantum_Lab";
// let circ_image = "__circ__.png";
// let statevector = "__state__.txt";


async function checks(context:vscode.ExtensionContext, package_name:string):Promise<boolean> {
    // checking on what python is installed and helps with installation
    if (await src.check_if_conda_installed()){
        //print(`Detected conda, do you want to use it with this extension (this is the recommend method)?`);
		let choice:string|undefined = await vscode.window.showInformationMessage(`Detected conda, do you want to use it with this extension (this is the recommend method)?`, "yes", "no");
        //let choice:string = "yes";
        if (choice === "yes") {
            let dict:{[name:string] : { "path"       : string, 
										"exe"        : string, 
										"pip"        : string,
										"has_qiskit" : boolean}}  = await src.get_conda_envs();
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
					print(`Package is already in ${result} do not need to install`)
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
        } else { return await src.install_in_sys_python(package_name); }
        
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
		let package_name:string = "UC_Quantum_Lab";
		let cur_path:string = vscode.workspace.workspaceFolders[0].uri.fsPath;
		let config_dir:string = path.join(cur_path, ".config");
		let mirror_dir:string = path.join(cur_path, "templates", "template_config");
		let template_python_file:string = path.join(cur_path, "templates", "main.py");

		if (await checks(context, package_name)) {
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
				print(`Config path ${config_dir} exists`);
				// makes sure that the config path is configured correctly
				if (!(await src.check_config_dir(config_dir, mirror_dir))) {
					vscode.window.showErrorMessage(`Error checking ${config_dir}`);
					return false;
				}
			}
			let fname = template_python_file.slice(template_python_file.lastIndexOf(path.sep)+1, template_python_file.length);
			if (!(await src.check_if_in_dir(cur_path, fname))) {
				let selection:string|undefined = await vscode.window.showInformationMessage(`Do you want an example main file?`, "yes", "no")

				if (selection === "yes") {
					print("Making main file");
					vscode.window.showInformationMessage("Making main file");
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
	// const handler = async (doc: vscode.TextDocument) => {
	// 	if(!doc.fileName.endsWith('')) {
	// 		return;
	// 	}
	// };
	
	// const didOpen = vscode.workspace.onDidOpenTextDocument(doc => handler(doc));
	// //const didChange = vscode.workspace.onDidChangeTextDocument(e => handler(e.document));
	
	// // If we have an activeTextEditor when we open the workspace, trigger the handler
	// if (vscode.window.activeTextEditor) {
	// 	await handler(vscode.window.activeTextEditor.document);
	// }
	
	// // Push all of the disposables that should be cleaned up when the extension is disabled
	// context.subscriptions.push(
	// 	didOpen
	// 	//didChange
	// );
	context.subscriptions.push(
		vscode.commands.registerCommand("uc-quantum-lab.open", async () => {
			if (await init(context)) {
				print("Creating Window");
				UCQ.createOrShow(context.extensionUri);
			} else {
				print("error initializing this extension");
				vscode.window.showErrorMessage("error initializing this extension");
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
