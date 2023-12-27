import {
  InlineCompletionItem,
  InlineCompletionItemProvider,
  InlineCompletionList,
  Position,
  Range,
  TextDocument,
  workspace,
  StatusBarItem,
  window,
} from "vscode";
import { streamResponse } from "./utils";
import { checkCompletions } from "./llama_check";

export class CompletionProvider implements InlineCompletionItemProvider {
  private _statusBar: StatusBarItem;
  private _lineContexts: string[] = [];
  private _lineContextLength = 10;
  private _lineContextTimeout = 200;
  private _debouncer: NodeJS.Timeout | undefined;
  private _config = workspace.getConfiguration("albus.general");
  private _llamaconfig = workspace.getConfiguration("albus.llama.cpp");
  private _debounceWait = this._config.get("debounceWait") as number;
  private _contextLength = this._config.get("contextLength") as number;
  private _host = this._llamaconfig.get("host") as string;
  private _port = this._llamaconfig.get("port") as number;
  private _model = this._llamaconfig.get("model") as string;
  private _temp = this._llamaconfig.get("temperature") as number;
  private _repeat_penalty = this._llamaconfig.get("repeat_penalty") as number;
  private _seed = this._llamaconfig.get("seed") as number;
  private _stream = this._llamaconfig.get("stream") as boolean;
  private _max_tokens = this._llamaconfig.get("max_tokens") as number;
  private _stop_strings = this._llamaconfig.get(
    "stop_strings",
  ) as Array<string>;

  constructor(statusBar: StatusBarItem) {
    this._statusBar = statusBar;
    this.registerOnChangeContextListener();
  }

  public async provideInlineCompletionItems(
    document: TextDocument,
    position: Position,
  ): Promise<InlineCompletionItem[] | InlineCompletionList | null | undefined> {
    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }

    const line = editor.document.lineAt(position.line);

    const charsAfterRange = new Range(editor.selection.start, line.range.end);

    const textAfterCursor = editor.document.getText(charsAfterRange);

    if (textAfterCursor.trim()) {
      return;
    }

    // TODO: Implement code completion based on selected languages
    // if (editor.document.languageId !== 'python') {
    //   return
    // }

    return new Promise((resolve) => {
      if (this._debouncer) {
        clearTimeout(this._debouncer);
      }

      this._debouncer = setTimeout(async () => {
        if (!this._config.get("enabled")) return resolve([]);

        const prompt = this.getPrompt(document, position);

        if (!prompt) return resolve([] as InlineCompletionItem[]);

        let completion = "";
        const data = {
          prompt: prompt,
          temperature: this._temp,
          repeat_penalty: this._repeat_penalty,
          seed: this._seed,
          stop: this._stop_strings,
          stream: this._stream,
          max_tokens: this._max_tokens,
          model: this._model,
        };

        try {
          this._statusBar.text = "Albus: $(code)";
          this._statusBar.tooltip = "Albus: Ready!";

          await new Promise((resolveStream) => {
            this._statusBar.text = "Albus: $(loading~spin)";
            this._statusBar.tooltip = "Albus: Thinking...";

            streamResponse(
              {
                hostname: this._host,
                port: this._port,
                method: "POST",
                path: "/v1/completions",
              },
              data,
              (chunk, onComplete) => {
                try {
                  let jsondata = Object();
                  if (data.stream) {
                    jsondata = JSON.parse(
                      chunk.substring(chunk.indexOf("{"), chunk.length).trim(),
                    );
                  } else {
                    jsondata = JSON.parse(chunk);
                  }
                  completion = completion + jsondata.choices[0].text;
                  if (jsondata.choices[0].finish_reason !== null) {
                    onComplete();
                    resolveStream(null);
                    this._statusBar.text = "Albus: $(code)";
                    this._statusBar.tooltip = "Albus: Complete!";
                    resolve(
                      this.getInlineCompletions(completion, position, document),
                    );
                  }
                } catch (error) {
                  console.error("Error parsing JSON:", error);
                  return;
                }
              },
            );
          });
        } catch (error) {
          this._statusBar.text = "Albus: $(alert)";
          this._statusBar.tooltip = "Albus: Backend error!";
          return resolve([] as InlineCompletionItem[]);
        }
      }, this._debounceWait as number);
    });
  }

  private getPrompt(document: TextDocument, position: Position) {
    const { prefix, suffix, languageId } = this.getContext(document, position);

    // return `Below are code blocks with prefix and suffix:\nWrite the code for the middle.\n<PRE> ${prefix} <SUF> ${suffix} <MID>`;
    // return '<PRE>```' + languageId + '\n' + prefix + '```<SUF>```'  + languageId + '\n' + suffix + '```<MID>```'
    return `${prefix}`;
  }

  private registerOnChangeContextListener() {
    let timeout: NodeJS.Timer | undefined;
    window.onDidChangeTextEditorSelection((e) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        const editor = window.activeTextEditor;
        if (!editor) return;
        const document = editor.document;
        const line = editor.document.lineAt(e.selections[0].anchor.line);
        const lineText = document.getText(
          new Range(
            line.lineNumber,
            0,
            line.lineNumber,
            line.range.end.character,
          ),
        );
        if (lineText.trim().length < 2) return; // most likely a bracket or un-interesting
        if (this._lineContexts.length === this._lineContextLength) {
          this._lineContexts.pop();
        }
        this._lineContexts.unshift(lineText.trim());
        this._lineContexts = [...new Set(this._lineContexts)];
      }, this._lineContextTimeout);
    });
  }

  private getContext(
    document: TextDocument,
    position: Position,
  ): { prefix: string; suffix: string; languageId: string } {
    const start = Math.max(0, position.line - this._contextLength);
    const prefix = document.getText(
      new Range(start, 0, position.line, this._contextLength),
    );
    const suffix = document.getText(
      new Range(
        position.line,
        position.character,
        position.line + this._contextLength,
        0,
      ),
    );
    return { prefix, suffix, languageId: document.languageId };
  }

  private getInlineCompletions(
    completion: string,
    position: Position,
    document: TextDocument,
  ): InlineCompletionItem[] {
    const editor = window.activeTextEditor;
    if (!editor) return [];
    if (position.character === 0) {
      return [
        new InlineCompletionItem(
          completion as string,
          new Range(position, position),
        ),
      ];
    }

    const charBeforeRange = new Range(
      position.translate(0, -1),
      editor.selection.start,
    );

    const charBefore = document.getText(charBeforeRange);

    if (completion === " " && charBefore === " ") {
      completion = completion.slice(1, completion.length);
    }

    return [
      new InlineCompletionItem(
        completion.trim() as string,
        new Range(position, position),
      ),
    ];
  }

  public updateConfig() {
    this._config = workspace.getConfiguration("albus.general");
    this._debounceWait = this._config.get("debounceWait") as number;
    this._contextLength = this._config.get("contextLength") as number;

    if (this._config.get("enabled")) {
      checkCompletions(this._host, this._port)
        .then((result) => {
          if (result) {
            // window.showInformationMessage('Connected to Llama!')
            this._statusBar.text = "Albus: $(code)";
            this._statusBar.tooltip = "Albus: Ready!";
            this._statusBar.show();
          } else {
            window.showErrorMessage(
              `Albus: Unable to connect to Llama server on ${this._host}:${this._port}`,
            );
            this._statusBar.text = "Albus: $(alert)";
            this._statusBar.tooltip = "llama.cpp - Error";
            this._statusBar.show();
          }
        })
        .catch((error) => {
          window.showErrorMessage(
            `Albus: Error while connecting to Llama server on ${this._host}:${this._port}`,
          );
          this._statusBar.text = "Albus: $(error)";
          this._statusBar.tooltip = "llama.cpp - Error";
          this._statusBar.show();
          console.error("Error checking API:", error);
        });
    } else {
      this._statusBar.text = "Albus: $(code)";
      this._statusBar.tooltip = "Disabled!";
      this._statusBar.show();
    }
  }
}
