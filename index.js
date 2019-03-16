/*Cualquier peticion pasa por este index*/

'use strict' /*Para utilizar las ultimas caraceristicas de os navegadores con javascript*/;

const mongoose = require('mongoose'); /*Importamos mongoose*/
var app = require('./app.js');
var port = 3800;

// Conexión a la base de datos
mongoose.Promise = global.Promise;
mongoose
  .connect('mongodb://localhost:27017/red_social', { useMongoClient: true })
  .then(() => {
    /*En caso de que este todo bien*/
    console.log(
      "La conexión a la base de datos 'red_social' se ha realizado correctamente"
    );
  }) /*Si hay algun error*/
  .catch(err => console.log(`Error al conectar a la base de datos ${err}`));

app.listen(port, () => {
  console.log('Servidor corriendo en el puerto:' + port);
});
