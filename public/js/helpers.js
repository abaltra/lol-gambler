function selectChampion(imgUrl, name, subtitle) {
    document.getElementById("championImg").src				=imgUrl;
    document.getElementById("championName").innerHTML		=name;
    document.getElementById("championSubtitle").innerHTML	=subtitle;
}

function selectBetType(betType){
	if( betType == "champion" ){
		document.getElementById("championSelector").hidden 	= false;
		document.getElementById("teamSelector").hidden 		= true;
	}else{
		document.getElementById("teamSelector").hidden 		= false;
		document.getElementById("championSelector").hidden 	= true;
	}
}