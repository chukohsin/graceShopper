const Sequelize = require('sequelize')
const db = require('../db')

const Beer = db.define('beer', {
	name: {
		type: Sequelize.STRING,
		allowNull: false
	},
	image: {
		type: Sequelize.STRING,
		defaultValue: 'https://image.freepik.com/free-photo/beer-bottle-on-white-background_1112-484.jpg'
	},
	inventory: Sequelize.INTEGER,
	price: Sequelize.DOUBLE,
	packaging: Sequelize.STRING,
	description: Sequelize.TEXT,
	abv: Sequelize.FLOAT
}, {
	scopes: {
		withBrewery: () => ({
			include: [{
				model: db.model('brewery')
			}]
		}),
		withStyle: () => ({
			include: [{
				model: db.model('style')
			}]
		})
	}
})

module.exports = Beer