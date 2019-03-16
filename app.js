/*Aca configuramos todo lo de express*/

'use strict';

// Librerias
const express = require('express');
const bodyParser = require('body-parser');

// Creamos la instancia de express
var app = express();

// Cargar Rutas
var user_routes = require('./routes/user.js');
var follow_routes = require('./routes/follow.js');
var publication_routes = require('./routes/publication.js');
var messages_routes = require('./routes/message.js');

// Cargar Middlewares

/*En cada peticion se va a ejecutar este middleware*/
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); /*Transformamos la peticion a json*/

// Cargar CORS (Problemas con peticiones AJAX)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');

  next();
});

// Rutas
app.use('/api', user_routes);
app.use('/api', follow_routes);
app.use('/api', publication_routes);
app.use('/api', messages_routes);

// Exportar
module.exports = app;
