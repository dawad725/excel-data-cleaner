const fs = require('fs');
const csv = require('csv-parser');
// const uploadedCSVFile = process.argv[2]; // production
const uploadedCSVFile = "./test2.csv"; // development


const users = [];

const configuration = {
    "firstname": {
        type: "text",

        lambdas: ["toLowerCase", "trim"]
    },
    "lastname": {
        type: "text",
        lambdas: ["toLowerCase", "trim"]
    },
    "age": {
        type: "text",
        lambdas: ["trim"]
    },
    "role": {
        type: "text",
        lambdas: ["toLowerCase", "trim"]
    },
    "salary": {
        type: "decimal",
        decimals: "%.2f",
        lambdas: ["trim"]
    }
}




// Make sure we have a csv file on the command line in order to proceed.
// If not lets show the user what the CLI expects.
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

        console.log(row)

        Object.keys(row).forEach(fieldName => {
            let columnConfig = configuration[fieldName.trim()];
            if (columnConfig) {
                switch (columnConfig.type) {
                    case "text":

                        let value = row[fieldName];

                        columnConfig.lambdas.forEach(l => {

                            if (columnConfig.hasOwnProperty('lambdas')) {

                                value = value[l]();
                            }
                        })
                        // After the changes we add it back to the assigned fieldName it came from
                        row[fieldName] = value
                        break
                    case "decimal":
                        let salary = row[fieldName];

                        columnConfig.lambdas.forEach(l => {
                            if (columnConfig.hasOwnProperty('lambdas')) {
                                salary = salary[l]();
                            }
                        })

                        // here we are removing the commmas and rounding to two decimal places
                        salary = parseFloat(salary.replace(/,/g, "")).toFixed(2)

                        console.log(salary)

                        row[fieldName] = salary
                        break
                    case "date":
                        // use momentjs
                        break
                }
            } else {
                console.error(new Error(`Configuration for ${fieldName} not found.`))
            }
        })

        //Now that we're done with the changes, we push changed data to the users array
        users.push(row)

    })
    .on('end', () => {
        console.table(users);
        writeToCSVFile(users);
    });


// This function creates the new CSV flie based on whats returned from the "extractAsCSV" function.
function writeToCSVFile(users) {
    const cleanedCSVFile = 'cleaned.csv';
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
    const headers = ["FirstName", "LastName", "Role", "Salary"];

    console.log("users", users)
    const rows = users.map(user => `${user.firstname}, ${user.lastname}, ${user.role}, ${user.salary}`);
    return headers.concat(rows).join("\n");
}
