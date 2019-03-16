'use strict'
var mongoosePaginate=require('mongoose-pagination')
/*Libreria filesystem de node*/
const fs=require('fs');
/*Libreria path para trabajar con el sistema de ficheros*/
const path=require('path')
const bcrypt=require('bcrypt-nodejs');
// Importamos el servicio creado jwt para generar el token de usuario
var jwt=require('../services/jwt.js')
/*Importamos el modelo de los usuarios*/
var User=require('../models/user.js');

var Follow=require('../models/follow.js');
var Publication=require('../models/publication.js')

// Prueba
function home (req,res){
	console.log(req.body)
	res.status(200).send({message: "Todo Ok"}) /*Codigo 200 todo va bien*/
}

// Registro
function saveUser(req,res){
	// Recogemos todos los valores que lleguen por POST
	var params=req.body;
	var user=new User();

	// Si estan todos los valores obligatorios
	if(params.name && params.surname && params.nick && params.email && params.password){
		user.name=params.name;
		user.surname=params.surname;
		user.nick=params.nick;
		user.email=params.email;
		user.role='ROLE_USER';
		user.image=null;

		//Comprobamos que no exista ya un usuario con ese nick o email
		User.find({ $or: [
			{email:user.email.toLowerCase()},
			{nick: user.nick.toLowerCase()}
			]}).exec((err,users)=>{
				if(err) return res.status(500).send({message:'Error en la petición de usuarios'})
			
				if(users && users.length>=1){
					return res.status(200).send({message: 'El usuario que intenta registrar ya existe'})
				}else{
					// Ciframos la contraseña
					bcrypt.hash(params.password,null,null,(err,hash)=>{
						user.password=hash;

						// Guardamos el user con mongoose
						user.save((err,userStore)=>{
							// Si hay error
							if(err) return res.status(500).send({message:'Error al guardar el usuario'})
							
							// Si se creo el usuario
							if(userStore){
								res.status(200).send({user: userStore})
							}else{
								res.status(404).send({message: 'No se ha registrado el usuario'})
							}
						})
					})
				}
			})

		

	}else{
		res.status(200).send({
			message: 'Envía todos los campos necesarios'
		})
	}
}

// Login 
function loginUser(req,res){
	var params=req.body;

	console.log("Logueando:")
	console.log(params)

	var email=params.email;
	var password=params.password;

	User.findOne({email: email}, (err,user)=>{
		if(err) return res.status(500).send({message: 'Error en la petición'})
	
		if(user){
			bcrypt.compare(password,user.password,(err,check)=>{
				if(check){
					if(params.gettoken){
						// Generar y devolver el token
						return res.status(200).send({
							token: jwt.createToken(user)
						})
					}else{
						// Devolvemos los datos de usuario
						// Devolver datos de usuario, menos el password
						user.password=undefined
						return res.status(200).send({user})
					}


					
				}else{
					return res.status(404).send({message: 'Error de auteticación'})
				}
			})
		}else{
			return res.status(404).send({message: 'Error de auteticación!!'})
		}
	})
}

// Datos de Usuario
function getUser(req,res){
	/*Cuando llegan datos por la URL llegan por 'params'*/
	/*Cuando llegan datos por POST o PUT llegan por 'body'*/
	var userId=req.params.id;

	User.findById(userId,(err,user)=>{
		if(err) return res.status(500).send({message:'Error en la petición'})

		// Si no existe el usuario
		if(!user) return res.status(404).send({message:'El usuario no existe'})	

	
		/*Verificamos si el usuario nos sigue o lo seguimos*/
		/*Con el Async nos devuelve una promesa*/
		followThisUser(req.user.sub,userId)
			.then((value)=>{
				user.password=undefined; 
				return res.status(200).send({
					user,
					following:value.following,
					followed:value.followed})
			})
	})
}

/*Funcion auxiliar para ver si sigo al usuario y el me sigue*/
async function followThisUser(identity_user_id,user_id){

	/*Para transformar la llamada en sincrona, usamos el 'await'*/
	/*Comprobamos si seguimos a ese usuario*/
	var following = await Follow.findOne({user:identity_user_id, followed:user_id}).exec((err,follow)=>{
			if(err) return handleError(err);
			return follow;
		})

	/*Hacemos lo mismo para ver si el usuario nos sigue*/
	var followed = await Follow.findOne({user:user_id, followed:identity_user_id}).exec((err,follow)=>{
			if(err) return handleError(err);
			return follow;
		})

	return {
		following,
		followed
	}
}


// Listar listado de todos los usuarios paginado (mongoose-pagination)
function getUsers(req,res){
	// Recuperamos el ID del user logueado
	var identity_user_id=req.user.sub;

	var page=1; /*Por defecto*/

	if(req.params.page){
		var page=req.params.page;
	}

	var itemsPerPage=5;/*5 users por pagina*/

	User.find().sort('_id').paginate(page,itemsPerPage,(err,users,total)=>{
		if(err) return res.status(500).send({message:'Error en la peticion'})

		if(!users) return res.status(404).send({message:'No existen usuarios en la plaaforma'})


		/*Llamamos a funcion que devuelve arreglo de ids de seguidores*/
		followUserId(identity_user_id).then((value)=>{
			return res.status(200).send({
				users, /*Al ponerlo asi, node interpreta que users, esta en la propiedad users*/
				users_following: value.following,
				users_follow_me: value.followed,
				total,
				pages:Math.ceil(total/itemsPerPage)
			})
		})

	})
}

/*Creamos funcion asincrona para listar usuarios que sigue un usuario*/
async function followUserId(user_id){
	/*Quitamos los campos de ID, y otros*/
	var following=await Follow.find({'user':user_id}).select({'_id':0,'__v':0,'user':0}).exec((err,follows)=>{
		return follows;
	})

	var followed=await Follow.find({'followed':user_id}).select({'_id':0,'__v':0,'followed':0}).exec((err,follows)=>{
		return follows;
	})

	/*Procesar Following IDs*/
	var following_clean=[];

	following.forEach((follow)=>{
		following_clean.push(follow.followed);
	})

	/*Procesar Followed ID*/
	var followed_clean=[];

	followed.forEach((follow)=>{
		followed_clean.push(follow.user);
	})

	return {
		following:following_clean,
		followed:followed_clean
	}
}

// Cuanta gente nos sique
// Cuanta gente Seguimos
// Cuantas publicaciones hicimos
function getCounters(req,res){
	var userId=req.user.sub;
	/*Si recibimos un ID por parametro*/
	if(req.params.id){
		userId=req.params.id
	}

	getCountFollow(req.params.id).then((value)=>{
		return res.status(200).send(value)
	})
}

/*Funcion asincrona auxiliar de contadores*/
async function getCountFollow(user_id){
	var following=await Follow.count({'user':user_id}).exec((err,count)=>{
		if(err) handleError(err);

		return count;
	})

	var followed=await Follow.count({'followed':user_id}).exec((err,count)=>{
		if(err) handleError(err);

		return count;
	})

	var publications=await Publication.count({user:user_id}).exec((err,count)=>{
		if(err) handleError(err);

		return count;
	})

	return{
		following,
		followed,
		publications
	}
}

// Actualizar datos de un usuario
function updateUser(req,res){
	var userId=req.params.id;
	// console.log(req)
	var update=req.body;
	// console.log("Probando")
	// Borramos la propiedad password
	delete update.password;

	if(userId!=req.user.sub){
		return res.status(500).send({message:'No tienes permiso para actualizar los datos del usuario'})
	}

	var ya_existe=false

	User.find({ $or: [
		{email: update.email.toLowerCase()},
		{nick: update.nick.toLowerCase()}
		]}).exec((err,users)=>{
			users.forEach((user)=>{
				if(user && user._id!=userId) ya_existe=true;
			})

			if(ya_existe) return res.status(500).send({message:'Los datos ya están en uso'})
		
			/*Como tercer parametro ponemos new, para que devuelva el objeto actualizado*/
			User.findByIdAndUpdate(userId,update,{new:true},(err,userUpdate)=>{
				if(err) return res.status(500).send({message: 'Error en la peticion'})

				if(!userUpdate) return res.status(404).send({message:'No se ha podido actualizar el usuario'})

				return res.status(200).send({user:userUpdate})

			})

		})
	
}

// Subir archivos de imagen/avatar de usuario
function uploadImage(req,res){
	var userId=req.params.id;

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

		// Solamente el propia usuario va a poder subir imagenes a su account
		if(userId!=req.user.sub){
			return removeFilesOfUploads(res,file_path,'No tienes permiso para actualizar los datos del usuario') 
		}

		// Si la extension es correcta
		if(file_ext=='png' || file_ext=='jpg' || file_ext=='jpeg' || file_ext=='gif'){
			// Actualizamos el documento del usuario
			User.findByIdAndUpdate(userId,{image: file_name},{new:true},(err,userUpdate)=>{

				if(err) return res.status(500).send({message: 'Error en la peticion'})

				if(!userUpdate) return res.status(404).send({message:'No se ha podido actualizar el usuario'})

				return res.status(200).send({user:userUpdate})

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
	var path_file='./uploads/users/'+image_file;
	console.log(path_file);
	fs.exists(path_file,(exist)=>{
		if(exist){
			res.sendFile(path.resolve(path_file));
		}else{
			res.status(200).send({message:'No existe la imagen'})
		}
	})
}



/*Exportamos como objeto*/
module.exports={
	home,
	saveUser,
	loginUser,
	getUser,
	getUsers,
	updateUser,
	uploadImage,
	getImageFile,
	getCounters
}