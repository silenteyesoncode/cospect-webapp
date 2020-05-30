#!/usr/bin/env node
var fs = require('fs');
var uuid = require("uuid");
const http = require("http");
const AWS = require('aws-sdk');

var express = require('express');
var formidable = require('formidable');
var spawn = require("child_process").spawn;

var app = express();

var unq_visitors = 0;
var submissions = 0;
var unq_IPs = [];

function getTimestamp () {
	var login_date = new Date(Date.now());
	var month = login_date.getMonth()+1;
	var date = login_date.getDate();
	var year = login_date.getFullYear();

	var hours = login_date.getHours();
	var minutes = login_date.getMinutes();
	var seconds = login_date.getSeconds();

	var time = hours + ":" + minutes + ":" + seconds + " " + month + "/" + date + "/" + year;
	return time;
}

let rawData = fs.readFileSync('keys.json');
let keys = JSON.parse(rawData);

let accessKeyVal = keys["accessKeyId"];
let secretAccessKeyVal = keys["secretAccessKey"];
let bucket = keys["Bucket"];

let s3bucket = new AWS.S3({
	accessKeyId: accessKeyVal,
	secretAccessKey: secretAccessKeyVal,
	Bucket: bucket
});

function uploadToS3(file_name, file_data) {
	s3bucket.createBucket(function () {
		var params = {
			Bucket: bucket,
			Key: file_name,
			Body: file_data
		};
		s3bucket.upload(params, function (err, data) {
			if (err) {
				console.log('error in callback');
				console.log(err);
			}
		});
	});
}

//================Express Functions================

app.get('/index.html', function (req, res){
    res.sendFile(__dirname + '/index.html');
});

app.get('/', function (req, res){
	let ip = req.ip;

	if (!unq_IPs.includes(ip)) {
		unq_visitors++;
		unq_IPs.push(ip);

		console.log("NEW VISITOR: Total of", unq_visitors, "unique visitors so far");
	}

    res.sendFile(__dirname + '/index.html');
});

app.get('/audio.html', function (req, res){
	res.sendFile(__dirname + '/audio.html');
});

app.get('/formError.html', function (req, res){
	res.sendFile(__dirname + '/formError.html');
});

app.get('/app.js', function (req, res){
	fs.readFile("./app.js", function (err, content) {
		if (err) { res.end(); return; }
		res.writeHeader(200, {"Content-Type": "text/javascript"});
		res.write(content);
		res.end();
	});
});

app.get('/onUpload.js', function (req, res){
	fs.readFile("./onUpload.js", function (err, content) {
		if (err) { res.end(); return; }
		res.writeHeader(200, {"Content-Type": "text/javascript"});
		res.write(content);
		res.end();
	});
});

app.get('/pics/Logo.png', function (req, res){
	fs.readFile("pics/Logo.png", function (err, content) {
		if (err) { res.end(); return; }
		res.writeHeader(200, {"Content-Type": "image/png"});
		res.write(content);
		res.end();
	});
});

app.get('/result.html', function (req, res){
	res.sendFile(__dirname + '/result.html');
});

app.get('/doc.html', function (req, res){
	res.sendFile(__dirname + '/doc.html');
});

app.get('/ty.html', function (req, res){
	res.sendFile(__dirname + '/ty.html');
});

app.get('/style.css', function (req, res){
	fs.readFile("./style.css", function (err, content) {
		if (err) { res.end(); return; }
		res.writeHeader(200, {"Content-Type": "text/css"});
		res.write(content);
		res.end();
	});
});

app.post('/data', function(req, res){
	var id;

	var submissionInfo = {};

	var form = new formidable.IncomingForm();

	form.parse(req);

	form.on('error', (err) => {
		console.log("Form error");
		//TODO: Fix this error
		res.writeHeader(400, {"Content-Type": "text/html"});
		res.write("<!DOCTYPE html>Something went wrong when processing your form submission. Please check the following and try again.");
		res.end();
		return;
	});

	form.on('field', (fieldName, fieldValue) => {
		if (fieldName == "id") {
			id = fieldValue;
			submissionInfo["ID"] = fieldValue;
			
		} else {
			submissionInfo[fieldName] = fieldValue;
		}
	});

	form.on('end', function (name, file) {
		var params = { Bucket: bucket, Key: "info/" + id + ".json" };
		s3bucket.getObject(params, function(err, data) {
			if (err) {
				//TODO: Fix this error
				console.log(err, err.stack);
			} else {
				submissionCurr = JSON.parse(data.Body.toString());

				//check first if "id" and "Time" in submissionCurr
				//assert that fieldValue == submissionCurr["ID"]
				
				submissionInfo["Time"] = submissionCurr["Time"];

				//TODO: Should ty.html be sent now or later?
				fs.readFile("./ty.html", function (err, content) {
					if (err) { res.end(); return; }
					res.writeHeader(200, {"Content-Type": "text/html"});
					res.write(content);
					res.end();
				});

				var json = JSON.stringify(submissionInfo);
				uploadToS3("info/" + id + ".json", json);
				//fs.writeFile('info/' + id + '.json', json, 'utf8', (err) => {});

			}
		});
	});
	//end response if not ended already -- res.end()
});

//We aren't returning the rendered HTML page here. Instead we are returning a JSON containing the ID and symptom
//This is because for the audio recording, a form cannot be submitted containing the blob that can redirect the page
//In audio.html, a POST request can be made but that won't redirect the page
//So, instead, the pages are directly processing the JSON data and rendering it onto the body from result.html
app.post('/submit', function (req, res){
	submissions++;
	console.log("NEW SUBMISSION: Total of ", submissions, " cough sample submissions");

	var id = uuid.v4();
	var file_path = __dirname + '/uploads/' + id;

    var form = new formidable.IncomingForm();
	form.maxFileSize = 10 * 1024 * 1024; //not allowing files greater than 10MB

	var submissionInfo = { "ID":id, "Time":getTimestamp() };

    form.parse(req);

	form.on('error', (err) => {
		console.log("Form error");

		res.writeHeader(400, {"Content-Type": "text/html"});
		res.write("<!DOCTYPE html>Something went wrong when processing your form submission. Please check the following and try again.");
		res.end();
	})

	form.on('field', (fieldName, fieldValue) => {
		submissionInfo[fieldName] = fieldValue;
	});

    form.on('fileBegin', function (name, file){
        file.path = file_path;
    });

    form.on('file', function (name, file){
        console.log('Uploaded ' + file.name);
	});

	form.on('end', function (name, file) {
		//TODO: res and result variables are confusing
		http.get("http://localhost:5000/analyze/" + id, function(result){
			const { statusCode } = result;
			//const contentType = res.headers['content-type'];

			if (statusCode != 200) {
				res.writeHeader(statusCode);
				res.end();
				return;
			}

			var data = "";
			result.on('data', function(chunk) {
				data += chunk;
			});

			result.on('end', function() {
				//Send file over to s3 bucket
				fs.readFile(file_path, (err, file_data) => {		
					if (err) { console.log(err); }			
					uploadToS3("uploads/" + id, file_data);
				});

				uploadToS3("info/" + id + ".json", JSON.stringify(submissionInfo));

				data = JSON.parse(data);

				//TODO: Automatically report and save this to a list of bugs
				var symptom = data["symptom"];
				if (typeof symptom == 'undefined') {
					data["symptom"] = "Problem in processing...";
				}
				data["id"] = id;
				json_result = JSON.stringify(data);

				res.writeHeader(200, {"Content-Type": "application/json"});
				res.write(json_result);
				res.end();

				//Deleting the audio locally, as it has been sent to S3 already
				fs.unlink(file_path, (err)=>{ console.log(err); });
			});
		});
	});
});

//spawn('python', ["-m", "pip", "install", "-r", "requirements.txt"]);
spawn('python', ["modelInference.py"]);
app.listen(3000);
