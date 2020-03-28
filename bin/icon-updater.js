let fs = require('fs');
let gitsvg = require('./git-branch-to-favicon.js');
const targetFile = 'src/favicon.svg';

const useStandalone = false;
if (useStandalone) {
    fs.writeFile(targetFile, gitsvg.getFullSVG(), function (err) {
        if (err) {
            throw err;
        }
        console.log(`Saved [${gitsvg.branchName}] branch icon to [${targetFile}]!`);
    });
} else {
    if (mergeSVGs(
        'src/favicon.prod.svg',
        gitsvg.getSubSVG(),
        targetFile)) {
        console.log(`Saved [${gitsvg.branchName}] branch icon to [${targetFile}]!`);
    };
}


function mergeSVGs(fullSrcFileName, addonContent, outputFileName) {
    try {
        let rawSVG = fs.readFileSync(fullSrcFileName).toString();

        let combinedContent = '';

        rawSVG.split('\n').forEach(element => {
            if (element.trim() === '</svg>') {
                combinedContent += addonContent;
            }
            combinedContent += element + '\n';
        });
        fs.writeFileSync(outputFileName, combinedContent);

        return true;
    } catch (error) {
        return false;
    }
}