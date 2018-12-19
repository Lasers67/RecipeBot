var request = require('request');http://dish.allrecipes.com/common-ingredient-substitutions/
var cheerio = require('cheerio');
var alt = [];
request('https://www.allrecipes.com/recipe/133742/besan-ladoo/?internalSource=hub%20recipe&referringContentType=Search&clickId=cardslot%201', function (error, response, html) {
  if (!error && response.statusCode == 200) {
    var $ = cheerio.load(html);
	var src = $('.rec-photo.stretch').attr("src");
	console.log(src);
    // $('.rec-photo.stretch').each(function(i, element){
    //   	var a = $(this);
	// 	console.log(a.attrsrc())
	//   	// var td=a.children('td').eq(1);
	//       });
  }
});
