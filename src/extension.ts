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
import * as input from "./input"

let ext_name = "UC Quantum Lab";
let mirror_dir = path.join("templates", "template_config"); 
let config_dir = ".UC_Quantum_Lab"
let template_python_file = path.join("templates", "main.py");
let python_package_name = "UC_Quantum_Lab";
let circ_image = "__circ__.png";
let statevector = "__state__.txt";

async function checks(context:  vscode.ExtensionContext) {
	if (await src.check_if_conda_installed()){
		let answer = await vscode.window.showInformationMessage(`Detected conda, do you want to use it with this extension (this is the recommend method)?`, "yes", "no");
		if (answer === "yes") {	
			let arr:string[] = await src.get_conda_envs();
			const result = await vscode.window.showQuickPick(arr, {placeHolder: 'choose the conda environment from the list'});
			src.print(`Setting up conda envrionment ${result}`);
			return
		}
		
	}
	if (!(await src.check_if_python_installed())) {
		vscode.window.showErrorMessage("Python was not detected on your system, please install it");
		return false;
	}
	if (!(await src.check_if_pip_installed())) {
		vscode.window.showErrorMessage("python pip was not detected on your system, please install it");
		return false;
	}
}

async function init(context: vscode.ExtensionContext) {
	src.out.appendLine("Running \"init\"");
	if(vscode.workspace.workspaceFolders !== undefined) {
		// performing checks
		
		if (!(await src.check_if_python_package_installed(python_package_name))) {
			let answer = await vscode.window.showInformationMessage(`The required package ${python_package_name} was not detected on your system, do you want this extension to install it?`, "yes", "no");

			// if they want to automate the installation of the python module
			if (answer === "yes") {
				let term:vscode.Terminal|undefined = vscode.window.activeTerminal;
				if (term !== undefined) {
					term.sendText("echo hello\n")
				} else {
					term = vscode.window.createTerminal("UC Quantum Lab")
					term.sendText("echo hello\n")
				}
			}
			return false;
		}
		else {
			let wf = vscode.workspace.workspaceFolders[0].uri ;
			// checking if the config_dir is in the workspace dir
			if (!(await src.check_if_in_dir(wf, config_dir))){
				// if not ask if the user wants to init the dir
				vscode.window.showInformationMessage(`Do you want to set up the current workspace for ${ext_name}?`, "yes", "no").then(
					selection => {
						if (selection == "yes") {
							src.out.appendLine("Building config");
							src.build_config_dir(
								path.join(wf.fsPath, config_dir), 
								path.join(context.extensionPath.toString(), mirror_dir)
							);
						} else { return false; }
					}
				);


				// generates a python file for the user if they want to
				let fname = template_python_file.split(path.sep).at(-1);
				if (fname !== undefined) {
					let _fname:string = fname;
					if (!(await src.check_if_in_dir(wf, fname))) {
						vscode.window.showInformationMessage(`Do you want an example main file?`, "yes", "no").then(
							selection => {
								if (selection == "yes") {
									src.out.appendLine("Making main file");
									fs.copyFile(path.join(context.extensionPath.toString(), template_python_file), 
												_fname.toString(), 
												(err) => {
										if (err){
											src.out.appendLine(`Error copying ${path.join(context.extensionPath.toString(), template_python_file)} to ${_fname.toString()}`);
										}
									});
								}
							}
						);
					}
				}
				
			} else { return false; }
		} 
	}
	else {
		src.out.appendLine("NOT in a workspace");
		vscode.window.showErrorMessage(`${ext_name}: Working folder not found, open a folder and try again`);
		return false;
	}
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	// activates extension on python file
	const handler = async (doc: vscode.TextDocument) => {
		if(!doc.fileName.endsWith('.py')) {
			return;
		}
	};
	
	const didOpen = vscode.workspace.onDidOpenTextDocument(doc => handler(doc));
	//const didChange = vscode.workspace.onDidChangeTextDocument(e => handler(e.document));
	
	// If we have an activeTextEditor when we open the workspace, trigger the handler
	if (vscode.window.activeTextEditor) {
		await handler(vscode.window.activeTextEditor.document);
	}
	
	// Push all of the disposables that should be cleaned up when the extension is disabled
	context.subscriptions.push(
		didOpen
		//didChange
	);
	context.subscriptions.push(
		vscode.commands.registerCommand("uc-quantum-lab.open", async () => {
			if (await init(context)) {
				src.out.appendLine("Creating Window");
				UCQ.createOrShow(context.extensionUri);
			}
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('uc-quantum-lab.init', async () => {
			init(context);
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
