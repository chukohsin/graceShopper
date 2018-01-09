const axios = require('axios')
const { db, Brewery } = require('../models')

function delay(time) {
   return new Promise(function(resolve) {
       setTimeout(resolve, time)
   });
}

Brewery.sync({ force: true })
.then(() => (
	axios.get(`http://api.brewerydb.com/v2/breweries/?p=1&withLocations=Y&key=550024364cdf69299b823746c473a4e0`)
))
.then( res => {
	//push all brewery requests into one array for promise.all
	let breweryPromises = []
	for (let i = 1; i < +res.data.numberOfPages + 1; i++) {
		breweryPromises.push(delay(80 * i).then(() => axios.get(`http://api.brewerydb.com/v2/breweries/?p=${i}&withLocations=Y&key=550024364cdf69299b823746c473a4e0`)))
	}
	return breweryPromises
})
.then(breweryPromises =>
	axios.all(breweryPromises)
)
.then(axios.spread((...args) =>
	args.map(el => el.data.data).reduce((accu, curr) => accu.concat(curr), [])
))
.then(breweries => {
	return breweries.map(el => {
		let img = el.images ? el.images.squareLarge : undefined
		if (el.locations) {
			return {
			name: el.name,
			image: img,
			description: el.description,
			established: el.established,
			city: el.locations[0].locality,
			state: el.locations[0].region,
			country: el.locations[0].country.name
			}
		} else {
			return {
				name: el.name,
				image: img,
				description: el.description,
				established: el.established
			}
		}
	})
})
.then(breweriesInfo =>
	Promise.all(breweriesInfo.map(brewery =>
		Brewery.create(brewery)
	))
)
.catch(err => {
    console.error('Seeding breweries was unsuccessful!')
    console.error(err.message)
    console.error(err.stack)
    db.close()
})
