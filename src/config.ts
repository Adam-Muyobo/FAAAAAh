import * as vscode from 'vscode';

export type TaskFailureScope = 'testBuild' | 'all';

export type DiagnosticsScope = 'activeFile' | 'workspace';
export type DiagnosticsTrigger = 'change' | 'save';

export type FaaaahConfig = {
  enabled: boolean;
  cooldownMs: number;
  soundPath: string;

  playOnTaskFailure: boolean;
  taskFailureScope: TaskFailureScope;
  taskNameRegex: string;

  playOnExceptionOutput: boolean;

  playOnDiagnosticsError: boolean;
  diagnosticsScope: DiagnosticsScope;
  diagnosticsTrigger: DiagnosticsTrigger;
  diagnosticsLanguages: string[];

  enabledExceptionProfiles: string[];
  customExceptionRegexes: string[];
};

export function getConfig(): FaaaahConfig {
  const cfg = vscode.workspace.getConfiguration('faaaah');
  return {
    enabled: cfg.get<boolean>('enabled', true),
    cooldownMs: cfg.get<number>('cooldownMs', 2000),
    soundPath: cfg.get<string>('soundPath', ''),

    playOnTaskFailure: cfg.get<boolean>('playOnTaskFailure', true),
    taskFailureScope: cfg.get<TaskFailureScope>('taskFailureScope', 'testBuild'),
    taskNameRegex: cfg.get<string>('taskNameRegex', ''),

    playOnExceptionOutput: cfg.get<boolean>('playOnExceptionOutput', true),

    playOnDiagnosticsError: cfg.get<boolean>('playOnDiagnosticsError', true),
    diagnosticsScope: cfg.get<DiagnosticsScope>('diagnosticsScope', 'activeFile'),
    diagnosticsTrigger: cfg.get<DiagnosticsTrigger>('diagnosticsTrigger', 'change'),
    diagnosticsLanguages: cfg.get<string[]>('diagnosticsLanguages', []),

    enabledExceptionProfiles: cfg.get<string[]>('enabledExceptionProfiles', []),
    customExceptionRegexes: cfg.get<string[]>('customExceptionRegexes', [])
  };
}
