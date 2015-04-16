currentBetType = '';
currentBetValue = '';
currentBetText = '';
userId = '';

function setupSlider(max_amount, user_id) {
    $('.slider').noUiSlider({
        start: Math.floor(max_amount / 2),
        connect: 'lower',
        orientation: 'horizontal',
        range: {
            'min': 0,
            'max': max_amount
        },
        step: 1,
        format: wNumb({
            decimals: 0
        })
    });
    $('#currentBet').text('Your current bet amount is ' + Math.floor(max_amount / 2) + ' rito coins.');
    $('.slider').on('slide', setBetAmount);
    userId = user_id;
}

function setBetAmount() {
    $('#currentBet').text(('Your current bet amount is ' + $('#betamount').val() + ' rito coins.'));    
}

function selectChampion(imgUrl, name, subtitle, id) {
    console.log('champ id ' + id)
    document.getElementById("championImg").src              =imgUrl;
    document.getElementById("championName").innerHTML       =name;
    document.getElementById("championSubtitle").innerHTML   =subtitle;

    $('#right_container').show();
    $('#mid_container').addClass('disabledbutton');
    currentBetText = 'You are currently betting on ' + name + ', ' + subtitle.charAt(0).toLowerCase() + subtitle.slice(1);
    currentBetValue = id;
    setBetLegend(currentBetText);
}

function setBetLegend(legend) {
    $('#betLegend').text(legend);
}

function selectTeam(teamId) {
    $('#right_container').show();
    $('#mid_container').addClass('disabledbutton');
    var teamName = (teamId === 200) ? 'Red' : 'Blue';
    currentBetText = 'You are currently betting on ' + teamName + ' team';
    currentBetValue = teamId;
    setBetLegend(currentBetText);
}

function selectBetType(betType, max_amount, user_id) {
    $('#mid_container').show();
    if( betType == "champ" ){
        document.getElementById("championSelector").style.display   = "inherit";
        document.getElementById("teamSelector").style.display       = "none";
    }else{
        document.getElementById("teamSelector").style.display       = "inherit";
        document.getElementById("championSelector").style.display   = "none";
    }
    currentBetType = betType;
    $('#left_container').addClass('disabledbutton');
    setupSlider(max_amount);
    userId = user_id;
}

function midBack() {
    $('#mid_container').hide();
    $('#left_container').removeClass('disabledbutton');
    currentBetType = '';
}

function rightBack() {
    $('#right_container').hide();
    $('#mid_container').removeClass('disabledbutton');
    currentBetValue = '';
}

function placeBet() {
    console.log('placing bet of type: ' + currentBetType + ' and value ' + currentBetValue)
    var dataPack = {
        type: currentBetType,
        value: currentBetValue,
        amount: $('#betamount').val(),
        userid: userId
    }
    console.log(dataPack)

    overlay( true );
    controlAfterBet( 0 );

    $.ajax({
        type: 'POST',
        url: '/bet',
        data: dataPack,
        success: function (data) {
            console.log('success!')
            console.log(data)
        },
        error: function (data){
            console.log('error!')
            console.log(data)
        }
    })
}

function overlay( isVisible ) {
    if( isVisible ){
        $("#overlay").show();
    }else{
        $("#overlay").hide();
    }
}

var funnyWaitingMessages = [
    "Killing Teemos...",
    "Clearing up noxians...",
    "Adding darkness to your bet...",
    "Searching more swords for Master Yi...",
    "Putting make up over Baron and Dragon...",
    "Watching Cait and Vi fight with Jinx in the fields of mud..."
]

function controlAfterBet( progress ){
    progressBar     = document.getElementById("nexusBar");
    progressNumber  = document.getElementById("nexusNumber");
    progressMessage = document.getElementById("nexusMessage");

    progressBar.style.width = progress+"%"; 
    progressNumber.innerHTML= progress+"%";   
    console.log("Progress at : "+progress);

    if(     progress == 0  
        ||  progress == 25 
        ||  progress == 50
        ||  progress == 75   
    ){
        progressMessage.innerHTML   = funnyWaitingMessages[Math.floor(Math.random()*funnyWaitingMessages.length)]; 
    }

    if( progress !=100 )
        setTimeout(controlAfterBet.bind(null, progress+1), 35);  
    else
        showWinLoseModal();
}

function showWinLoseModal(){
    $("#overlay2").show();
    $("#overlay").hide();
}
