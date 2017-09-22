/* Server.js file
 * Creates a server, that generates a form with a textfield for inputing the customer's phone number
 * and two required checkboxes for accepting the terms, and a "submit" button. When the "submit"
 * button is pressed, the customer receives a promo code based on the time of the day.
 */

//Imported libraries
var http = require('http');
var fs = require('fs');
var url = require('url');
var twilio = require('twilio');
var moment = require('moment');
var qs = require('querystring');

//Twilio credentials
var accountSid = 'AC001d84acac82529d980a6b061a14e808'; // Your Account SID from www.twilio.com/console
var authToken = 'fafb5babddfb3355c729e5d1202bb4e3';   // Your Auth Token from www.twilio.com/console
var client = new twilio(accountSid, authToken);

//Function that gets the last 2 digits of the time (either AM or PM)
var date = moment().format('LTS').slice(-2);

//Initialisation of the server
var server = http.createServer(function (req, res) {
	//Form data that are passed by the form to the server
	var formData = url.parse(req.url,true).query;
	var pNumber = formData.pNumber;
	var over18 = formData.over18;
	var tnc = formData.tnc;
	var smsCode = '';
	
	//Negates the favicon from creating second instance of the server.
	if (req.url === '/favicon.ico') {
		res.writeHead(200, {'Content-Type': 'image/x-icon'} );
		res.end();
		console.log('favicon requested');
	return;
	}
	
	/* Condition that checks what is the server time. Returns the apropriate promo code 
	 * depending on the time of the server.
	 */
	if (date === 'AM') {
		smsCode = 'Good morning! Your promocode is AM123';
	} else {
		smsCode = 'Hello! Your promocode is PM456';
	}
	
	//Condition that checks the form method that was used to send the form data.
    if (req.method == 'GET') {
		displayForm(res);	
		saveFormData(pNumber, over18, tnc);

    } else if (req.method == 'POST') {
		displayForm(res);
		processForm(req, res, smsCode);
    }
}); // end of server variable.

/* Function that reads the form.html file and displays the form
 * on the user's client.
 */
function displayForm(res) {
    fs.readFile('form.html', function (err, data) {
        res.writeHead(200, {
            'Content-Type': 'text/html',
                'Content-Length': data.length
        });
        res.write(data);
        res.end();
    });
} //end of displayForm function

/* Function that processes the data that are received from the form.
 * Then after the form is processed, it saves the data on a .json file
 * and sends the promo code to the customer.
 */
function processForm(req, res, smsCode) {
	if (req.method == 'POST') {
        var body = '';
		this.smsCode = smsCode;

        req.on('data', function (data) {
            body += data;

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6)
                req.connection.destroy();
        });

        req.on('end', function () {
            var post = qs.parse(body);
			saveFormData(post.pNumber, post.over18, post.tnc);
			sendSMS(smsCode, post.pNumber);
        });
    }
} //end of processForm function

/* Function that saves the form data into a .json file.
 * It receives the three inputs from the form and then saves
 * the data into a .json file.
 */
function saveFormData(pNumber, over18, tnc) {
	this.pNumber = pNumber;
	this.over18 = over18;
	this.tnc = tnc;
	
	// Creationg of the customer object.
	var obj = { 
		Customer: {'PhoneNumber': pNumber,'Over18': over18,'TnC': tnc}
	};
	
	// Read the existing file
	fs.readFile('data.json', (err, data) => {
		if (err && err.code === "ENOENT") {
			// But the file might not yet exist.  If so, just write the object and bail
			return fs.writeFile('data.json', JSON.stringify([obj]), error => console.error);
		}
		else if (err) {
			// Some other error
			console.error(err);
		}    
		// Otherwise, get its JSON content
		else {
			try {
				const fileData = JSON.parse(data);

				// Append the object you want
				fileData.push(obj);

				// Write the file back out
				return fs.writeFile('data.json', JSON.stringify(fileData), error => console.error)
			} catch(exception) {
				console.error(exception);
			}
		}
	});
}

/* Function that generates, and sends the sms to the customer.
 * This function uses the Twilio SMS Api.
 */
function sendSMS(smsCode, pNumber) {
	this.smsCode = smsCode;
	client.messages.create({
		body: smsCode,
		to: pNumber,  		 // Text this number
		from: '+19546136096' // My personal Twilio number
	}, function(err, message) {
	if (err) {
		console.log(err);
	} else {
		console.log(message.id);
	}
	});
}	
server.listen(8080);
console.log("server listening on 8080");