'user strict'

/*const path=require('path')
const fs=require('fs')*/
const mongoosePaginate=require('mongoose-pagination')

const User=require('../models/user.js')
const Follow=require('../models/follow.js')

/*Guardar un Follow*/
function saveFollow(req,res){
	var params=req.body;

	var follow=new Follow();
	follow.user=req.user.sub;
	follow.followed=params.followed;

	/*Guardamos el objeto en la base*/
	follow.save((err,followStored)=>{
		if(err) return res.status(500).send({message: 'Error al guardar el seguimiento'})

		if(!followStored) return res.status(404).send({message:'El seguimiento no se ha guardado'})
	
		return res.status(200).send({follow: followStored})
	});

}

/*Metodo para eliminar un follow*/
function deleteFollow(req,res){
	var userId=req.user.sub;
	var followId=req.params.id;

	Follow.find({'user':userId,'followed':followId}).remove(err=>{
		if(err) return res.status(500).send({message:'Error al dejar de seguir'})
	
		return res.status(200).send({message:'El follow se ha eliminado'})
	})
}

/*Listar usuarios que se sigue*/
function getFollowingUsers(req,res){
	var userId=req.user.sub;

	/*Si llega un id por parametro*/
	if(req.params.id && req.params.page){
		userId=req.params.id;
	}

	/*Paginacion*/
	var page=1;

	/*Si nos llega el numero de pagina por URL*/
	if(req.params.page){
		page=req.params.page;
	}else{
		/*Ya que si no nos llega el id, toma como id el numero de pagina*/
		page=req.params.id;
	}

	var itemsPerPage=4;

	/*populamos el campo que quiero cambiar 'followed' por */
	Follow.find({user:userId}).populate({path:'followed'}).paginate(page,itemsPerPage,(err,follows,total)=>{
		if(err) return res.status(500).send({message:'Error en el servidor'})

		if(!follows) return res.status(404).send({message:'No esta siguiendo a ningun usuario'})

			/*Llamamos a funcion que devuelve arreglo de ids de seguidores*/
			followUserIds(req.user.sub).then((value)=>{
				return res.status(200).send({  
					total,
					pages: Math.ceil(total/itemsPerPage), 
					follows,
					users_following: value.following,
					users_follow_me: value.followed
					
				})
			})

	})

}


/*Creamos funcion asincrona para listar usuarios que sigue un usuario*/
async function followUserIds(user_id){
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


/*Listar usuarios que me siguen*/
function getFollowedUsers(req,res){
	var userId=req.user.sub;

	/*Si llega un id por parametro y la pagina*/
	if(req.params.id && req.params.page){
		userId=req.params.id;
	}

	/*Paginacion*/
	var page=1;

	/*Si nos llega el numero de pagina por URL*/
	if(req.params.page){
		page=req.params.page;
	}else{
		/*Ya que si no nos llega el id, toma como id el numero de pagina*/
		page=req.params.id;
	}

	var itemsPerPage=4;

	/* Populamos tanto user como followed */
	Follow.find({followed:userId}).populate('user followed').paginate(page,itemsPerPage,(err,follows,total)=>{
		if(err) return res.status(500).send({message:'Error en el servidor'})

		if(!follows) return res.status(404).send({message:'No te sigue ningun usuario'})

		/*Llamamos a funcion que devuelve arreglo de ids de seguidores*/
		followUserIds(req.user.sub).then((value)=>{
			return res.status(200).send({  
				total,
				pages: Math.ceil(total/itemsPerPage), 
				follows,
				users_following: value.following,
				users_follow_me: value.followed
				
			})
		})

	})

}

/*Para listar sin paginacion usuarios que sigo o que me siguen*/
function getMyFollows(req,res){
	var userId=req.user.sub;

	var find=Follow.find({user:userId});

	/*Si por parametro llega un followed*/
	if(req.params.followed){
		find=Follow.find({followed:userId});
	}

	find.populate('user followed').exec((err,follows)=>{
		if(err) return res.status(500).send({message:'Error en el servidor'})

		if(!follows) return res.status(404).send({message:'No sigues a ningun usuario'})

		return res.status(200).send({
			follows
		})
	})
}



module.exports={
	saveFollow,
	deleteFollow,
	getFollowingUsers,
	getFollowedUsers,
	getMyFollows
}