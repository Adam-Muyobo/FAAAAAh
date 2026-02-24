import * as vscode from 'vscode';
import { getConfig } from './config';
import { SoundPlayer } from './sound';
import { FaaaahTaskProvider } from './wrapperTask';

function isAllowedDiagnosticsLanguage(languageId: string, allowed: string[]): boolean {
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(languageId);
}

function countErrorDiagnostics(uri: vscode.Uri): number {
  return vscode.languages.getDiagnostics(uri).filter((d) => d.severity === vscode.DiagnosticSeverity.Error).length;
}

function uriKey(uri: vscode.Uri): string {
  return uri.toString();
}

function getTaskGroupId(task: vscode.Task): string | undefined {
  const g: any = task.group;
  if (!g) return undefined;
  return typeof g === 'string' ? g : g.id;
}

function taskNameMatches(task: vscode.Task, pattern: string): boolean {
  const p = (pattern || '').trim();
  if (!p) return true;
  try {
    return new RegExp(p).test(task.name);
  } catch {
    return true;
  }
}

function shouldTriggerForTaskFailure(task: vscode.Task): boolean {
  const cfg = getConfig();
  if (!cfg.playOnTaskFailure) return false;
  if (!taskNameMatches(task, cfg.taskNameRegex)) return false;

  if (cfg.taskFailureScope === 'all') return true;

  const gid = getTaskGroupId(task);
  return gid === 'test' || gid === 'build';
}

export function activate(context: vscode.ExtensionContext): void {
  const player = new SoundPlayer(context);

  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  status.command = 'faaaah.toggle';
  context.subscriptions.push(status);

  const diagSnapshot = new Map<string, number>();

  const play = async () => {
    const cfg = getConfig();
    if (!cfg.enabled) return;
    await player.play(cfg.soundPath, cfg.cooldownMs);
  };

  const updateStatus = () => {
    const cfg = getConfig();
    status.text = cfg.enabled ? 'FAAAAh: On' : 'FAAAAh: Off';
    status.tooltip = cfg.enabled
      ? 'FAAAAh is enabled (click to toggle)'
      : 'FAAAAh is disabled (click to toggle)';
    status.show();
  };

  const setEnabled = async (value: boolean) => {
    const cfg = vscode.workspace.getConfiguration('faaaah');
    await cfg.update('enabled', value, vscode.ConfigurationTarget.Global);
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('faaaah.play', async () => {
      await play();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('faaaah.toggle', async () => {
      const cfg = vscode.workspace.getConfiguration('faaaah');
      const enabled = cfg.get<boolean>('enabled', true);
      await setEnabled(!enabled);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('faaaah.on', async () => {
      await setEnabled(true);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('faaaah.off', async () => {
      await setEnabled(false);
    })
  );

  context.subscriptions.push(
    vscode.tasks.onDidEndTaskProcess(async (e) => {
      const exitCode = e.exitCode;
      if (exitCode === undefined || exitCode === 0) return;

      if (!shouldTriggerForTaskFailure(e.execution.task)) return;
      await play();
    })
  );

  const seedActiveDiagnosticsSnapshot = () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const cfg = getConfig();
    if (!cfg.playOnDiagnosticsError) return;
    if (!isAllowedDiagnosticsLanguage(editor.document.languageId, cfg.diagnosticsLanguages)) return;
    diagSnapshot.set(uriKey(editor.document.uri), countErrorDiagnostics(editor.document.uri));
  };

  seedActiveDiagnosticsSnapshot();

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => {
      seedActiveDiagnosticsSnapshot();
    })
  );

  const maybePlayForDiagnostics = async (uri: vscode.Uri) => {
    const cfg = getConfig();
    if (!cfg.enabled) return;
    if (!cfg.playOnDiagnosticsError) return;

    const editor = vscode.window.activeTextEditor;
    if (cfg.diagnosticsScope === 'activeFile') {
      if (!editor) return;
      if (uriKey(uri) !== uriKey(editor.document.uri)) return;
    }

    const doc = vscode.workspace.textDocuments.find((d) => uriKey(d.uri) === uriKey(uri));
    if (!doc) return;
    if (!isAllowedDiagnosticsLanguage(doc.languageId, cfg.diagnosticsLanguages)) return;

    const key = uriKey(uri);
    const prev = diagSnapshot.get(key) ?? 0;
    const next = countErrorDiagnostics(uri);
    diagSnapshot.set(key, next);

    if (prev === 0 && next > 0) {
      await play();
    }
  };

  context.subscriptions.push(
    vscode.languages.onDidChangeDiagnostics(async (e) => {
      const cfg = getConfig();
      if (cfg.diagnosticsTrigger !== 'change') return;
      for (const uri of e.uris) {
        await maybePlayForDiagnostics(uri);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (doc) => {
      const cfg = getConfig();
      if (cfg.diagnosticsTrigger !== 'save') return;
      await maybePlayForDiagnostics(doc.uri);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('faaaah.enabled')) updateStatus();
    })
  );

  updateStatus();

  context.subscriptions.push(vscode.tasks.registerTaskProvider(FaaaahTaskProvider.type, new FaaaahTaskProvider(play)));
}

export function deactivate(): void {}
