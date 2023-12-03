import {
  commands,
  ExtensionContext,
  languages,
  StatusBarAlignment,
  window,
  workspace,
} from "vscode";

import { CompletionProvider } from "./completion";
import { checkCompletions } from "./llama_check";

export function activate(context: ExtensionContext) {
  const config = workspace.getConfiguration("albus.general");
  const llamaconfig = workspace.getConfiguration("albus.llama.cpp");
  const _host = llamaconfig.get("host") as string;
  const _port = llamaconfig.get("port") as number;
  const statusBar = window.createStatusBarItem(StatusBarAlignment.Right);

  if (config.get("enabled")) {
    checkCompletions(_host, _port)
      .then((result) => {
        if (result) {
          // window.showInformationMessage('Connected to Llama!')
          statusBar.text = "Albus: $(code)";
          statusBar.tooltip = "Albus: Ready!";
          statusBar.show();
        } else {
          window.showErrorMessage(
            `Albus: Unable to connect to Llama server on ${_host}:${_port}`,
          );
          statusBar.text = "Albus: $(alert)";
          statusBar.tooltip = "llama.cpp - Error";
          statusBar.show();
        }
      })
      .catch((error) => {
        window.showErrorMessage(
          `Albus: Error while connecting to Llama server on ${_host}:${_port}`,
        );
        statusBar.text = "Albus: $(error)";
        statusBar.tooltip = "llama.cpp - Error";
        statusBar.show();
        console.error("Error checking API:", error);
      });
  } else {
    statusBar.text = "Albus: $(code)";
    statusBar.tooltip = "Disabled!";
    statusBar.show();
  }

  const completionProvider = new CompletionProvider(statusBar);

  context.subscriptions.push(
    languages.registerInlineCompletionItemProvider(
      { pattern: "**" },
      completionProvider,
    ),
    commands.registerCommand("albus.enable", () => {
      statusBar.show();
    }),
    commands.registerCommand("albus.disable", () => {
      statusBar.hide();
    }),
    statusBar,
  );

  context.subscriptions.push(
    workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration("albus")) {
        return;
      }

      completionProvider.updateConfig();
    }),
  );
}
