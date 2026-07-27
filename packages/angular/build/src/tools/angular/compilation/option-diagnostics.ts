/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import ts from 'typescript';

/** Result of filtering option diagnostics against a previous build's reported warnings. */
export interface OptionWarningFilterResult {
  /** The diagnostics to report for this build. */
  diagnostics: ts.Diagnostic[];
  /** The flattened texts of all warning-category diagnostics seen in this build. */
  reportedWarningTexts: Set<string>;
}

/**
 * Filters option diagnostics for watch-mode reporting: warning-category diagnostics whose
 * flattened text set is identical to the previously reported set are suppressed, so unchanged
 * warnings (such as Custom Elements Manifest warnings) are not re-reported on every rebuild.
 * Any change in the warning set re-reports all of them so no context is lost, and
 * error-category diagnostics are always reported.
 */
export function filterRepeatedOptionWarnings(
  optionDiagnostics: Iterable<ts.Diagnostic>,
  previouslyReported: ReadonlySet<string> | null,
): OptionWarningFilterResult {
  const diagnostics = [...optionDiagnostics];
  const reportedWarningTexts = new Set<string>();
  for (const diagnostic of diagnostics) {
    if (diagnostic.category === ts.DiagnosticCategory.Warning) {
      reportedWarningTexts.add(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
    }
  }

  const unchanged =
    previouslyReported !== null &&
    previouslyReported.size === reportedWarningTexts.size &&
    [...reportedWarningTexts].every((text) => previouslyReported.has(text));

  return {
    diagnostics: unchanged
      ? diagnostics.filter((diagnostic) => diagnostic.category !== ts.DiagnosticCategory.Warning)
      : diagnostics,
    reportedWarningTexts,
  };
}
