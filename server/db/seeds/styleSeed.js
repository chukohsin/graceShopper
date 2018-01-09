const axios = require('axios')
const { db, Style } = require('../models')

Style.sync({ force: true })
.then(() =>
	axios.get('http://api.brewerydb.com/v2/styles/?key=550024364cdf69299b823746c473a4e0')
)
.then(res => (
	res.data.data
))
.then(styleInfo =>
	styleInfo.map(el =>
		({	name: el.name,
			shortName: el.shortName,
			description: el.description
		})
	)
)
.then(styleObj =>
	Promise.all(styleObj.map(style =>
		Style.create(style)
	))
)
.catch(err => {
    console.error('Seeding styles was unsuccessful!')
    console.error(err.message)
    console.error(err.stack)
    db.close()
})
