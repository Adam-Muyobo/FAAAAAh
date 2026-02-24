import * as vscode from 'vscode';
import { spawn } from 'node:child_process';
import { EXCEPTION_PROFILES } from './exceptionProfiles';
import { getConfig } from './config';

export type FaaaahTaskDefinition = vscode.TaskDefinition & {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  useShell?: boolean;
  exceptionProfiles?: string[];
};

export type PlayFn = () => Promise<void>;

function safeCompileRegex(pattern: string): RegExp | undefined {
  try {
    return new RegExp(pattern);
  } catch {
    return undefined;
  }
}

function buildRegexes(profileIds: string[], customRegexes: string[]): RegExp[] {
  const patterns: string[] = [];
  for (const id of profileIds) {
    const arr = EXCEPTION_PROFILES[id];
    if (arr) patterns.push(...arr);
  }
  patterns.push(...customRegexes);

  const out: RegExp[] = [];
  for (const p of patterns) {
    const r = safeCompileRegex(p);
    if (r) out.push(r);
  }
  return out;
}

class FaaaahPseudoterminal implements vscode.Pseudoterminal {
  private readonly writeEmitter = new vscode.EventEmitter<string>();
  onDidWrite = this.writeEmitter.event;

  private readonly closeEmitter = new vscode.EventEmitter<number>();
  onDidClose? = this.closeEmitter.event;

  private child: ReturnType<typeof spawn> | undefined;
  private buffer = '';
  private playedForException = false;

  constructor(private readonly def: FaaaahTaskDefinition, private readonly play: PlayFn) {}

  open(): void {
    const cfg = getConfig();

    const enabledProfiles = (this.def.exceptionProfiles?.length
      ? this.def.exceptionProfiles
      : cfg.enabledExceptionProfiles) as string[];
    const exceptionRegexes = buildRegexes(enabledProfiles, cfg.customExceptionRegexes);

    const useShell = this.def.useShell ?? true;
    const cwd = this.def.cwd || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const env = { ...process.env, ...(this.def.env || {}) } as NodeJS.ProcessEnv;

    this.child = spawn(this.def.command, this.def.args || [], {
      cwd,
      env,
      shell: useShell,
      windowsHide: true
    });

    this.child.on('error', (err) => {
      this.writeEmitter.fire(`\r\nFAAAAh wrapper task failed to start: ${String(err)}\r\n`);
      this.closeEmitter.fire(1);
    });

    const onData = (chunk: Buffer) => {
      const s = chunk.toString('utf8');
      this.writeEmitter.fire(s.replace(/\n/g, '\r\n'));

      if (!cfg.playOnExceptionOutput || this.playedForException) return;

      this.buffer += s;
      const parts = this.buffer.split(/\r?\n/);
      this.buffer = parts.pop() || '';
      for (const line of parts) {
        if (this.playedForException) break;
        for (const r of exceptionRegexes) {
          if (r.test(line)) {
            this.playedForException = true;
            void this.play();
            break;
          }
        }
      }
    };

    this.child.stdout?.on('data', onData);
    this.child.stderr?.on('data', onData);

    this.child.on('close', (code) => {
      this.closeEmitter.fire(code ?? 0);
    });
  }

  close(): void {
    this.child?.kill();
  }
}

export class FaaaahTaskProvider implements vscode.TaskProvider {
  static readonly type = 'faaaah';

  constructor(private readonly play: PlayFn) {}

  provideTasks(): vscode.ProviderResult<vscode.Task[]> {
    return [];
  }

  resolveTask(task: vscode.Task): vscode.ProviderResult<vscode.Task> {
    const def = task.definition as FaaaahTaskDefinition;
    if (!def?.command) return undefined;

    const execution = new vscode.CustomExecution(async () => {
      return new FaaaahPseudoterminal(def, this.play);
    });

    const resolved = new vscode.Task(def, task.scope ?? vscode.TaskScope.Workspace, task.name, FaaaahTaskProvider.type, execution);
    resolved.group = task.group;
    resolved.presentationOptions = task.presentationOptions;
    resolved.problemMatchers = task.problemMatchers;
    return resolved;
  }
}
