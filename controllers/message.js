'use strict'

// Librerias
const moment=require('moment')
const mongoosePaginate=require('mongoose-pagination')

// Modelos
const User=require('../models/user.js')
const Follow=require('../models/follow.js')
const Message=require('../models/message.js')

function pruebaMensaje(req,res){
	res.status(200).send({message: 'Hola, desde el controlador de Mensajes'})
}

// Enviar mensaje
function saveMessage(req,res){
	var params=req.body;

	// Verificamos que intrduzca destinatario y texto
	if(!params.text || !params.receiver){
		return res.status(200).send({message: 'Envía los datos necesarios'})
	}

	// Creamos un objeto mensaje
	var message=new Message();
	message.emmiter=req.user.sub;
	message.receiver=params.receiver;
	message.text=params.text;
	message.created_at=moment().unix();
	message.viewed='false';

	// Guardamos el mensaje
	message.save((err,messageStored)=>{
		if(err) return res.status(500).send({message: 'Error al enviar el mensaje'})
	
		if(!messageStored) return res.status(200).send({message: 'Error al salvar el mensaje'})

		return res.status(200).send({message: messageStored})
	})
}

// Listar mensajes recibidos paginados
function getReceivedMessages(req,res){
	var userId=req.user.sub;

	// Paginado
	var page=1;
	if(req.params.page){
		page=req.params.page;
	}
	var itemsPerPage=4;

	


	// Hacemos el populate devolviendo campos especificos en 2do parametro
	Message.find({receiver: userId}).populate('emmiter','name surname image nick _id').sort('-created_at').paginate(page,itemsPerPage,(err,messages,total)=>{
		if(err) return res.status(500).send({message: 'Error en la petición'})
	
		if(!messages) return res.status(404).send({message: 'No existen mensajes para mostrar'})
		
		return res.status(200).send({
			total,
			pages: Math.ceil(total/itemsPerPage),
			page,
			messages
		})
	})
}

// Listar mensajes enviados paginados
function getEmmitedMessages(req,res){
	var userId=req.user.sub;

	// Paginado
	var page=1;
	if(req.params.page){
		page=req.params.page;
	}
	var itemsPerPage=4;

	


	// Hacemos el populate devolviendo campos especificos en 2do parametro
	Message.find({emmiter: userId}).populate('emmiter receiver','name surname image nick _id').sort('-created_at').paginate(page,itemsPerPage,(err,messages,total)=>{
		if(err) return res.status(500).send({message: 'Error en la petición'})
	
		if(!messages) return res.status(404).send({message: 'No existen mensajes para mostrar'})
		
		return res.status(200).send({
			total,
			pages: Math.ceil(total/itemsPerPage),
			page,
			messages
		})
	})
}

// Ver mensajes sin leer
function getUnviewedMessages(req,res){
	 var userId=req.user.sub;

	 Message.count({receiver:userId, viewed:'false'}).exec((err,count)=>{
	 	if(err) return res.status(500).send({message: 'Error en la petición'})

	 	return res.status(200).send({
	 		'unviewed': count
	 	})

	 })
}

// Marcar mensajes como leidos
function setViewedMessages(req,res){
	var userId=req.user.sub;

	// Actualizamos los mensajes, con el multi, decimes que actualice todos los documentos
	Message.update({receiver:userId,viewed:'false'},{viewed:'true'},{'multi':true},(err,messageUpdated)=>{
	 	if(err) return res.status(500).send({message: 'Error en la petición'})

 		return res.status(200).send({messageUpdated})
	})
}


// Exportar
module.exports={
	pruebaMensaje,
	saveMessage,
	getReceivedMessages,
	getEmmitedMessages,
	getUnviewedMessages,
	setViewedMessages
}