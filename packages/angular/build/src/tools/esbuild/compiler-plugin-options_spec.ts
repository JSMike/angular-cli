/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import type { NormalizedApplicationBuildOptions } from '../../builders/application/options';
import type { SourceFileCache } from './angular/source-file-cache';
import { createCompilerPluginOptions } from './compiler-plugin-options';

function normalizedOptions(
  overrides: Partial<NormalizedApplicationBuildOptions>,
): NormalizedApplicationBuildOptions {
  return {
    sourcemapOptions: { scripts: false, styles: false, hidden: false, vendor: false },
    tsconfig: '/project/tsconfig.json',
    optimizationOptions: { scripts: false, styles: false, fonts: false },
    ...overrides,
  } as unknown as NormalizedApplicationBuildOptions;
}

describe('createCompilerPluginOptions', () => {
  const sourceFileCache = undefined as unknown as SourceFileCache;

  it('should map the builder verbose option to verboseDiagnostics', () => {
    const options = createCompilerPluginOptions(
      normalizedOptions({ verbose: true }),
      sourceFileCache,
    );

    expect(options.verboseDiagnostics).toBe(true);
  });

  it('should not enable verboseDiagnostics by default', () => {
    const options = createCompilerPluginOptions(normalizedOptions({}), sourceFileCache);

    expect(options.verboseDiagnostics).toBe(false);
  });
});
