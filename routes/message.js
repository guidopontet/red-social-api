'use strict'

const express=require('express')
const MessageController=require('../controllers/message.js')
const api=express.Router();
const md_auth=require('../middlewares/autenticate.js')

// Rutas
api.get('/pruebaMensaje',md_auth.ensureAuth,MessageController.pruebaMensaje)
api.post('/message',md_auth.ensureAuth,MessageController.saveMessage)
api.get('/my-messages/:page?',md_auth.ensureAuth,MessageController.getReceivedMessages)
api.get('/messages/:page?',md_auth.ensureAuth,MessageController.getEmmitedMessages)
api.get('/unviewed-messages',md_auth.ensureAuth,MessageController.getUnviewedMessages)
api.get('/set-viewed-messages',md_auth.ensureAuth,MessageController.setViewedMessages)


// Exportar
module.exports=api
