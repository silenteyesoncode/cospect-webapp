URL = window.URL || window.webkitURL;

var gumStream; 						
var rec; 							
var input; 							

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //audio context to help us record

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var pauseButton = document.getElementById("pauseButton");

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
pauseButton.addEventListener("click", pauseRecording);

function startRecording() {
	console.log("recordButton clicked");
    
    var constraints = { audio: true, video:false }

	recordButton.disabled = true;
	stopButton.disabled = false;
	pauseButton.disabled = false;

	recordButton.style.display = "none";

	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

		audioContext = new AudioContext();

		//document.getElementById("formats").innerHTML="Format: 1 channel pcm @ "+audioContext.sampleRate/1000+"kHz"

		gumStream = stream;
		
		input = audioContext.createMediaStreamSource(stream);

		
		rec = new Recorder(input,{numChannels:1})

		rec.record()

		console.log("Recording started");

	}).catch(function(err) {
		document.getElementById("error-msg").style.display = "";
		console.log("Err in recording ", err);
		recordButton.style.display = "";

    	recordButton.disabled = false;
    	stopButton.disabled = true;
    	pauseButton.disabled = true
	});
}

function pauseRecording(){
	console.log("pauseButton clicked rec.recording=",rec.recording );
	if (rec.recording){ //pause
		rec.stop();
		pauseButton.innerHTML="Resume";
	}else{ //resume
		rec.record();
		pauseButton.innerHTML="Pause";
	}
}

function stopRecording() {
	console.log("stopButton clicked");

	document.getElementById("loading").style.display = "";

	stopButton.disabled = true;
	recordButton.disabled = false;
	pauseButton.disabled = true;

	pauseButton.innerHTML="Pause";
	
	rec.stop();

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	//create the wav blob and pass it on to createDownloadLink
	rec.exportWAV(submitPost);
}

function submitPost(blob) {
	var xhr=new XMLHttpRequest();
	xhr.onload=function(e) {
		if(this.readyState === 4) {
			let domparser = new DOMParser();
			//let doc = domparser.parseFromString(e.target.responseText, "text/html");
			//document.body = doc.body;


			var getResultsPage = new XMLHttpRequest();
			getResultsPage.onload=function(response) {
				var doc = domparser.parseFromString(response.target.responseText, "text/html");
				//document.body.innerHTML = e.target.responseText;

				var id = JSON.parse(e.target.responseText)["id"];
				var symptom = JSON.parse(e.target.responseText)["symptom"];

				doc.getElementById("cough-symptom").innerHTML = symptom;
				doc.getElementById("id").innerHTML = id;
				if (symptom == "High")  { doc.getElementById("risk-decision").innerHTML = "moderate"; }
				document.body = doc.body;
			}
			getResultsPage.open("GET","result.html", true);
			getResultsPage.send();



			//document.body.innerHTML = e.target.responseText;
		}
		//window.history.pushState({"html":response.html,"pageTitle":response.pageTitle},"", urlPath);
		//renderResults();
	};

	var fd=new FormData();
	fd.append("audio_data", blob);

	xhr.open("POST","submit",true);
	xhr.send(fd);
}
