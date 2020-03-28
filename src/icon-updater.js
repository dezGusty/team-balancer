let fs = require('fs');
let svgdata = require('./git-branch-to-favicon.js');
const targetFile = 'src/favicon.svg';
fs.writeFile(targetFile, svgdata, function (err) {
    if (err) {
        throw err;
    }
    console.log('Saved branch icon to [' + targetFile + ']!');
}); 