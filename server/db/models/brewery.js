const Sequelize = require('sequelize')
const db = require('../db')

const Brewery = db.define('brewery', {
	name: {
		type: Sequelize.STRING,
		allowNull: false
	},
	image: {
		type: Sequelize.STRING,
		defaultValue: "http://www.brewerygems.com/images/Bellingham%20Bay%20Brewery%20drawing_small.jpg"
	},
	description: Sequelize.TEXT,
	established: Sequelize.INTEGER,
	city: Sequelize.STRING,
	state: Sequelize.STRING,
	country: Sequelize.STRING
})

module.exports = Brewery
