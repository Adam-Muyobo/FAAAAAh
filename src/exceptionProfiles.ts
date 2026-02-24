export type ExceptionProfileId =
  | 'common'
  | 'java'
  | 'springboot'
  | 'javascript'
  | 'python'
  | 'csharp'
  | 'cpp'
  | 'flutter';

export const EXCEPTION_PROFILES: Record<string, string[]> = {
  common: [
    // generic crash/fatal patterns
    'Segmentation fault',
    'AssertionError',
    '\\bFATAL\\b',
    '\\bfatal error\\b',
    '\\bpanic:\\b'
  ],
  java: [
    'Exception in thread',
    '^\\s*Caused by:',
    '^\\s*at\\s+\\S+\\(.*\\)$'
  ],
  springboot: [
    'APPLICATION FAILED TO START',
    'org\\.springframework\\.[A-Za-z0-9_.]+' ,
    'BeanCreationException',
    'Failed to configure a DataSource',
    '^\\s*Caused by:'
  ],
  javascript: [
    '^(Error|TypeError|ReferenceError|SyntaxError|RangeError):',
    '^\\s*at\\s+\\S+'
  ],
  python: [
    'Traceback \\((most recent call last)\\):',
    '^\\w+(Error|Exception):'
  ],
  csharp: [
    'Unhandled exception',
    '^System\\.[A-Za-z0-9_.]+Exception:',
    '^\\s*at\\s+\\S+'
  ],
  cpp: [
    'terminate called after throwing',
    'libc\\+\\+abi: terminating',
    '\\bwhat\\(\\):',
    'AddressSanitizer:',
    'UndefinedBehaviorSanitizer:'
  ],
  flutter: [
    'Unhandled exception:',
    'Exception caught by',
    '^\\s*#\\d+\\s+\\S+',
    'package:flutter/'
  ]
};
