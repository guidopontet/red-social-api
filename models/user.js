'use strict'

const mongoose=require('mongoose');
const Schema=mongoose.Schema;

// Definimos el esquema
var UserSchema= Schema({
	name: String,
	surname: String,
	nick: String,
	email: String,
	password: String,
	role: String,
	image: String
})

// Definimos el modelo
module.exports=mongoose.model('User',UserSchema)
