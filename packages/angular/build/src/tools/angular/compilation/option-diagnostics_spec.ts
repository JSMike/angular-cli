/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import ts from 'typescript';
import { filterRepeatedOptionWarnings } from './option-diagnostics';

function warning(messageText: string): ts.Diagnostic {
  return {
    category: ts.DiagnosticCategory.Warning,
    code: 994011,
    file: undefined,
    start: undefined,
    length: undefined,
    messageText,
  };
}

function error(messageText: string): ts.Diagnostic {
  return { ...warning(messageText), category: ts.DiagnosticCategory.Error, code: 994012 };
}

describe('filterRepeatedOptionWarnings', () => {
  it('should report all diagnostics on the first build', () => {
    const input = [warning('W1'), warning('W2'), error('E1')];
    const result = filterRepeatedOptionWarnings(input, null);

    expect(result.diagnostics).toEqual(input);
    expect(result.reportedWarningTexts).toEqual(new Set(['W1', 'W2']));
  });

  it('should suppress warnings unchanged from the previous build', () => {
    const first = filterRepeatedOptionWarnings([warning('W1'), warning('W2')], null);
    const second = filterRepeatedOptionWarnings(
      [warning('W1'), warning('W2')],
      first.reportedWarningTexts,
    );

    expect(second.diagnostics).toEqual([]);
    // The texts remain recorded so a later change is still detected.
    expect(second.reportedWarningTexts).toEqual(new Set(['W1', 'W2']));
  });

  it('should re-report the full set when a warning is added', () => {
    const first = filterRepeatedOptionWarnings([warning('W1')], null);
    const second = filterRepeatedOptionWarnings(
      [warning('W1'), warning('W2')],
      first.reportedWarningTexts,
    );

    expect(second.diagnostics.map((d) => d.messageText)).toEqual(['W1', 'W2']);
  });

  it('should re-report the full set when a warning is removed', () => {
    const first = filterRepeatedOptionWarnings([warning('W1'), warning('W2')], null);
    const second = filterRepeatedOptionWarnings([warning('W1')], first.reportedWarningTexts);

    expect(second.diagnostics.map((d) => d.messageText)).toEqual(['W1']);
  });

  it('should always report error-category diagnostics', () => {
    const first = filterRepeatedOptionWarnings([warning('W1'), error('E1')], null);
    const second = filterRepeatedOptionWarnings(
      [warning('W1'), error('E1')],
      first.reportedWarningTexts,
    );

    expect(second.diagnostics.map((d) => d.messageText)).toEqual(['E1']);
  });

  it('should flatten diagnostic message chains for comparison', () => {
    const chained: ts.Diagnostic = {
      ...warning('outer'),
      messageText: {
        messageText: 'outer',
        category: ts.DiagnosticCategory.Warning,
        code: 1,
        next: undefined,
      },
    };
    const first = filterRepeatedOptionWarnings([chained], null);
    const second = filterRepeatedOptionWarnings([chained], first.reportedWarningTexts);

    expect(second.diagnostics).toEqual([]);
  });
});
