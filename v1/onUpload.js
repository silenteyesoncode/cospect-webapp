//This method prevents the user from re-clicking upload or record button once either is clicked
function onUpload() {
	document.getElementById("record-btn").disabled = true;
	document.getElementById("upload-btn").disabled = true;
	
	//document.getElementById('coughForm').submit();

	var postReq=new XMLHttpRequest();
	postReq.onload=function(e) {
		if (postReq.status != 200) {
			location.href = 'formError.html';
		}
		if(this.readyState === 4) {
			let domparser = new DOMParser();

			var getResultsPage = new XMLHttpRequest();
			getResultsPage.onload=function(response) {
				var doc = domparser.parseFromString(response.target.responseText, "text/html");
				//document.body.innerHTML = e.target.responseText;

				var id = JSON.parse(e.target.responseText)["id"];
				var symptom = JSON.parse(e.target.responseText)["symptom"];

				doc.getElementById("cough-symptom").innerHTML = symptom;
				doc.getElementById("id").innerHTML = id;
				doc.getElementById("submissionID").value = id;
				if (symptom == "High")  { doc.getElementById("risk-decision").innerHTML = "moderate"; }
				document.body = doc.body;
			}
			getResultsPage.open("GET","result.html", true);
			getResultsPage.send();


		}
	};

	var form = document.getElementById("coughForm");
	var fd=new FormData(form);

	postReq.open("POST","submit",true);
	postReq.send(fd);
}
