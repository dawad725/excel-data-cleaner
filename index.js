const fs = require('fs');
// const uploadedCSVFile = process.argv[2]; // production
const uploadedCSVFile = "/Users/Dave/Desktop/test2.csv"; // development

const csv = require('csv-parser');
const users = [];


// Make sure we have a csv file on the command line in order to proceed.
// If not lets show the user what the CLI expects
if (!uploadedCSVFile || uploadedCSVFile.length < 3) {
    console.log('Usage: node ' + '+ ' + process.argv[1] + ' +' + ' UPLOADED CSV File');
    process.exit(1);
}


fs.createReadStream(uploadedCSVFile)
    .on('error', () => {
        // handle error
    })
    .pipe(csv({
        //These options normalize the data so that everything is lowercase
        mapHeaders: ({ header }) => header.toLowerCase().trim(),
        mapValues: ({ value }) => value.toLowerCase().trim()
    }))
    .on('data', (row) => {

        // console.log(row.firstname)

        users.push(row)

    })
    .on('end', () => {
        // console.log(users)
        console.table(users);
        writeToCSVFile(users);
    });


// this function creates the new csv based on what we've extracted from the "extractAsCSV" function
function writeToCSVFile(users) {
    const cleanedCSVFile = 'cleaned.csv';
    fs.writeFile(cleanedCSVFile, extractAsCSV(users), err => {
        if (err) {
            console.log("Error writing to csv file", err);
        } else {
            console.log(`Saved as ${cleanedCSVFile} within this directory`)
        }
    });
};

// This function creates the headers we want and iterates through the values to create the rows of data
function extractAsCSV(users) {
    const headers = ["FirstName", "LastName", "Profession"];

    console.log("users", users)
    const rows = users.map(user => `${user.firstname}, ${user.lastname}, ${user.profession}`);
    return headers.concat(rows).join("\n");
}
