function selectChampion(imgUrl, name, subtitle) {
    document.getElementById("championImg").src				=imgUrl;
    document.getElementById("championName").innerHTML		=name;
    document.getElementById("championSubtitle").innerHTML	=subtitle;
}

function selectBetType(betType){
	if( betType == "champion" ){
		document.getElementById("championSelector").style.visibility 	= false;
		document.getElementById("teamSelector").style.visibility 		= true;
	}else{
		document.getElementById("teamSelector").style.visibility 		= false;
		document.getElementById("championSelector").style.visibility 	= true;
	}
}