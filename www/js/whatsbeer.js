var width = screen.width;
var height = screen.height;

var beer_api_key = "a125e6a72b04868a7a2dc9ed2e71b20d";
var brewery_site = "https://www.bembe.tk/webservice/beers/index.php?key=" + beer_api_key;

var google_api_key = "AIzaSyBaEXwP1p1cnCnHqzF7TSjgIlV9S2F3aPs"
var CV_URL = "https://vision.googleapis.com/v1/images:annotate?key=" + google_api_key;

var type="LOGO_DETECTION";
var max_results = 1;

var main_file = "main.html";
var logo = "img/ic_launcher.png";
var tts_ico = "img/ic_tts.png";

var main_text;

var time = 0;

window.addEventListener('popstate', function(event) {
	var secs = new Date($.now());
    if (time > 0) {
        console.log("Second back press");
		console.log("Time = " + time);
		console.log("Now = " + secs.getSeconds());
		if(secs.getSeconds() - time > 2)
		{
			console.log("Passed more than 2 secs");
			showHome();
			time = 0;
		}
		else
		{
			$('#exitPopup').show();
			time = 0;
		}
    } else {
        console.log("First back press");
		console.log("Now:"+secs.getSeconds());
        time = secs.getSeconds();
    }

    history.pushState(null, null, window.location.pathname);

}, false);

window.addEventListener('offline', function(event) {
	alert('No internet connection so the functionality will remain disable till the connection will be active again!');
	$('#btnPhoto').click(function() {alert('No internet connection so the functionality will remain disable till the connection will be active again!');});
}, false);

window.addEventListener('online', function(event) {
	$('#btnPhoto').click(function() {$('#chooseSource').show();});
}, false);

$(window).on('resize', function(){
   // If the current active element is a text input, we can assume the soft keyboard is visible.
   if($(document.activeElement).prop('type') === 'text') {
	   alert('Keyboard opened');
      $('.modal-content').css("padding-top",'20%');
   } else {
      $('modal-content').css("padding-top",'30%');
   }
});

document.addEventListener("deviceready", onLoad , false);

$(document).ready(onLoad);

function onLoad(event){
	try{
		var networkState = navigator.network.connection.type;
		
		if(width > height)
		{
			$('#load_img').attr('height', height/2);
		}else{
			$('#load_img').attr('width', width*0.66);
		}
			
		$.ajax({
			url : main_file,
			async:false,
			success : function(result){
						main_text = result;
						showHome();
					},
			error : function(){
					main_text = $('#response').html();	
			},
			complete: showHome
		});

	}catch(e)
	{
		console.log("onLoad():"+e);
		main_text = $('#response').html();
		showHome();
	}
}

function askBeerName(e)
{
	var name = $("#name").val();
	if (name === '') {
		alert("Please insert a name!!");
		e.preventDefault();
	} else {
		$("#name").val('');
		loading();
		searchbeer(name);
	}
}

function shootPhoto(){
	console.log("shootPhoto()");
	getImage(Camera.PictureSourceType.CAMERA);
}

function loadPhoto(){
	console.log("loadPhoto()");
	getImage(Camera.PictureSourceType.SAVEDPHOTOALBUM);
}

function getImage(source){
	try{
		console.log("getImage("+source+")");
		$('#chooseSource').hide();
		if(navigator.camera)
		{
			navigator.camera.getPicture(
				function(imageData){
					//Success
					console.log("getPicture(): Image successfully retrieved.");
					//console.log(imageData);
					//drawPhoto("data:image/jpeg;base64,"+imageData, "photo");
					loading();
					elaborate(imageData);
				},
				function(message){
					//Failed
					console.log("getPicture() not worked:"+message);
					showResult("getPicture() not worked:"+message);
				},
				{	quality: 50,
					sourceType: source,
					encodingType: Camera.EncodingType.JPEG,
					destinationType: Camera.DestinationType.DATA_URL,
					correctOrientation: true
				});
		}else{
			console.log("getImage(): no camera defined.");
			$('#selectedFile').click();
		}				
	}catch (e)
	{
		showResult("getImage():" + e);
		console.log("getImage():" + e);
	}
}

function picChange(evt){ 
	try {
		console.log("height:"+height+" width:"+width);
		//get files captured through input
		var fileInput = evt.target.files;
		console.log($("#selectedFile").val());
		if(fileInput.length>0){
			//window url 
			var windowURL = window.URL || window.webkitURL;
			//picture url
			try{
				console.log("createObjectURL");
				var picURL = windowURL.createObjectURL(fileInput[0]);
				console.log("URL created " + picURL);
				
				var xhr = new XMLHttpRequest();
				xhr.open('GET', picURL);
				xhr.responseType = 'arraybuffer';
				xhr.onreadystatechange = function () {
					if (xhr.readyState !== 4) {
						return;
					}				
					var returnedBlob = new Blob([xhr.response], {type: 'image/jpeg'});
					var reader = new FileReader();
					reader.onload = function(e) {
						var returnedURL = e.target.result;
						var returnedBase64 = returnedURL.replace(/^[^,]+,/, '');
						elaborate(returnedBase64);
					};
					reader.readAsDataURL(returnedBlob); //Convert the blob from clipboard to base64
				};
				xhr.send();
			}
			catch (e)
			{
				try{
					console.log("FileReader");
					var fileReader = new FileReader();
					fileReader.onload = function (event) {
						console.log(event.target.result);
						elaborate(event.target.result);
					};
					fileReader.readAsDataURL(fileInput[0]);
				}catch(e)
				{
					showResult("FileReader()" + e);
					console.log(e);
				}
			}
			
			/*
			drawPhoto(picURL, "capturedPhoto");
			windowURL.revokeObjectURL(picURL);
			*/
		}
	}catch(e){
		showResult("picChange():"+e);
		console.log("picChange():"+e);
	}
}

function back()
{
	try{
		showHome();
	}catch(e)
	{
		console.log("back():"+e);
	}
}

function elaborate(content) {
	try{
		loading();
		var ret_val;
		// Strip out the file prefix when you convert to json.
		var request =  '{' +
		' "requests": [' +
		'	{ ' +
		'	  "image": {' +
		'	    "content":"' + content.replace("data:image/jpeg;base64,", "") + '"' +
		'	  },' +
		'	  "features": [' +
		'	      {' +
		'	      	"type": "' + type + '",' +
		'			"maxResults": ' + max_results + 
		'	      }' +
		'	  ]' +
		'	}' +
		']' +
		'}';

		$.ajax({
			type: 'POST',
			url: CV_URL,
			data: request,
			dataType: 'json',
			contentType: 'application/json; charset=utf-8',
			success: function(data, textStatus, jqXHR) {
				try{
					var beer_name = data.responses[0].logoAnnotations[0].description;
					searchbeer(beer_name);
				} catch(e)
				{
					console.log("elaborate(): Exception thrown retrieving results:"+e);
					$('#nameRequest').show();
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log("elaborate() post request error: " + jqXHR.status + " " + jqXHR.responseText);
				$('#nameRequest').show();
			}
		}); 
	}catch(e){
		showResult("elaborate():"+e);
		console.log("elaborate():"+e);
	}
}

function searchbeer(beerName)
{
	try{
		var reqURL = brewery_site+"&format=json&name="+beerName+"*";
		var method = "GET";
		var xhttp;
		var ret_val;
		var descript = "No Beer Found with name <b>"+beerName+"</b>";

		console.log(method+":"+reqURL);
		
		$.ajax({
			type: method,
			url: reqURL,
			dataType: 'json',
			success: function(json, textStatus, jqXHR) {
				try{
					//var json = JSON.parse(JSON.stringify(data));
					var logo_img_tag = "<img class=\"beer_logo\" src=\"<src>\" />";
					if(json.status == "success")
					{
						console.log(json.status)
						descript ="";
							
						for (i = 0; i < json.data.length; i++) { 
							if(json.data[i].labels)
							{
								logo_img = logo_img_tag.replace("<src>", json.data[i].labels.medium);
							}
							else
								logo_img = logo_img_tag.replace("<src>", logo);
							
							if(json.data[i].name)
							{
								descript += "\t<div data-role=\"collapsible\" class=\"ui-nodisc-icon ui-alt-icon\" data-collapsed-icon=\"carat-d\" data-expanded-icon=\"carat-r\" data-iconpos=\"right\" style =\"vertical-align: middle;\">\n" +
											"\t\t<h3>&emsp;"+ 
												logo_img + json.data[i].name + "<br />" +
												"&emsp;<span>Vol. " + json.data[i].abv + " %</span>" +
											"</h3>\n";
								if(json.data[i].description)
									descript += "\t\t<p><img src=\""+tts_ico+"\" width=\"25\" /><br/>" + json.data[i].description + "</p>\n";
								else
									descript += "\t\t<p>Coming soon</p>\n";
											
								descript += "\t</div>\n";
							}
						}
						descript += "\n"			
					}
					
					showResult(descript);
				}catch(e){
					showResult(descript+"\nException:"+e);
					console.log("searchbeer(): REST request Exception:"+e);
				}					
			},
			error: function(jqXHR, textStatus, errorThrown){
				showResult(descript);
				console.log("searchbeer() get request error: " + jqXHR.status + " " + jqXHR.responseText);
			}
		});

	}catch(e)
	{
		showResult("searchbeer():"+e);
		console.log("Exception in searchbeer():"+e);
	}
	
}

function drawPhoto(objPhoto, canvasName){

	var canvas=document.getElementById(canvasName);
	var ctx=canvas.getContext("2d");
	
	canvas.width = width*0.9;
	canvas.height = height*0.9;
	
	//create image
	var photo = new Image();
	photo.onload = function(){
		try{
			var ratio = (photo.width/photo.height);
			console.log("ratio:"+ratio);
			//draw photo into canvas when ready
			ctx.drawImage(photo, 0, 0, canvas.width, canvas.height*ratio);
		}catch(e){
			console.log("onload():"+e);
		}
	}
	
	//load photo into canvas
	photo.src = objPhoto;
}

function showResult(result){
	$('#response').show();
	$('#response').html(result).enhanceWithin();
	$('#loading').hide();
	$('#btnPhoto').hide();
	$('#homebtn').show();
	$('#choosesource').hide();
	$('#nameRequest').hide();
	$('#exitPopup').hide();
	$('#selectedFile').replaceWith($('#selectedFile').val('').clone(true));
}

function showHome(){
	$('#response').show();
	$('#response').html(main_text).enhanceWithin();
	$('#loading').hide();
	$('#btnPhoto').show();
	$('#homebtn').hide();
	$('#choosesource').hide();
	$('#nameRequest').hide();
	$('#exitPopup').hide();
	$('#selectedFile').replaceWith($('#selectedFile').val('').clone(true));
}

function loading(){	
	$('#response').hide();
	$('#loading').show();
	$('#btnPhoto').hide();
	$('#homebtn').hide();
	$('#choosesource').hide();
	$('#nameRequest').hide();
	$('#exitPopup').hide();
}

function close_window() {
	try{ 
		$('#exitPopup').hide();
		navigator.app.exitApp(); 
	}catch(e){
		open('', '_self').close(); 
	}
}