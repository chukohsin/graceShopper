const Sequelize = require('sequelize')
const db = require('../db')

const Style = db.define('style', {
	name: {
		type: Sequelize.STRING,
		allowNull: false
	},
	description: {
		type: Sequelize.TEXT
	}
})

module.exports = Style
