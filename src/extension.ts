// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  function checkIfStyleFile(fileName: string): boolean {
    if (fileName?.includes("styles") || fileName?.includes("style")) {
      vscode.window.showInformationMessage("This is a style file");
      return true;
    } else {
      vscode.window.showInformationMessage("This is not a style file");
      return false;
    }
  }

  function getStyleVariables() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      return null;
    }
    let document = editor.document;
    let text = document.getText();
    let lines = text.split("\n");
    let variables = [];
    for (let line of lines) {
      if (line.includes(":") && line.includes("{")) {
        let variable = line.split(":")[0].replace(/\s/g, "");
        variables.push(variable);
      }
    }
    return variables;
  }

  function checkOccurrence(variables: string[], siblingFullPath: string) {
    const fileContaent = fs.readFileSync(siblingFullPath, {
      encoding: "utf8",
      flag: "r",
    });
    let variablesOccurrence = variables.filter((variable: string) => {
      if (
        !(
          fileContaent.includes(`style.${variable}`) ||
          fileContaent.includes(`styles.${variable}`)
        )
      ) {
        vscode.window.showInformationMessage(
          `Variable ${variable} is used in ${siblingFullPath}`
        );
        return true;
      }
    });
    return variablesOccurrence;
  }

  function startWatching(
    fileName: string | undefined,
    siblingFullPath: string
  ) {
    if (!checkIfStyleFile(fileName as string)) return;
    let variables = getStyleVariables();
    if (!variables) return;
    let unusedStyles = checkOccurrence(variables, siblingFullPath);
    vscode.window.showInformationMessage("unusedStyles: " + unusedStyles);
  }

  function checkSiblings(fileName: string) {
    let dirPathArray = fileName.split("/");
    let activeFileName = dirPathArray[dirPathArray.length - 1];
    dirPathArray.pop();
    let dirPath = dirPathArray.join("/");
    let dir = fs.readdirSync(dirPath);
    let sibling = activeFileName.replace(".style", "");
    let hasSiblings = dir.includes(sibling);
    let siblingFullPath = dirPath + "/" + sibling;
    if (hasSiblings) {
      return { hasSiblings, siblingFullPath };
    }
    return { hasSiblings };
  }

  function main(document: vscode.TextDocument | undefined) {
    let fileName = document?.fileName;
    let filePath = document?.uri?.fsPath;
    console.log({ filePath });

    if (!fileName || !filePath) {
      return;
    }
    let { hasSiblings, siblingFullPath } = checkSiblings(fileName);
    if (!hasSiblings) {
      return;
    }
    startWatching(fileName as string, siblingFullPath as string);
  }

  vscode.window.onDidChangeActiveTextEditor((e) => {
    main(e?.document);
  });
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "removeUnusedStyle.checkUnusedStyles",
    () => {
      main(vscode.window.activeTextEditor?.document);
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
