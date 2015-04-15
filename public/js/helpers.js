function selectChampion(imgUrl, name, subtitle) {
    document.getElementById("championImg").src				=imgUrl;
    document.getElementById("championName").innerHTML		=name;
    document.getElementById("championSubtitle").innerHTML	=subtitle;
}

function selectBetType(betType){
	if( betType == "champion" ){
		document.getElementById("championSelector").style.display 	= "inherit";
		document.getElementById("teamSelector").style.display 		= "none";
	}else{
		document.getElementById("teamSelector").style.display 		= "inherit";
		document.getElementById("championSelector").style.display 	= "none";
	}
}