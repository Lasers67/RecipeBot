const API_AI_TOKEN = 'ff306ea0643349f5ba8741b3916f0d42';
const apiAiClient = require('apiai')(API_AI_TOKEN);
const FACEBOOK_ACCESS_TOKEN = 'EAADG5fKLZBWIBAIUOKXZAwSOe93qzzSnFSwLxwBKH52mYfpbu3zGLqGb8dUsMJku4dRWXtfSg0vHiGZB1V402CVznD3rF0TOZAePk5Vik0RF8VcQKWAZCu3CCkHXxZAxzBHVjCXhy5UDpwKMjPiFJcGkqWzeOyW57sETrPZBN6HggZDZD';
const request = require('request');
const sendTextMessage = (senderId, text) => {
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: { access_token: FACEBOOK_ACCESS_TOKEN },
		method: 'POST',
		json: {
			recipient: { id: senderId },
			message: { text },
		}
	});
};

let dishes = [];

module.exports = (event) => {
	const senderId = event.sender.id;
	const message = event.message.text;
	const apiaiSession = apiAiClient.textRequest(message, {sessionId: 'recipebot'});
	console.log(message);
	const { scrapeDishes, showRecipe, fromIngredients } = require('./scrape.js');
	apiaiSession.on('response', (response) => {
		const result = response.result.fulfillment.speech;
		sendTextMessage(senderId, result);
		console.log(response);
		if(response.result.action == 'input.unknown') return;
		if (response.result.action == 'smalltalk.confirmation.yes'){
			showRecipe(senderId);
			return;
		}
		if (response.result.action == 'smalltalk.confirmation.no'){
			sendTextMessage(senderId, "okay, I'll wait.");
			return;
		}
		if (response.result.metadata.intentName == 'get_ingredients'){
				return;
		}

		if (response.result.metadata.intentName == 'Ingredients_to_recipe'){
			console.log("ing");
			fromIngredients(senderId, response.result.parameters.ingredients);
			return;
		}
		if(response.result.parameters.recipe == undefined) return;
		console.log(response.result.parameters.recipe);
		new Promise( resolve => {
			dishes = scrapeDishes(response.result.parameters.recipe, senderId);
			resolve(dishes);
		}).then(dishes => {
			let message = "Okay lets make some " + response.result.parameters.recipe;
			sendTextMessage(senderId, message);
			setTimeout(function () {
				message = "Here are the ingredients - " ;
				sendTextMessage(senderId, message);
			}, 2000);
		});
	});
	apiaiSession.on('error', error => console.log(error));
	apiaiSession.end();
};
