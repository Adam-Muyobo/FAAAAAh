import * as vscode from 'vscode';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs';

const execFileAsync = promisify(execFile);

export class SoundPlayer {
  private lastPlayAt = 0;
  private warnedPlaybackFailure = false;

  constructor(private readonly context: vscode.ExtensionContext) {}

  async play(soundPathOverride: string, cooldownMs: number): Promise<void> {
    const now = Date.now();
    if (cooldownMs > 0 && now - this.lastPlayAt < cooldownMs) return;
    this.lastPlayAt = now;

    const soundPath = (soundPathOverride || '').trim() || this.context.asAbsolutePath('media/faaaah.wav');
    if (!fs.existsSync(soundPath)) {
      this.warnOnce(`FAAAAh: sound file not found: ${soundPath}`);
      return;
    }

    try {
      await this.playPlatform(soundPath);
    } catch (err) {
      this.warnOnce(
        `FAAAAh: failed to play sound (${process.platform}). You can set faaaah.soundPath. Details: ${String(
          err
        )}`
      );
    }
  }

  private async playPlatform(soundPath: string): Promise<void> {
    if (process.platform === 'win32') {
      const p = soundPath.replace(/'/g, "''");
      const cmd = `$p='${p}'; $sp=New-Object System.Media.SoundPlayer $p; $sp.Load(); $sp.PlaySync();`;
      await execFileAsync('powershell', ['-NoProfile', '-Command', cmd], { windowsHide: true });
      return;
    }

    if (process.platform === 'darwin') {
      await execFileAsync('afplay', [soundPath]);
      return;
    }

    // linux and others
    try {
      await execFileAsync('paplay', [soundPath]);
    } catch {
      await execFileAsync('aplay', [soundPath]);
    }
  }

  private warnOnce(message: string): void {
    if (this.warnedPlaybackFailure) return;
    this.warnedPlaybackFailure = true;
    void vscode.window.showWarningMessage(message);
  }
}
