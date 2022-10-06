import * as vscode from "vscode";
import * as path from 'path';
import { out } from "./src";

export class UCQ {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: UCQ | undefined;

  public static readonly viewType = "uc-quantum-lab";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (UCQ.currentPanel) {
      UCQ.currentPanel._panel.reveal(column);
      UCQ.currentPanel._update();
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      UCQ.viewType,
      "UCQ Viewer ",
      vscode.ViewColumn.Two,
      {
        // Enable javascript in the webview
        enableScripts: true,

        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "media"),
          vscode.Uri.joinPath(extensionUri, "out"),
        ],
      }
    );

    UCQ.currentPanel = new UCQ(panel, extensionUri);
  }

  public static kill() {
    UCQ.currentPanel?.dispose();
    UCQ.currentPanel = undefined;
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    UCQ.currentPanel = new UCQ(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // // Handle messages from the webview
    // this._panel.webview.onDidReceiveMessage(
    //   (message) => {
    //     switch (message.command) {
    //       case "alert":
    //         vscode.window.showErrorMessage(message.text);
    //         return;
    //     }
    //   },
    //   null,
    //   this._disposables
    // );
  }

  public dispose() {
    UCQ.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private async _update() {
    const webview = this._panel.webview;

    this._panel.webview.html = this._getHtmlForWebview(webview);
    webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {

        case "onInfo": {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }
        // case "tokens": {
        //   await Util.globalState.update(accessTokenKey, data.accessToken);
        //   await Util.globalState.update(refreshTokenKey, data.refreshToken);
        //   break;
        // }
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // // And the uri we use to load this script in the webview
    // const scriptUri = webview.asWebviewUri(
    //   vscode.Uri.joinPath(this._extensionUri, "out", "helloworld.js")
    // );

    // Uri to load styles into webview
    const stylesResetUri = webview.asWebviewUri(vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "reset.css"
    ));
    const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "vscode.css"
    ));

    // const cssUri = webview.asWebviewUri(
    //   vscode.Uri.joinPath(this._extensionUri, "out", "compiled/swiper.css")
    // );

    // Use a nonce to only allow specific scripts to be run
    const image_src = webview.asWebviewUri(vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "uc.png"
    ));
    out.appendLine(`<img src=\"${image_src.fsPath}\" />`)
    return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
	</head>
	<body>
		<h1>hello</h1>
    <img src=\"${image_src.fsPath}\" alt="No Image to Display"/>
	</body>
</html>`;
    // `<!DOCTYPE html>
	// 		<html lang="en">
	// 		<head>
	// 			<meta charset="UTF-8">
	// 			<!--
	// 				Use a content security policy to only allow loading images from https or from our extension directory,
	// 				and only allow scripts that have a specific nonce.
    //     -->
    //     <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource};">
	// 			<meta name="viewport" content="width=device-width, initial-scale=1.0">
	// 			<link href="${stylesResetUri}" rel="stylesheet">
	// 			<link href="${stylesMainUri}" rel="stylesheet">
    //     <script">
    //     </script>
	// 	</head>
    //     <body>
    //     </body>
    //     </html>`;
    //		<meta http-equiv="Content-Security-Policy">
		//<link href="${stylesResetUri}" rel="stylesheet">
		//<link href="${stylesMainUri}" rel="stylesheet">
  }
}