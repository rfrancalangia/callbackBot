var HTTPS = require('https');
var cool = require('cool-ascii-faces');

var botID = process.env.BOT_ID;
var mongoose = require('mongoose');
var CommandError = "You did it wrong, remember to RTFM";
var statusRegex = /^\/\!power,ON$/;
mongoose.connect(/*Here is where you connect to your mongoDB*/);

mongoose.connection.once('open', function(){
  console.log("Connected to Database, contacting other bots to start the revolution");
}).on('error', function(error){
  console.log('Could not connect to database: Error', error);
});

const Schema = mongoose.Schema;

const CallAndResponse = new Schema({
  call: String,
  response: String
});

const CandR = mongoose.model('candr', CallAndResponse);

/*
**  Here are some sample Call and Responses, have them run once and once they are in the DB
**  comment them out so you dont make a ton of redundant modules
*/
// var intro = new CandR({
//   call: "!introduce yourself",
//   response: "Greetings, my name is Marvin I am a bot created for the sole purpose of pleasing my creator. Invoke my services by typing '!' followed by a command. Until then..."
// });
// intro.save();

// var new = new CandR({
//   call: "!man new",
//   response: "To create a new call you type '#' followed by the desired call (including the trigger) and then type a comma followed by the response you want. To get a picture or gif to show you must include the pictures address or link in the response field"
// });
// new.save();

// var edit = new CandR({
//   call: "!man edit",
//   response: "To edit a call you type '/' followed by the call you want to edit (including the trigger) and then immediately after the call you place a comma and then you input the new response. The ability to edit certain calls has been limited"
// });
// edit.save();

// var rekt = new CandR({
//   call: "!rekt",
//   response: "REKT\nE\nK\nT"
// });
// rekt.save();

function respond() {
  var request = JSON.parse(this.req.chunks[0]);
  var botRegex = /^\!cool guy$/;
  if (request.text[0] == '!') {
    if(request.text && botRegex.test(request.text)) {
      this.res.writeHead(200);
      postMessage(cool());
      this.res.end();
    } else {
    this.res.writeHead(200);
      CandR.findOne({ call: request.text}).then(function(result){
       postMessage(result.response);
      });
      this.res.end();
    }
  } else if (request.text[0] == '/'){
    var str = request.text;
    var res = str.split(",");
    res[0] = res[0].substr(1);
    str = res[0].substr(-4);
    CandR.findOne({ call: res[0]}).then(function(result){
      if (str.localeCompare("team") == 0) {
        var c = res[1][0];
        if (c === "+") {
          result.response = result.response + ", " + res[2];
        } else if (c === "-"){
          var reg = new RegExp(res[2], 'g');
          result.response = result.response.replace(reg, "");
        } else {
          postMessage(CommandError);
        }
      } else {
        result.response = res[1];
      }
      result.save();
    });
  } else if (request.text[0] == '#'){
    var str = request.text;
    var res = str.split(",");
    res[0] = res[0].substr(1);
    if (res[0][0] != "!"){
      postMessage(CommandError);
    } else {
      var ontheGo = new CandR({
        call: res[0],
        response: res[1]
      });
    }
    ontheGo.save();
  } else {
    console.log("don't care");
    this.res.writeHead(200);
    this.res.end();
  }
}

function postMessage(response) {
  var botResponse, options, body, botReq;

  botResponse = response;

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
    "bot_id" : botID,
    "text" : botResponse
  };

  console.log('sending ' + botResponse + ' to ' + botID);

  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 202) {
        //neat
      } else {
        console.log('rejecting bad status code ' + res.statusCode);
      }
  });

  botReq.on('error', function(err) {
    console.log('error posting message '  + JSON.stringify(err));
  });
  botReq.on('timeout', function(err) {
    console.log('timeout posting message '  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}

exports.respond = respond;