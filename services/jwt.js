'use strict'

const jwt=require('jwt-simple');
const moment=require('moment');
const secret='clave_secreta_red_social';

/*Como solamente vamos a tener un metodo para generar un token, lo exportamos directamente*/
exports.createToken=function(user){
	var payload={
		sub: user._id,
		nombre: user.name,
		surname: user.surname,
		nick: user.nick,
		email: user.email,
		role: user.role,
		image: user.image,
		/*Con moment guardamos la fecha de generacion del token en formato unix */
		iat: moment().unix(),
		exp: moment().add(30,'days').unix()
	}

	return jwt.encode(payload,secret);
}

