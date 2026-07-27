/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import { buildApplication } from '../../index';
import {
  APPLICATION_BUILDER_INFO,
  BASE_OPTIONS,
  describeBuilder,
  expectLog,
  expectNoLog,
} from '../setup';

/**
 * Watch-mode coverage for `angularCompilerOptions.customElementsManifests`: manifest files —
 * including ones inside `node_modules` — are reported by the compiler as watch files, so editing
 * or creating one must update diagnostics without restarting the build.
 *
 * NOTE: requires an Angular framework version that supports `customElementsManifests`; against
 * older versions the option is ignored and these behaviors cannot be observed.
 */
describeBuilder(buildApplication, APPLICATION_BUILDER_INFO, (harness) => {
  describe('Behavior: "Rebuild custom elements manifests"', () => {
    function manifestContent(declarations: object[]): string {
      return JSON.stringify({
        schemaVersion: '1.0.0',
        modules: [{ path: 'element.js', declarations }],
      });
    }

    it('reports updated diagnostics when a manifest under node_modules changes', async () => {
      harness.useTarget('build', {
        ...BASE_OPTIONS,
        watch: true,
      });

      await harness.writeFile(
        'node_modules/@ce/lib/package.json',
        JSON.stringify({ name: '@ce/lib', customElements: './custom-elements.json' }),
      );
      await harness.writeFile(
        'node_modules/@ce/lib/custom-elements.json',
        manifestContent([
          { kind: 'class', name: 'CeElement', customElement: true, tagName: 'ce-element' },
        ]),
      );
      await harness.modifyFile('tsconfig.json', (content) => {
        const tsconfig = JSON.parse(content);
        tsconfig.angularCompilerOptions ??= {};
        tsconfig.angularCompilerOptions.customElementsManifests = ['@ce/lib'];

        return JSON.stringify(tsconfig);
      });

      await harness.executeWithCases([
        async ({ result, logs }) => {
          expect(result?.success).toBeTrue();
          expectNoLog(logs, 'NG4009');

          // Edit the manifest in place under node_modules: an invalid tag name must surface as
          // a new NG4009 warning on the rebuild, without restarting the process.
          await harness.writeFile(
            'node_modules/@ce/lib/custom-elements.json',
            manifestContent([
              { kind: 'class', name: 'CeElement', customElement: true, tagName: 'ce-element' },
              { kind: 'class', name: 'BadElement', customElement: true, tagName: 'NotAValidTag' },
            ]),
          );
        },
        async ({ result, logs }) => {
          expect(result?.success).toBeTrue();
          expectLog(logs, 'NG4009');
          expectLog(logs, 'NotAValidTag');
        },
      ]);
    });

    it('recovers when a missing configured manifest is created after startup', async () => {
      harness.useTarget('build', {
        ...BASE_OPTIONS,
        watch: true,
      });

      await harness.modifyFile('tsconfig.json', (content) => {
        const tsconfig = JSON.parse(content);
        tsconfig.angularCompilerOptions ??= {};
        tsconfig.angularCompilerOptions.customElementsManifests = ['./late-manifest.json'];

        return JSON.stringify(tsconfig);
      });

      await harness.executeWithCases([
        async ({ result, logs }) => {
          // The configured manifest does not exist: NG4007 is an error.
          expect(result?.success).toBeFalse();
          expectLog(logs, 'NG4007');

          await harness.writeFile(
            'late-manifest.json',
            manifestContent([
              { kind: 'class', name: 'LateElement', customElement: true, tagName: 'late-element' },
            ]),
          );
        },
        async ({ result, logs }) => {
          expect(result?.success).toBeTrue();
          expectNoLog(logs, 'NG4007');
        },
      ]);
    });
  });
});
