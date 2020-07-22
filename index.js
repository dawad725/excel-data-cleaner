const fs = require('fs');
const filename = process.argv[2];
const csv = require('csv-parser');


// const data = fs.readFileSync(filename, { encoding: "utf-8" });



fs.createReadStream(filename)
    .on('error', () => {
        // handle error
    })
    .pipe(csv())
    .on('data', (row) => {

        console.log(row);
    })
    .on('end', () => {
    });

