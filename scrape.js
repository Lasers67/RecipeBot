var request = require('request');http://dish.allrecipes.com/common-ingredient-substitutions/
var cheerio = require('cheerio');

request('http://dish.allrecipes.com/common-ingredient-substitutions/', function (error, response, html) {
  if (!error && response.statusCode == 200) {
    var $ = cheerio.load(html);
    var i=0;
    $('table tbody tr').each(function(i, element){
      if(i!=0){
      	var a = $(this);
      	var td=a.children('td').eq(0);
      	console.log(td.text());
      }
    });
  }
});
