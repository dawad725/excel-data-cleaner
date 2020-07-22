const express = require('express');
const app = express();
const main = require("./main.js/index.js");




app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    res.render(main);
});

app.listen(5000);