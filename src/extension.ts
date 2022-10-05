// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { UCQ } from './panel';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	const handler = async (doc: vscode.TextDocument) => {
		if(!doc.fileName.endsWith('.py')) {
			return;
		}
		vscode.window.showInformationMessage("Got py file!")
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
			UCQ.createOrShow(context.extensionUri);
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
