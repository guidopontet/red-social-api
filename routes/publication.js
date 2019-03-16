'use strict'

// Librerias
const express=require('express')
const api=express.Router();

// Modelos
const PublicationController=require('../controllers/publication.js')

// Middlewares
var md_auth=require('../middlewares/autenticate.js')
var multipart=require('connect-multiparty')
var md_upload=multipart({uploadDir:'./uploads/publications/'})

// Rutas
api.get('/probando-pub',md_auth.ensureAuth,PublicationController.probando);
api.post('/publication',md_auth.ensureAuth,PublicationController.savePublication);
api.get('/publications/:page?',md_auth.ensureAuth,PublicationController.getPublications);
api.get('/publications-user/:user_id/:page?',md_auth.ensureAuth,PublicationController.getPublicationsUser);
api.get('/publication/:id',md_auth.ensureAuth,PublicationController.getPublication);
api.delete('/publication/:id',md_auth.ensureAuth,PublicationController.deletePublication);
api.post('/upload-image-pub/:id',[md_auth.ensureAuth,md_upload],PublicationController.uploadImage);
api.get('/get-image-pub/:imageFile',PublicationController.getImageFile)

// Exports
module.exports=api;