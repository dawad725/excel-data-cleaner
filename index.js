const fs = require('fs');
const csv = require('csv-parser');
const moment = require('moment');
moment.suppressDeprecationWarnings = true;

// const uploadedCSVFile = process.argv[2]; // production
const uploadedCSVFile = "./test2.csv"; // development


const users = [];
const errors = [];

const configuration = {
    "firstname": {
        type: "text",
        cleaners: ["neuter"]
    },
    "lastname": {
        type: "text",
        cleaners: ["neuter"]
    },
    "age": {
        type: "integer",
        cleaners: ["numberOnly"]
    },
    "role": {
        type: "text",
        cleaners: ["neuter"]
    },
    "salary": {
        type: "decimal",
        cleaners: ["toFixed2"]
    },
    "hiredate": {
        type: "date",
        cleaners: ["dateFormat"]
    }
}

const cleaners = {
    //Transform to a string and lowercase and trim it.
    "neuter": (v) => {
        return v.toString().toLowerCase().trim()
    },
    //This function rounds to the nearest tenth place for decimals and removes the comma 
    "toFixed2": (v) => {
        // return parseFloat(v.toString()).toFixed(2)
        let noCommas = v.replace(/,/g, '')
        let floatVal = parseFloat(v)
        let fixedVal = floatVal.toFixed(2)
        return fixedVal

    },
    // Extract only numbers from the string and then joins them to form a whole value.
    "numberOnly": (v) => {
        return parseFloat(v.match(/\d/g).join(''))
    },
    // using moment.js to format the date column
    "dateFormat": (v) => {
        return moment(v).format('LL')
    }
}

// Here we are validating the values of the roles 
const validators = {
    "text": function (v) {

        // only letters and spaces
        let valid = /^[a-z][a-z\s]*$/
        if (!valid.test(v)) {
            throw new Error(`Invalid text value expected only letters, got: ${v}`)
        }

    },
    "integer": function (v) {
        let valid = /^[1-9]\d*$/
        if (!valid.test(v)) {
            throw new Error(`Invalid integer value, expected only numbers, got: ${v}`)
        }
    }

}


// Make sure we getting a csv file on the command line in order to proceed.
// If not lets show the user what the CLI expects and exit 
if (!uploadedCSVFile || uploadedCSVFile.length < 3) {
    console.log('Usage: node ' + '+ ' + process.argv[1] + ' +' + ' UPLOADED CSV File');
    process.exit(1);
}


fs.createReadStream(uploadedCSVFile)
    .on('error', () => {
        // handle error
    })
    .pipe(csv({ mapHeaders: ({ header, index }) => header.toLowerCase().trim() }))
    .on('data', (row) => {


        try {
            Object.keys(row).forEach(fieldName => {

                let columnConfig = configuration[fieldName.trim()];
                let value = row[fieldName];
                if (columnConfig) {
                    //If there are cleaners setup for this column type, then lets 
                    //loop through the cleaners and assign it to our value 
                    if (columnConfig.cleaners) {
                        columnConfig.cleaners.forEach(clean => {
                            value = cleaners[clean](value)
                        })
                    }

                    // After the changes we add it back to the assigned fieldName it came from
                    row[fieldName] = value

                    //Here we're checking to see if there is a validator set up for this type 
                    if (validators[columnConfig.type]) {

                        // If so, lets make sure we're getting what we expect based on the type 
                        validators[columnConfig.type](value)
                    }


                } else {
                    console.log(`Configuration for ${fieldName} not found.`)
                }
            })
            //Now that we're done with the changes, we push changed data to the users array
            users.push(row)
        } catch (e) {
            // TODO: store the row in errors for later writing to errors.csv
            errors.push(row)
            console.log("errors Array", errors)
            console.error(e)
        }



    })
    .on('end', () => {
        console.table(users)
        console.table(errors)
        writeToCSVFile("cleaned", users)
        writeToCSVFile("errors", errors)
    });


// This function creates the new CSV flie based on whats returned from the "extractAsCSV" function.
function writeToCSVFile(name) {
    const cleanedCSVFile = `${name}.csv`;
    fs.writeFile(cleanedCSVFile, extractAsCSV(users), err => {
        if (err) {
            console.log("Error writing to csv file", err);
        } else {
            console.log(`Saved as "${cleanedCSVFile}" within this directory`)
        }
    });
};

// This function creates the headers we want and iterates through the values to create the rows of data
function extractAsCSV(users) {
    const headers = ["FirstName", "LastName", "Age ", "Role", "Salary", "Hire Date"];

    const rows = users.map(user => `${user.firstname}, ${user.lastname}, ${user.age},${user.role}, ${user.salary},${user.hiredate}`);
    return `${headers.join(",")}\n${rows.join("\n")}`
}
