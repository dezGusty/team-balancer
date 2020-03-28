let fs = require('fs');
let svgdata = require('./git-branch-to-favicon.js');

fs.writeFile('src/favicon.svg', svgdata, function (err) {
    if (err) throw err;
    console.log('Saved!');
}); 