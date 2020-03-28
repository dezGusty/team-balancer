let fs = require('fs');
let gitsvg = require('./git-branch-to-favicon.js');
const targetFile = 'src/favicon.svg';
fs.writeFile(targetFile, gitsvg.getFullSVG(), function (err) {
    if (err) {
        throw err;
    }
    console.log(`Saved [${gitsvg.branchName}] branch icon to [${targetFile}]!`);
}); 