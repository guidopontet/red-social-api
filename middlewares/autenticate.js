'use strict'

const jwt=require('jwt-simple')
const moment=require("moment")
const secret='clave_secreta_red_social'

exports.ensureAuth=function(req,res,next){
	if(!req.headers.authorization){
		return res.status(402).send({message:'La petición no tiene la cabecera de autenticación'})
	}

	// Eliminamos las comillas simples y dobles que pueda tener
	var token=req.headers.authorization.replace( /['"]+/g,'');

	// Como es posible que se lancen excepciones
	try{
		var payload=jwt.decode(token,secret);

		// Si el token expiró
		if(payload.exp <= moment().unix()){
			return res.status(401).send({
				message:'El token ha expirado'
			})
		}


	}catch(ex){
		return res.status(404).send({
			message:'El token no es válido'
		})
	}

	// Para tener acceso de cualquier controlador a los datos del usuario
	req.user=payload;

	// Se sigue con la ejecución
	next();
	

}