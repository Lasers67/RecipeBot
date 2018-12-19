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

let time, ingredients = [], steps = [];
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

const scrapeRecipe = (url, senderId) => {
	request(url, function (error, response, html) {
	  if (!error && response.statusCode == 200) {
		  steps = [];
		  ingredients = [];
	    var $ = cheerio.load(html);
		var src = $('.rec-photo').attr("src");
		console.log(src);
		sendTextMessage(senderId, "", src);
		if(src)
		sendTextMessage(senderId, "The dish looks to be yummy!");
		let message = "";
		$('span.recipe-ingred_txt[itemprop]').each(function(i, element){
	      var a = $(this).prev();
	      // console.log(element.children[0].data);
		  // console.log($(this).text());
		  message += "* " + $(this).text() + '\n';
		  ingredients.push($(this).text());
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
		  steps.push($(this).text());
		});
	  }
	  console.log(steps, "sad");
	});
}

const showRecipe = (senderId, replace_ing, text) =>{
	if (count == steps.length){
		count = 0;
		steps = [];
		ingredients = [];
		sendTextMessage(senderId, "What are you saying " + text + " about? :D");
		return;
	}
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
		return;
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
		sendTextMessage(senderId, dishes_output);
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

module.exports = {
	scrapeDishes, scrapeRecipe, showRecipe, fromIngredients, findAlt
}
