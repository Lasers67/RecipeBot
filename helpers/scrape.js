const FACEBOOK_ACCESS_TOKEN = 'EAADG5fKLZBWIBAIUOKXZAwSOe93qzzSnFSwLxwBKH52mYfpbu3zGLqGb8dUsMJku4dRWXtfSg0vHiGZB1V402CVznD3rF0TOZAePk5Vik0RF8VcQKWAZCu3CCkHXxZAxzBHVjCXhy5UDpwKMjPiFJcGkqWzeOyW57sETrPZBN6HggZDZD';
const request = require('request');
const { default_alt } = require('./alternate.js')
var next_step=['Are you ready for the next step?','Are you done with the previous step?','Shall we move ahead?','Done?','Shall I tell you the next step?', 'Let me know when you are ready for next step.'];
const sendTextMessage = (senderId, text, image='') => {
	if(image==''){
		request({
			url: 'https://graph.facebook.com/v2.6/me/messages',
			qs: { access_token: FACEBOOK_ACCESS_TOKEN },
			method: 'POST',
			json: {
				recipient: { id: senderId },
				message: { text },
			}
		});
	} else {
		request({
			url: 'https://graph.facebook.com/v2.6/me/messages',
			qs: { access_token: FACEBOOK_ACCESS_TOKEN },
			method: 'POST',
			json: {
				recipient: { id: senderId },
				message: {
					"attachment":{
				      "type":"image",
				      "payload":{
				        "url": image
				      }
				    }
				},
			}
		});
	}
};
var cheerio = require('cheerio');

let time, ingredients = [], steps = [],priority=[];
var count = 0;

const scrapeDishes = (name, senderId) => {
	let dishes = [];
	const getDishes = new Promise( resolve => {
		request('https://www.allrecipes.com/search/results/?wt=' + name + '&sort=re', function (error, response, html) {
	  		if (!error && response.statusCode == 200) {
			    var $ = cheerio.load(html);
				$('span.fixed-recipe-card__title-link').each(function(i, element){
				  if(i==1) return false;
				  var a = $(this).prev();
				  dishes.push( {
					  name: element.children[0].data,
					  url: element.parent.attribs.href
				  });
				  scrapeRecipe(element.parent.attribs.href, senderId);
			    });
				resolve();
			}
		});
	});
	return Promise.all([getDishes]).then(() => {
		return dishes;
	});
}
var Recipe=[];
const scrapeRecipe = (url, senderId) => {

	request(url, function (error, response, html) {
	  if (!error && response.statusCode == 200) {
		  steps = [];
		  ingredients = [];
		  priority=[];
	    var $ = cheerio.load(html);
		if(url== "https://www.allrecipes.com/recipe/20080/chili-chicken/" )
		{
			priority=['L','L','M','H'];
		}
		var src = $('.rec-photo').attr("src");
		console.log(src);
		sendTextMessage(senderId, "", src);
		if(src)
		sendTextMessage(senderId, "The dish looks to be yummy!");
		let message = "";
		var i=0;
		$('span.recipe-ingred_txt[itemprop]').each(function(i, element){
	      var a = $(this).prev();
		  // console.log(element.children[0].data);
		  // console.log($(this).text());
		  message += "* " + $(this).text() + '\n';
		  if(url=="https://www.allrecipes.com/recipe/20080/chili-chicken/" && i==3 )
		  	ingredients.push(String($(this).text()).split(" ").slice(1).join(" "));
		  else
		  	ingredients.push(String($(this).text()).split(" ").slice(2).join(" "));
		  console.log(ingredients);
		  // i++;
	    });
		sendTextMessage(senderId, message);
		setTimeout(function(){
			$('span.ready-in-time').each(function(i, element){
		      var a = $(this).prev();
		      // console.log(element.children[0].data);
			  time = ($(this).text());
			  // console.log($(this).text());
		    });
			sendTextMessage(senderId, "The time taken for this recipe will be around " + time);
			sendTextMessage(senderId, "Are you ready to cook this recipe?");
		},2000);
		$('span.recipe-directions__list--item').each(function(i, element){
	      var a = $(this).prev();

	      // console.log(element.children[0].data);
		  // console.log($(this).text());
		  var res=$(this).text().split(".");
		  Recipe.push(res);
		  var to_print="";



		//   for(var i=0;i<res.length-1;i++)
	 	// {
		// 	if()
		// }



		  steps.push($(this).text());
		});
	  }
	  console.log(steps, "sad");
	});
}

const showRecipe = (senderId, replace_ing, text,laser) =>{
	if (count == steps.length){
		count = 0;
		steps = [];
		ingredients = [];
		sendTextMessage(senderId, "What are you saying " + text + " about? :D");
		return true;
	}
	if(laser==0){
		var message = "";
		var flag = 0;
		console.log(replace_ing);
		var temp = String(steps[count]).trim().split(" ");
		for (var i = 0; i < temp.length; i++) {
			if(temp[i].toLowerCase() in replace_ing) {
				message+= replace_ing[temp[i]] + " ";
				continue;
			}
			for (var j in  replace_ing) {
				if(temp[i].toLowerCase().includes(j)){
					message+= replace_ing[j] + " ";
					flag = 1;
					break;
				}
			}
			if(flag) {
				flag = 0;
				continue;
			}
			if(temp[i].toLowerCase() in replace_ing) {
				message+= replace_ing[temp[i]] + " ";
				continue;
			}
			message+=temp[i] + " ";
		}
		sendTextMessage(senderId, message);
		count++;
		if (count+1 == steps.length){
			count = 0;
			steps = [];
			ingredients = [];
			sendTextMessage(senderId, "That was the last step!");
			return true;
		}
		if (count != steps.length){
			setTimeout(function(){
				var min=0;
				var max=next_step.length;
				var random =Math.floor(Math.random() * (+max - +min)) + +min;
				sendTextMessage(senderId, next_step[random]);
				// sendTextMessage(senderId, "Are you ready for the next step?");
			},1000);
		};
	}
	else{
		var message = "";
		var flag = 0;
		// console.log(replace_ing);
		var temp = Recipe[count];
		for (var i = 0; i < temp.length; i++) {
			for (var j in  replace_ing) {
				if(temp[i].toLowerCase().includes(j)){
					flag = 1;
					break;
				}
			}
			if(flag) {
				flag = 0;
				continue;
			}
			message+=temp[i];
		}
		sendTextMessage(senderId, message);
		count++;
		if (count+1 == steps.length){
			count = 0;
			steps = [];
			ingredients = [];
			sendTextMessage(senderId, "That was the last step!");
			return true;
		}
		if (count != steps.length){
			setTimeout(function(){
				var min=0;
				var max=next_step.length;
				var random =Math.floor(Math.random() * (+max - +min)) + +min;
				sendTextMessage(senderId, next_step[random]);
				// sendTextMessage(senderId, "Are you ready for the next step?");
			},1000);
		};
	}


}

const fromIngredients = (senderId, ingredients) => {
	let dishes = [];
	let dishes_output = "";
	let ing = "";
	for (var i = 0; i < ingredients.length-1; i++) {
		ing+=ingredients[i] + ",";
	}
	ing+=ingredients[ingredients.length-1];
	const getDishes = new Promise( resolve => {
		request('https://www.allrecipes.com/search/results/?ingIncl=' + ing + '&sort=re', function (error, response, html) {
	  		if (!error && response.statusCode == 200) {
			    var $ = cheerio.load(html);
				$('span.fixed-recipe-card__title-link').each(function(i, element){
					if(i==5) return false;
				  var a = $(this).prev();
				  dishes.push( {
					  name: element.children[0].data,
					  url: element.parent.attribs.href
				  });
				  dishes_output+="* " + element.children[0].data + "\n";
				  // scrapeRecipe(element.parent.attribs.href, senderId)	;
			    });
				resolve();
			}
		});
	});
	Promise.all([getDishes]).then(() => {
		sendTextMessage(senderId, "Here are some dishes you can make: ");
		setTimeout(function() {sendTextMessage(senderId, dishes_output);}, 2000);
	});

}

const findAlt = (senderId, ingredient) => {
	var alt_def;
	for (var i = 0; i < default_alt.length; i++) {
		if (default_alt[i].name.toLowerCase().includes(ingredient[0].toLowerCase())) {
			var options =  default_alt[i].diff.split("OR");
			var message = "Do you have ";
			for (var i = 0; i < options.length - 1; i++) {
				// console.log(options[i].split(" ").slice(2));
				message+=options[i].split(" ").slice(2).join(" ") + "OR ";
			}
			message+=options[options.length-1].split(" ").slice(2).join(" ") + "?";
			alt_def = options[options.length-1].split(" ").slice(2).join(" ");
			break;
		}
	}
	sendTextMessage(senderId, message);
	return alt_def;
}


const sendDesc = (senderId, name) => {
	var dishes = [];
	const firstResult = new Promise( resolve => {
		request('https://www.allrecipes.com/search/results/?wt=' + name + '&sort=re', function (error, response, html) {
	  		if (!error && response.statusCode == 200) {
			    var $ = cheerio.load(html);
				$('span.fixed-recipe-card__title-link').each(function(i, element){
				  if(i==1) return false;
				  var a = $(this).prev();
				  dishes.push( {
					  name: element.children[0].data,
					  url: element.parent.attribs.href
				  });
				  scrapeDesc(element.parent.attribs.href, senderId);
			    });
				resolve();
			}
		});
	});
}

const scrapeDesc = (url, senderId) => {
	request(url, function (error, response, html) {
	  if (!error && response.statusCode == 200) {
	    var $ = cheerio.load(html);
		let desc = "";
		$('div.submitter__description').each(function(i, element){
	      var a = $(this).prev();
		  desc += ($(this).text());
	    });
		var src = $('.rec-photo').attr("src");
		sendTextMessage(senderId, desc);
		sendTextMessage(senderId, "It looks good!");
		sendTextMessage(senderId, "", src);
		}
	});
};

const ability = (senderId) => {
	var res = "I can do a variety of things related to recipes. Some of them include-\n";
	res += '* Lookup recipes for you and provide them to you stepwise.\n';
	res += '* List dishes you can make with the ingredients you have.\n';
	res += '* Lookup for alternate ingredients that you may use in case some ingredients are not available.\n';
	res += '* Alert dishes according to a particular festival or occasion.\n';
	// sendTextMessage(senderId, res);
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: { access_token: FACEBOOK_ACCESS_TOKEN },
		method: 'POST',
		json: {
			recipient: { id: senderId },
			message: {
				"text": res,
				"quick_replies":[
					{
				  	"content_type":"text",
				  	"title": "How to make rajma",
			  		"payload":"123"
					},
					{
				  	"content_type":"text",
				  	"title": "I have ingredients",
					"payload":"1234"
			  		}
		  		]
			},
		}
	});

}
var alter_recipe_message=["No Problem! We can do without that", "Its okay, the dish will still work fine","No Problem! We can still continue more or less :)"];
var no_more=["Problem! We can't do without that item", "That is one of the main ingredient. Can't cook without that!","Cannot do without that ingredient, you'd need to make another dish :( "];
const noIng = (senderId, missing) => {
	console.log(ingredients.indexOf(missing),missing,priority);
	let idx = -1;
	for (var i = 0; i < ingredients.length; i++) {
		if(ingredients[i].includes(missing)) idx = i;
	}
	console.log(idx);
	if(priority[idx]=='L')
	{
		var min=0;
		var max=alter_recipe_message.length;
		var random =Math.floor(Math.random() * (+max - +min)) + +min;
		sendTextMessage(senderId, alter_recipe_message[random]);
		return 1;
	}
	if(priority[idx]=='M' || priority[idx]=='H')
	{
		var min=0;
		var max=no_more.length;
		var random =Math.floor(Math.random() * (+max - +min)) + +min;
		sendTextMessage(senderId, no_more[random]);
		count = steps.length - 1;
		return 2;
	}

}
module.exports = {
	sendDesc, ability, scrapeDishes, scrapeRecipe, showRecipe, fromIngredients, findAlt, noIng
}
