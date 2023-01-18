const path = require('path');
const fs = require('fs');
const ROOT = __dirname + "/../";

const SourceFolderName = "dist";
const TargetFolderName = "bin";
const version = "v1";
const source = path.join(ROOT, SourceFolderName);
const target = path.join(ROOT, TargetFolderName);

function move2bin() {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, 0744);
      }
      if (!fs.existsSync(target+'/'+version)) {
        fs.mkdirSync(target+'/'+version, 0744);
      }  
// destination will be created or overwritten by default.
fs.copyFile(source+'/'+version+'/nomie-plugin.js', target+'/'+version+'/nomie-plugin.js', (err) => {
    if (err) throw err;
    console.log('File was copied to destination');
  });
}

move2bin();