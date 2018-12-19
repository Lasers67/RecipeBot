const API_AI_TOKEN = 'ff306ea0643349f5ba8741b3916f0d42';
const apiAiClient = require('apiai')(API_AI_TOKEN);
const FACEBOOK_ACCESS_TOKEN = 'EAADG5fKLZBWIBAIUOKXZAwSOe93qzzSnFSwLxwBKH52mYfpbu3zGLqGb8dUsMJku4dRWXtfSg0vHiGZB1V402CVznD3rF0TOZAePk5Vik0RF8VcQKWAZCu3CCkHXxZAxzBHVjCXhy5UDpwKMjPiFJcGkqWzeOyW57sETrPZBN6HggZDZD';
const request = require('request');
var working = ["Cool that works!", "Sounds good.", "Let's use that instead!"]
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

const sendFestivalNotification = (senderId) => {
	sendTextMessage(senderId, "Hello there! Happy Dusshera!");
	setTimeout(function () {
		sendTextMessage(senderId, "Sabudana Khichdi and Besan Ladoo are some Dusshera special. Which do you want to cook them today?");
	}, 2000);
}


let dishes = [], donthave = 0, replace_ing = [], missing, flag = 0, festival = 1, alt_def;



module.exports = (event) => {
	const senderId = event.sender.id;
	const message = event.message.text;
	const apiaiSession = apiAiClient.textRequest(message, {sessionId: 'recipebot'});
	console.log(message);
	const { scrapeDishes, showRecipe, fromIngredients, findAlt } = require('./scrape.js');
	apiaiSession.on('response', (response) => {
		const result = response.result.fulfillment.speech;
		console.log(response);
		var d = new Date();
		if(festival && d.getHours() == 11 && response.result.action == "input.welcome") {
				sendFestivalNotification(senderId);
				festival = 0;
				return;
		}
		sendTextMessage(senderId, result);
		if(response.result.action == 'input.unknown') return;
		if(donthave && (response.result.action == 'smalltalk.confirmation.yes' || response.result.metadata.intentName == 'Positive Response')) {
			donthave = 0;
			replace_ing[missing] = alt_def;
			var min=0;
    		var max=working.length;
    		var random =Math.floor(Math.random() * (+max - +min)) + +min;
			sendTextMessage(senderId, working[random]);
			sendTextMessage(senderId, "Are you ready to proceed?");
			return;
		}


		if (response.result.action == 'smalltalk.confirmation.yes' || response.result.metadata.intentName == 'Positive Response'){
			showRecipe(senderId, replace_ing, event.message.text);
			return;
		}
		if (response.result.action == 'smalltalk.confirmation.no'){
			sendTextMessage(senderId, "okay, I'll wait.");
			return;
		}
		if (response.result.metadata.intentName == 'get_ingredients'){
				return;
		}
		if (response.result.metadata.intentName == 'unavailable_ingred'){
				alt_def = findAlt(senderId, response.result.parameters.ingredient);
				donthave = 1;
				missing = response.result.parameters.ingredient[0].toLowerCase();
				return;
		}
		if(donthave && response.result.metadata.intentName == 'Ingredients_to_recipe') {
			donthave = 0;
			replace_ing[missing] = response.result.parameters.ingredients[0].toLowerCase();
			var min=0;
    		var max=working.length;
    		var random =Math.floor(Math.random() * (+max - +min)) + +min;
			sendTextMessage(senderId, working[random]);
			sendTextMessage(senderId, "Are you ready to proceed?");
			return;
		}
		if (response.result.metadata.intentName == 'Ingredients_to_recipe'){
			// console.log("ing");
			fromIngredients(senderId, response.result.parameters.ingredients);
			return;
		}


		if(response.result.parameters.recipe == undefined || response.result.parameters.recipe == '') return;
		console.log(response.result.parameters.recipe);
		new Promise( resolve => {
			dishes = scrapeDishes(response.result.parameters.recipe, senderId);
			resolve(dishes);
		}).then(dishes => {
			var done = ["Okay lets make some ", "Lets get started on ", "Done! Lets start making "]
			var min=0;
			var max=done.length;
			var random =Math.floor(Math.random() * (+max - +min)) + +min;
			let message = done[random] + response.result.parameters.recipe;
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
