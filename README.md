# excel-data-cleaner

Here is a simple command line interface application to clean payroll excel data. 

## General info

In the root directory is a "test.csv" file. You will need this to run the application. 
After the application runs you will see two tables printed in your terminal. One for your rows that have "errors" and the other for your "cleanned" data. You will also see two new CSV files created in the root directory, one called "errors.csv" and the other "cleaned.csv". Your errors file will include what rows were excluded from the cleaned file and what kind of errors we encountered throughout the process. 


## Setup 
To run this project, install it locally using npm:

```
$ cd excel-data-cleaner
$ npm install 
$ npm start test.csv
```
