import { window } from 'vscode';

/**
 * Shows a pick list using window.showQuickPick().
 */
export async function showQuickPick() {
	let i = 0;
    let to_show:string[] = ['eins', 'zwei', 'drei'];
	const result = await window.showQuickPick(to_show, );
	window.showInformationMessage(`Got: ${result}`);
}
