'user strict'

const express=require('express');
const UserController=require('../controllers/user.js')
const md_auth=require("../middlewares/autenticate.js")
// Middleware para subir imagenes
const multipart=require('connect-multiparty')
var md_upload=multipart({uploadDir: '../uploads/users'})

/*Para tener acceso a los metodos get, put, post, delete*/
var api=express.Router();

/*Rutas*/

// Al home le ponemos el middleware de autenticacion
api.get('/home',md_auth.ensureAuth,UserController.home);
api.post('/register',UserController.saveUser)
api.post('/login',UserController.loginUser)
api.get('/user/:id',md_auth.ensureAuth,UserController.getUser)
// El numero de pagina es un parametro opcional
api.get('/users/:page?',md_auth.ensureAuth,UserController.getUsers)
api.get('/counters/:id?',md_auth.ensureAuth,UserController.getCounters)
api.put('/update-user/:id',md_auth.ensureAuth,UserController.updateUser)
// Usamos tante el middleware de suida de imagenes, como el de autenticacion
api.post('/upload-image-user/:id',[md_auth.ensureAuth,md_upload],UserController.uploadImage)
api.get('/get-image-user/:imageFile',UserController.getImageFile)

module.exports=api;