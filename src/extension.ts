// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
/** known Isssues:
 * Possible overlap with file that has the same name as config_dir
 * 
 * How to run locally, execute the following in the shell: code --extensionDevelopmentPath=$PWD
 * 
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { UCQ } from './panel';
import { getConfig, Config } from "./config";
import { verifyPython } from "./pythonHandling";
import { print, error, info, getLastFromPath, mkDir, checkIfFileInDir} from "./src";
import { handleLegacy } from './handleLegacy';


/**
 * Initializes the workspace/current directory for this extension
 * @param config : configuration of the extension
 * @returns boolean indicating whether or not this function extension exceeded
 */
async function init(config:Config) {
 	print("Running \"init\"");
	
	// verifying the selected python environment
	await verifyPython(config);

	// the config directory exists
	if (!(fs.existsSync(config.configDir))) {
		// prompting the user if they want to make the config directory
		let choice:string|undefined = await vscode.window.showInformationMessage(`Do you want to initialize your current directory for this extension (will make the dir "${getLastFromPath(config.configDir)}" here)`, config.yes, config.no);
		
		// if the user wants to make the config directory
		if (choice === config.yes) {
			// making the config directory
			await mkDir(config.configDir);
		} else {
			// can not operate without config directory
			error("User blocked config directory creation, can not execute without it");
		}

		// copies template layout file to be displayed in the viewer
		try {
			await fs.promises.copyFile(config.templateLayoutFile, config.layoutFile);
		} catch ( e ) {
			error(`while trying to copy template layout file to config dir: ${(e as Error).message}`);
		}

		// getting the template main file name from the template main file path
		let fname = `example_${getLastFromPath(config.templatePythonFile)}`;

		// if the main file is not in the current directory
		if (!(await checkIfFileInDir(config.workspacePath, fname))) {
			// prompting the user if they want an example main file
			let selection:string|undefined = await vscode.window.showInformationMessage(`Do you want an example main file?`, config.yes, config.no);
			
			// if they want a main file
			if (selection === config.yes) {
				print("Making main file");
				// copying template file to current directory
				fs.copyFile(config.templatePythonFile, 
							path.join(config.workspacePath, fname), 
							(err) => {
					if (err){
						error(`Error copying "${config.templatePythonFile}" to "${fname}"`);
					}
				});
				// opening the example file in the editor
				let documet:vscode.TextDocument|undefined = await vscode.workspace.openTextDocument(path.join(config.workspacePath, fname));
				if (documet === undefined) {
					// if the opening of the file failed let the user know
				 	error(`could not open "${path.join(config.workspacePath, fname)} in code"`);
				} else {
					// opens document in first column
					await vscode.window.showTextDocument(documet, vscode.ViewColumn.One, false);
				}
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
				
				// handles features from previous versions of this extension
				await handleLegacy(config);

				// verifyies python is setup correctly
				//await verifyPython(config);

				// if the viewer panel is open and there is an active editor
				if (UCQ.currentPanel && vscode.window.activeTextEditor) {
					print("Window is active");
					// if the config dir was removed
					if (!(fs.existsSync(config.configDir))) {
						print("detected faulty config");
						// asking the user if they want to reinitialize the current directory
						let choice:string|undefined = await vscode.window.showInformationMessage("Detected faulty config, do you want to reinit the workspace?", config.yes, config.no);
						
						// if yes, then reinit it
						if (choice === config.yes) {
							// running the reinit command
							await vscode.commands.executeCommand('uc-quantum-lab.reinit');
						} else if (choice === undefined) {
							// if the user choose nothing
							error("Invalid choice for whether or not to reinit");
						}
					} else {
						print("executing in termial");
						// executing the python file in the terminal with the python extension
						vscode.commands.executeCommand("python.execInTerminal");
						// waiting for the layout.json file to be updated
						let watcher:vscode.FileSystemWatcher = vscode.workspace.createFileSystemWatcher(config.layoutFile, false, false, false);
						watcher.onDidChange(() => {
							// updating the panel, when the layout file is updated
							UCQ.currentPanel?.update();
						});
					}
				} else {
					// if nothing is opening, first running init to make sure everything is setup correctly
					await init(config);
					print("Creating Window");
					// creating window
					UCQ.createOrShow(config);
					//vscode.commands.executeCommand("uc-quantum-lab.execute");
				}
			// functions handle their own errors so do not need to do anything here
			} catch ( e ) {}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('uc-quantum-lab.init', async () => {
			try {
				// loading the config from "./config.ts"
				let config:Config = await getConfig(context);
				
				// initing the current directory
				await init(config);
			// functions handle their own errors so do not need to do anything here
			} catch ( e ) {}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('uc-quantum-lab.reinit', async () => {
			try {
				// loading the config from "./config.ts"
				let config:Config = await getConfig(context);

				// if the config directory exists in the current directory
				if (fs.existsSync(config.configDir)) {
					// prompting user with what it will do to the config directory
					let choice:string|undefined = await vscode.window.showInformationMessage(`Will delete "${config.configDir}" from the current directory, is this ok`, config.yes, config.no);

					// if they agreed to the previous message
					if (choice === config.yes) {
						// removing the config directory and catching errors
						try { fs.rmSync(config.configDir, { recursive: true, force: true }); }
						catch ( e ) { error(`error encountered when deleting config directory, with message: ${e}`); }

					} else if (choice === undefined) {
						// the user can not choose nothing
						error("Invalid choice for deletion config dir");
						return;
					}
				}
				// initing the current directory, do not to wrap the function call in an "if" because the function will handle its own errors
				await init(config);
			// functions handle their own errors so do not need to do anything here
			} catch ( e ) {}
		})
	);
}

// This method is called when your extension is deactivated, currently does nothing
export function deactivate() {}