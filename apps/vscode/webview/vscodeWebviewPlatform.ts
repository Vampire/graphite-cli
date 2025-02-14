import type { RepoRelativePath } from "@withgraphite/gti-cli-shared-types";
import type { Comparison } from "@withgraphite/gti-shared/Comparison";
import type { Platform } from "@withgraphite/gti/src/platform";
import type { ThemeColor } from "@withgraphite/gti/src/theme";

export const vscodeWebviewPlatform: Platform = {
  platformName: "vscode",
  confirm: (message: string, details?: string | undefined) => {
    window.clientToServerAPI?.postMessage({
      type: "platform/confirm",
      message,
      details,
    });

    // wait for confirmation result
    return new Promise<boolean>((res) => {
      const disposable = window.clientToServerAPI?.onMessageOfType(
        "platform/confirmResult",
        (event) => {
          res(event.result);
          disposable?.dispose();
        }
      );
    });
  },
  openFile: (path, options) =>
    window.clientToServerAPI?.postMessage({
      type: "platform/openFile",
      path,
      options,
    }),
  openDiff: (path: RepoRelativePath, comparison: Comparison) =>
    window.clientToServerAPI?.postMessage({
      type: "platform/openDiff",
      path,
      comparison,
    }),
  openExternalLink: (url) => {
    window.clientToServerAPI?.postMessage({
      type: "platform/openExternal",
      url,
    });
  },
  clipboardCopy: (data) => navigator.clipboard.writeText(data),

  theme: {
    getTheme,
    onDidChangeTheme(callback: (theme: ThemeColor) => unknown) {
      let lastValue = getTheme();
      // VS Code sets the theme inside the webview by adding a class to `document.body`.
      // Listen for changes to body to possibly update the theme value.
      const observer = new MutationObserver(
        (_mutationList: Array<MutationRecord>) => {
          const newValue = getTheme();
          if (lastValue !== newValue) {
            callback(newValue);
            lastValue = newValue;
          }
        }
      );
      observer.observe(document.body, {
        attributes: true,
        childList: false,
        subtree: false,
      });
      return { dispose: () => observer.disconnect() };
    },
  },
};

function getTheme(): ThemeColor {
  return document.body.className.includes("vscode-light") ? "light" : "dark";
}
