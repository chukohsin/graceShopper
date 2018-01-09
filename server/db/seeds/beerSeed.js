const request = require('request-promise')// request doesn't return promise, so use 'request-promise'
const cheerio = require('cheerio')
const axios = require('axios')
const { db, Beer, Brewery } = require('../models')

let rankLists = ['Top', 'Fame']
let rankListPromises = [];
let stateLists = ['al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'dc', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy']
let stateListPromises = [];

for (let i = 0; i < rankLists.length; i++) {
	rankListPromises.push(request(`https://www.beeradvocate.com/lists/${rankLists[i].toLowerCase()}/`))
}

for (let i = 0; i < 20; i++) {
	stateListPromises.push(delay(100*i).then(() => request(`https://www.beeradvocate.com/lists/state/${stateLists[i]}/`)))
}

Beer.sync({ force: true })
.then(() =>
	Promise.all(rankListPromises)
)
.then(htmls => {
	return htmls.map(scraper)
})
.then(lists => {
	return rankListPromiseMaker(lists[0], 0)
	.then(() => rankListPromiseMaker(lists[1], 1))
})
.then(() =>
	Promise.all(stateListPromises)
)
.then(htmls => {
	return htmls.map((html) => {
	let list = []
	let $ = cheerio.load(html)
	$('tr').each(function(i, elem) {
		if (i > 1 && i < 50){
			list.push({
				rank: $(this).children().eq(0).text(),
				name: $(this).children().eq(1).children().eq(0).text(),
				score: $(this).children().eq(2).text(),
				ratingNum: $(this).children().eq(3).text()
			});
		}
	})
	return list
})
})
.then(lists => {
	let list = lists.reduce((accu, curr) => accu.concat(curr), [])
	return rankListPromiseMaker(list)
})
.catch(err => {
    console.error('Uh oh, something does not compute!')
    console.error(err.message)
    console.error(err.stack)
    db.close()
})

/* ----------------------------- HELPER FUNCTIONS ----------------------------- */
function delay(time) {
   return new Promise(function(resolve) {
       setTimeout(resolve, time)
   });
}

function scraper(html) {
	let list = []
	let $ = cheerio.load(html)
	$('tr').each(function(i, elem) {
		if (i > 1){
			list.push({
				rank: $(this).children().eq(0).text(),
				name: $(this).children().eq(1).children().eq(0).text(),
				score: $(this).children().eq(2).text(),
				ratingNum: $(this).children().eq(3).text()
			});
		}
	})
	return list
}

function rankListPromiseMaker(list, index) {
	return Promise.all(list.map((topBeer, i) => {
		return delay(150*i).then(() =>
			axios
            .get(`http://api.brewerydb.com/v2/search?q=${encodeURI(topBeer.name.replace(/&/g, 'and').replace(/#/g, 'number'))}&type=beer&withBreweries=Y&key=550024364cdf69299b823746c473a4e0`)
			.then(res => {
				if (res.data.data) {
					let brewerydbdata = res.data.data[0]
					let img = brewerydbdata.labels ? brewerydbdata.labels.large : undefined
					let randomPrice = (Math.random() * 20 + 1).toFixed(2)
					let randomInventory = Math.floor(Math.random() * 100)
					let packaging = ['16OZ CAN', '750ML BTL', '375ML BTL', '12OZ BTL', '12OZ CAN']
					let randomPackaging = packaging[Math.floor(Math.random() * packaging.length)]
					return Brewery.findOne({ where: { name: brewerydbdata.breweries[0].name }})
					.then(brewery => {
						if (brewerydbdata.description) {
							Beer.findOrCreate({ where: {
							name: brewerydbdata.name,
							image: img,
							price: randomPrice,
							inventory: randomInventory,
							packaging: randomPackaging,
							description: brewerydbdata.description,
							abv: brewerydbdata.abv,
							styleId: brewerydbdata.styleId,
							breweryId: brewery.id
							}})
						}
					})
				}
			})
            .catch(err => console.log(err))
		)
	}))
}