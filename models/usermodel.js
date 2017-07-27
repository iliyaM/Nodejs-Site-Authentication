const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs'); //Incription libraty import

const userSchema = new Schema({
	email: String,
	username: String,
	password: String,
	secretToken: String,
	active: Boolean
},
{
	timestamps: { 
		createdAt: 'createdAt',
		updatedAt: 'updatedAt'
	}
}); 

//Create a model and call it user and specify what model 
const User = mongoose.model('user', userSchema);

//Export variable to use lesewhere
module.exports = User;

//Hashing password attaching to exports (user.hashPassword)
module.exports.hashPassword = async(password) => {
	try {
		const salt = await bcrypt.genSalt(10);
		return await bcrypt.hash(password, salt);
	} catch(error) {
		throw new Error('Hashing Failed', error);
	}
};

//Hashing compare with input pass function
module.exports.comparePasswords = async(inputPassword, hashPassword) => {
	try{
		return await bcrypt.compare(inputPassword, hashPassword);
	} catch(error) {
		throw new Error('Comparing filed', error);
	}
}