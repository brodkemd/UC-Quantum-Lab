// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
/** known Isssues:
 * Possible overlap with file that has the same name as config_dir
 * 
 */
import * as vscode from 'vscode';
import { UCQ } from './panel';
import * as cp from "child_process";
import * as src from "./src";
import * as path from 'path';

let ext_name = "UC Quantum Lab";
let mirror_dir = "template_config"; 
let config_dir = ".UC_Quantum_Lab"
let circ_image = "__circ__.png";
let statevector = "__state__.txt"

const execShell = (cmd: string) =>
    new Promise<string>((resolve, reject) => {
        cp.exec(cmd, (err, out) => {
            if (err) {
                return reject(err);
            }
            return resolve(out);
        });
    });



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
			src.out.appendLine("Creating Window");
			UCQ.createOrShow(context.extensionUri);
			
			vscode.commands.executeCommand("uc-quantum-lab.init");
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('uc-quantum-lab.init', async () => {
			src.out.appendLine("Running \"init\"");
			if(vscode.workspace.workspaceFolders !== undefined) {
				src.out.appendLine("In a workspace");
				let wf = vscode.workspace.workspaceFolders[0].uri ;
				
				// checking if the config_dir is in the workspace dir
				if (!(await src.check_if_in_dir(wf, config_dir))){
					vscode.window.showInformationMessage(`Do you want to set up the current workspace for ${ext_name}?`, "yes", "no").then(
						selection => {
							if (selection == "yes") {
								src.out.appendLine("Building config")
								src.build_config_dir(
									path.join(wf.fsPath, config_dir), 
									path.join(context.extensionPath.toString(), "template_config")
								);
							} else {
								src.out.appendLine("no");
							}
						}
					);
					
				} else {

				}
			} 
			else {
				src.out.appendLine("NOT in a workspace");
				vscode.window.showErrorMessage(`${ext_name}: Working folder not found, open a folder an try again`);
			}

		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
