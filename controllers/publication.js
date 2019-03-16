'use strict'

// Librerias
const path=require('path')
/*Libreria filesystem de node*/
const fs=require('fs');
const moment=require('moment')
const mongoosePaginate=require('mongoose-pagination')

// Modelos
const Publication=require('../models/publication.js')
const User=require('../models/user.js')
const Follow=require('../models/follow.js')

function probando(req,res){
	res.status(200).send({message:'Hola, desde el controlador de Publicaciones'})
}

// Dar de alta nuevas publicaciones 
function savePublication(req,res){
	var params=req.body;

	if(!params.text){ /*Si no llega el parametro texto*/
		return res.status(200).send({message:'Debes enviar un texto'})
	}

	// Almacenamos los datos en el objeto
	var publication=new Publication();
	publication.text=params.text;
	publication.file='null';
	publication.user=req.user.sub;
	publication.created_at=moment().unix();

	// Guardamos el objeto en la base
	publication.save((err,publicationStored)=>{
		if(err) return res.status(500).send({message:'Error al guardar la publicacion'});

		if(!publicationStored) return res.status(404).send({message:'La Publicacion no ha sid guardada'})

		return res.status(200).send({'publication': publicationStored});
	})
}

// Listar publicaciones
function getPublications(req,res){
	var page=1;

	// Determinamos la pagina si viene en la URL
	if(req.params.page){
		page=req.params.page;
	}

	var itemsPerPage=4;

	// Recuperamos los usuarios que seguimos
	Follow.find({user: req.user.sub}).populate('followed').exec((err,follows)=>{
		if(err) return res.status(500).send({message: 'Error al devolver el seguimiento'});

		// Creamos un array con los ID de los usuarios que estamos siguiendo
		var follows_clean=[];

		follows.forEach((follow)=>{
			follows_clean.push(follow.followed) /*Añadimos el objeto completo*/
		})

		// Nos añadimos nosotros para que nos muestre nuestras publicaciones tambien
		follows_clean.push(req.user.sub)

		// Ahora buscamos las publicaciones de los Users que sigo
		Publication.find({user:{$in:follows_clean}}).sort({'created_at': -1}).populate('user').paginate(page,itemsPerPage,(err,publications,total)=>{
			if(err) return res.status(500).send({message: 'Error al devolver publicaciones'});

			if(!publications) return res.status(404).send({message: 'No existen publicaciones'});

			return res.status(200).send({
				total,
				pages: Math.ceil(total/itemsPerPage),
				page,
				items_per_page: itemsPerPage,
				publications
			})

		})

	})
}

// Listar publicaciones de un usuario
function getPublicationsUser(req,res){
	var page=1;

	// Determinamos la pagina si viene en la URL
	if(req.params.page){
		page=req.params.page;
	}

	// Por defecto es el id del usuario
	var user_id=req.user.sub;
	if(req.params.user_id){ /*Si llega por parametro el id del usuario a listar las publicaciones*/
		user_id=req.params.user_id;
	}

	var itemsPerPage=4;

	// Ahora buscamos las publicaciones de los Users que sigo
	Publication.find({user: user_id}).sort({'created_at': -1}).populate('user').paginate(page,itemsPerPage,(err,publications,total)=>{
		if(err) return res.status(500).send({message: 'Error al devolver publicaciones'});

		if(!publications) return res.status(404).send({message: 'No existen publicaciones'});

		return res.status(200).send({
			total,
			pages: Math.ceil(total/itemsPerPage),
			page,
			items_per_page: itemsPerPage,
			publications
		})

	})

}


// Devolver una publicacion
function getPublication(req,res){
	var publicationId=req.params.id;

	Publication.findById(publicationId,(err,publication)=>{
		if(err) return	res.status(500).send({message:'Error al devolver Publicacion'})

		if(!publication) return res.status(404).send({message:'No existe la Publicación'})
	
		return res.status(200).send(publication);
	})
}

// Eliminar Publicacion
function deletePublication(req,res){
	var publicationId=req.params.id;

	Publication.find({user: req.user.sub, '_id':publicationId}).remove(err=>{
		if(err) return	res.status(500).send({message:'Error al eliminar Publicacion'})

		return res.status(200).send({message: 'Publicación eliminada'});
	})
}

// Subir imagenes en las publicaciones
function uploadImage(req,res){
	var publicationId=req.params.id;

	if(req.files){ /*Si se subio imagen*/

		// Guardamos el nombre del archivo
		var file_path=req.files.image.path;
		console.log(file_path)
		var file_split=file_path.split('\\');
		console.log(file_split)
		var file_name=file_split[2];

		// Guardamos la extension
		var ext_split=file_name.split('\.');
		var file_ext=ext_split[1];

		// Si la extension es correcta
		if(file_ext=='png' || file_ext=='jpg' || file_ext=='jpeg' || file_ext=='gif'){
			
			// Verificamos que el usuario que quiere modificar sea el dueño de la publicacion
			Publication.findOne({user:req.user.sub,'_id':publicationId}).exec((err,publication)=>{
				console.log(publication)
				if(publication){ /*Si es el dueño de la publicacion*/
					// Actualizamos el documento  la publicacion
					Publication.findByIdAndUpdate(publicationId,{file: file_name},{new:true},(err,publicationUpdate)=>{

						if(err) return res.status(500).send({message: 'Error en la peticion'})

						if(!publicationUpdate) return res.status(404).send({message:'No se ha podido actualizar el usuario'})

						return res.status(200).send({publication:publicationUpdate})

					})
				}else{
					return removeFilesOfUploads(res,file_path,'No tienes permiso para añadir imagen')
				}
			})

			

		}else{
			// El middleware de multiparty sube directamente el archivo, por lo que hay que borrarlo en caso de problemas
			/*Eliminamos el archivo*/
			return removeFilesOfUploads(res,file_path,'Extensión no válida')
			
		}
	

	}else{ /*Si no se subio imagen*/
		return res.status(200).send({message:'No se han subido imagenes'})
	}

}

/*Funcion auxiliar para borrar imagenes*/
function removeFilesOfUploads(res,file_path,message){
	fs.unlink(file_path,(err)=>{
		return res.status(200).send({message})
	})
}

function getImageFile(req,res){
	var image_file=req.params.imageFile;
	var path_file='./uploads/publications/'+image_file;

	fs.exists(path_file,(exist)=>{
		if(exist){
			res.sendFile(path.resolve(path_file));
		}else{
			res.status(200).send({message:'No existe la imagen'})
		}
	})
}

module.exports={
	probando,
	savePublication,
	getPublications,
	getPublicationsUser,
	getPublication,
	deletePublication,
	uploadImage,
	getImageFile
}