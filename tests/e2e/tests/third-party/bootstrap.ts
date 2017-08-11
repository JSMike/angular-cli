import {npm, ng} from '../../utils/process';
import {updateJsonFile} from '../../utils/project';
import {expectFileToMatch} from '../../utils/fs';
import {oneLineTrim} from 'common-tags';


export default function() {
  return Promise.resolve()
    .then(() => npm('install', 'jquery@3.2.1'))
    .then(() => npm('install', 'popper.js@1.11.0'))
    .then(() => npm('install', 'bootstrap@next'))
    .then(() => updateJsonFile('.angular-cli.json', configJson => {
      const app = configJson['apps'][0];
      app['styles'].push('../node_modules/bootstrap/dist/css/bootstrap.css');
      app['scripts'].push(
        '../node_modules/jquery/dist/jquery.js',
        '../node_modules/popper.js/dist/popper.js',
        '../node_modules/bootstrap/dist/js/bootstrap.js'
      );
    }))
    .then(() => ng('build', '--extract-css'))
    .then(() => expectFileToMatch('dist/scripts.bundle.js', '* jQuery JavaScript'))
    .then(() => expectFileToMatch('dist/scripts.bundle.js', '* @fileOverview Kickass library to create and place poppers'))
    .then(() => expectFileToMatch('dist/scripts.bundle.js', '* Bootstrap'))
    .then(() => expectFileToMatch('dist/styles.bundle.css', '* Bootstrap'))
    .then(() => expectFileToMatch('dist/index.html', oneLineTrim`
      <script type="text/javascript" src="inline.bundle.js"></script>
      <script type="text/javascript" src="polyfills.bundle.js"></script>
      <script type="text/javascript" src="scripts.bundle.js"></script>
      <script type="text/javascript" src="vendor.bundle.js"></script>
      <script type="text/javascript" src="main.bundle.js"></script>
    `));
}
