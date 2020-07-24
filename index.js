const fs = require('fs');
const csv = require('csv-parser');
const moment = require('moment');
moment.suppressDeprecationWarnings = true;

const uploadedCSVFile = process.argv[2]; // production
// const uploadedCSVFile = "./test.csv"; // development

const users = [];
const errors = [];

// Make sure we're getting a csv file on the command line in order to proceed.
// If not lets show the user what the CLI expects and exit the program 
if (!uploadedCSVFile || uploadedCSVFile.length < 3) {
    console.log('Usage: npm start ' + '+ ' + ' UPLOADED CSV File');
    process.exit(1);
}


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
    },
    "email": {
        type: "email",
        cleaners: ["emailFormat"]
    }
}

const cleaners = {
    //Change to a string and lowercase and trim white spaces.
    "neuter": (v) => {
        let string = v.toString().toLowerCase().trim();
        return string;
    },
    //This function rounds to the nearest tenth place for decimals and removes the comma 
    "toFixed2": (v) => {
        let noCommas = v.replace(/,/g, '');
        let floatVal = parseFloat(v);
        let fixedVal = floatVal.toFixed(2);
        return fixedVal;

    },
    // Extract only numbers from the string and then joins them to form a whole value.
    "numberOnly": (v) => {
        let number = parseFloat(v.match(/\d/g).join(''));
        return number;
    },
    // using moment.js to format the date column
    "dateFormat": (v) => {
        let date = moment(v).format('L');
        return date;
    },
    // Make sure our format is a string and we trim the white spaces
    "emailFormat": (v) => {
        let email = v.toString().trim();
        return email;
    }

}


class TextError extends Error {
}
class EmailError extends Error {
}
class DuplicateEmailError extends Error {
}
class IntegerError extends Error {
}
class DecimalError extends Error {
}
class DateError extends Error {
}

// Here we are validating the values of the roles 
const validators = {


    "text": function (v) {

        // only letters and spaces
        let valid = /^[a-z][a-z\s]*$/
        if (!valid.test(v)) {
            throw new TextError(`Invalid text value expected only letters, got: ${v}`)
        }

    },
    //only a number 
    "integer": function (v) {
        let valid = /^[1-9]\d*$/
        if (!valid.test(v)) {
            throw new IntegerError(`Invalid integer value, expected only numbers, got: ${v}`)
        }
    },
    // check for number and only two decimal places
    "decimal": function (v) {
        let valid = /^\s*(?=.*[1-9])\d*(?:\.\d{1,2})?\s*$/
        if (!valid.test(v)) {
            throw new DecimalError(`Invalid decimal value, expected only numbers, got: ${v}`)
        }
    },
    // checks our date against the valid regex 
    "date": function (v) {
        let valid = /^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/
        if (!valid.test(v)) {
            throw new DateError(`Invalid date value, expected MM/DD/YYYY, got: ${v}`)
        }
    },

    "email": function (v) {


        let valid = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
        if (!valid.test(v)) {
            throw new EmailError(`Invalid email value, expected name@email.com, got: ${v}`)
        }

        //check to see if we already have an email in our unique_emails object
        if (validators["unique_emails"].hasOwnProperty(v)) {
            throw new DuplicateEmailError(`Duplicate email value at : ${v}`)
        } else {
            // if not we'll set that email to true 
            validators["unique_emails"][v] = true
        }


    },

    "unique_emails": {},

}




fs.createReadStream(uploadedCSVFile)
    .on('error', () => {
        // handle error
    })
    .pipe(csv(
        // this formats the headers of the excel sheet to lowercase and removes the white spaces
        { mapHeaders: ({ header, index }) => header.toLowerCase().trim() }
    ))
    .on('data', (row) => {


        try {
            Object.keys(row).forEach(fieldName => {

                let columnConfig = configuration[fieldName.trim()];
                let value = row[fieldName];
                if (columnConfig) {
                    //If there are cleaners setup for this column type, then lets 
                    //loop through the cleaners to make changes and re-assign it to value variable  
                    if (columnConfig.cleaners) {
                        columnConfig.cleaners.forEach(clean => {
                            value = cleaners[clean](value)
                        })
                    }

                    // After the changes we add it back to the assigned fieldName it came from
                    row[fieldName] = value

                    //Here we're checking to see if there is a validator set up for this type 
                    if (validators[columnConfig.type]) {

                        // If so, lets make sure we're getting what we expect based on the type before adding the value to the users array 
                        validators[columnConfig.type](value)
                    }

                } else {

                    throw new Error(`Configuration for column "${fieldName}" not found.`)
                }
            })
            //Now that we're done with the changes, we push changed data to the users array
            users.push(row)
        } catch (e) {
            // This will add the type of column; which can be tracked back to the validator in question
            row["reason"] = e.constructor.name
            errors.push(row)
        }



    })
    .on('end', () => {
        console.table(users)
        console.table(errors)
        writeToCSVFile("cleaned", users)
        writeToCSVFile("errors", errors)
    });


// This function creates the headers we want in the new csv files and extracts the data 
// from the "errors" and "users" arrays to be written in the writeToCSVFile function below
function extractAsCSV(name) {


    if (name == "errors") {
        const headers = ["FirstName", "LastName", "Age ", "Role", "Salary", "Hire Date", "Email", "Errors"];
        const rows = errors.map(error => `${error.firstname}, ${error.lastname}, ${error.age},${error.role}, ${error.salary},${error.hiredate}, ${error.email},${error.reason}`);
        return `${headers.join(",")}\n${rows.join("\n")}`

    } else {
        const headers = ["FirstName", "LastName", "Age ", "Role", "Salary", "Hire Date", "Email"];
        const rows = users.map(user => `${user.firstname}, ${user.lastname}, ${user.age},${user.role}, ${user.salary},${user.hiredate}, ${user.email}`);
        return `${headers.join(",")}\n${rows.join("\n")}`

    }


}

// This function creates the new CSV flie based on whats returned from the "extractAsCSV" function.
function writeToCSVFile(name) {
    const CSVFile = `${name}.csv`;
    fs.writeFile(CSVFile, extractAsCSV(name), err => {
        if (err) {
            console.log("Error writing to csv file", err);
        } else {
            console.log(`Saved as "${CSVFile}" within this directory`)
        }
    });
};


