"use strict";

var express = require('express');

var expressHandlebars = require('express-handlebars');

var app = express();
app.engine('hbs', expressHandlebars.engine({
  defaultLayout: 'main.hbs'
}));
app.get('/', function (request, response) {
  response.render('start.hbs');
});
app.get('/notes', function (request, response) {
  response.render('notes.hbs');
});
app.use(express["static"]("node_modules/spectre.css/dist"));
app.listen(8080);