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

var laser = 0;

const sendFestivalNotification = (senderId) => {
	var min=0;
	var max=2;
	var rand =Math.floor(Math.random() * (+max - +min)) + +min;
	if(rand == 1) {

		sendTextMessage(senderId, "Hello there! Happy Dusshera!");
		setTimeout(function () {
			sendTextMessage(senderId, "Sabudana Khichdi and Besan Ladoo are some Dusshera special. Which do you want to cook today?");
		}, 2000);
	} else {
		sendTextMessage(senderId, "Hello there! Happy Holi!");
		setTimeout(function () {
			sendTextMessage(senderId, "Lassi and Chaat Papri are some Holi special. Which one would you prefer to cook today?");
		}, 2000);
	}
}

const occasionResponse = (senderId, occasion) => {
	var text;
	console.log('asd');
	switch(occasion) {
		case "Dussera":
			text = "Sabudana Khichdi and Besan Ladoo are some Dusshera special. Which do you want to cook today?";
			break;
		case "Holi":
			text = "Lassi and Chaat Papri are some Holi special. Which one would you prefer to cook today?";
			break;
		case "Christmas":
			text = "Chocolate Tart and Milk Fudge are Christmas speciality. Which one are we cooking?";
			break;
		case "Diwali":
			text = "Diwali is celebrated with Samosa and Barfi . Which one are we making?";
			break;
		case "Shraadh":
			text = "People usually have Khichdi and Boiled Aloo during Shradh. Which of the two are you making?";
			break;
		default:
			text = "My database currently doesn't have all of the worlds numerous occasions! Sorry :( ";
			break;
	}
	sendTextMessage(senderId, text);
}

let dishes = [], donthave = 0, replace_ing = [], missing, flag = 0, festival = 1, alt_def;



module.exports = (event) => {
	const senderId = event.sender.id;
	const message = event.message.text;
	const apiaiSession = apiAiClient.textRequest(message, {sessionId: 'recipebot'});
	console.log(message);
	const { sendDesc, ability, scrapeDishes, showRecipe, fromIngredients, findAlt } = require('./scrape.js');
	apiaiSession.on('response', (response) => {
		const result = response.result.fulfillment.speech;
		console.log(response);
		var d = new Date();
		if(festival && d.getHours() == 14 && response.result.action == "input.welcome") {
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
		else if(donthave)
		{

			const { noIng } = require("./scrape.js");
			donthave = 0;
			replace_ing[missing] = null;
			laser = noIng(senderId, missing);
			if(laser == 1)
				sendTextMessage(senderId, "So should we continue?");
			return;
		}

		if (response.result.metadata.intentName == 'ocassion'){
				occasionResponse(senderId, response.result.parameters.Occasions);
				return;
		}
		if (response.result.action == 'smalltalk.confirmation.yes' || response.result.metadata.intentName == 'Positive Response'){
			var complete = showRecipe(senderId, replace_ing, event.message.text, laser);
			if(complete) replace_ing = [];
			return;
		}
		if (response.result.action == 'smalltalk.confirmation.no' && !donthave){
			sendTextMessage(senderId, "okay, I'll wait.");
			return;
		}
		if (response.result.metadata.intentName == 'BotAbilities'){
				ability(senderId);
				return;
		}
		if (response.result.metadata.intentName == 'get_ingredients'){
			return;
		}
		if (response.result.metadata.intentName == 'Add_Description'){
			sendDesc(senderId, response.result.parameters.recipe);
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
			console.log(response.result.parameters.ingredients);
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
