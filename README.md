# FAAAAAh

<p align="center">
  <img src="images/icon.png" alt="FAAAAh logo" width="256" />
</p>

Plays the famous `FAAAAAAAh` meme sound when tasks fail (non-zero exit code) and, optionally, when exceptions are detected in output.

## Quick Start

- Command Palette: `FAAAAh: Play Sound`
- Introduce a syntax error in the active file (default: plays when active file goes from 0 -> 1+ diagnostics errors)
- If it gets annoying: Command Palette `FAAAAh: Off` or click the status bar `FAAAAh: On/Off`

## What Triggers The Sound

- Task failure (default): any VS Code task in the `Test` or `Build` task groups that exits non-zero.
- Exception output (optional): only for tasks of `type: "faaaah"` (wrapper tasks), so the extension can scan stdout/stderr.
- Diagnostics errors (default): when the active file transitions from 0 errors to 1+ errors in the Problems/diagnostics system (e.g. Python syntax errors while typing).

## Settings

- `faaaah.enabled`: enable/disable.
- `faaaah.cooldownMs`: spam protection.
- `faaaah.taskFailureScope`: `testBuild` (default) or `all`.
- `faaaah.playOnExceptionOutput`: wrapper-task exception detection.
- `faaaah.playOnDiagnosticsError`: play on new diagnostics errors.
- `faaaah.diagnosticsScope`: `activeFile` (default) or `workspace`.
- `faaaah.diagnosticsTrigger`: `change` (default) or `save`.
- `faaaah.enabledExceptionProfiles`: includes `java`, `springboot`, `javascript`, `python`, `cpp`, `csharp`, `flutter`.

## Quick Off Switch

- Command Palette: `FAAAAh: Off`
- Status bar: click `FAAAAh: On/Off`

## Example tasks.json

Wrap any command so exception output can be detected:

```jsonc
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "pytest (faaaah)",
      "type": "faaaah",
      "command": "pytest",
      "args": ["-q"],
      "group": "test"
    },
    {
      "label": "Spring Boot run (faaaah)",
      "type": "faaaah",
      "command": "mvn",
      "args": ["spring-boot:run"],
      "group": "build",
      "exceptionProfiles": ["springboot", "java", "common"]
    },
    {
      "label": "Flutter test (faaaah)",
      "type": "faaaah",
      "command": "flutter",
      "args": ["test"],
      "group": "test",
      "exceptionProfiles": ["flutter", "common"]
    }
  ]
}
```

## Bundled sound

By default, the extension plays the bundled `media/faaaah.wav`. You can override it with `faaaah.soundPath`.
