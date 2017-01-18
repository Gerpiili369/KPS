var wins=0;
var losses=0;
var draws=0;
var games=0;
var result="";

function KPS(player) {
    result=decider(player);
    games+=1;
            
    if (result==='win') {wins+=1;}
    if (result==='defeat') {losses+=1;}
    if (result==='draw') {draws+=1;}
    
    document.getElementById("result").src="img/"+result+'.png';
    document.getElementById("result").title=result;
    
    document.getElementById("winBad").innerHTML=wins;
    document.getElementById("drawBad").innerHTML=draws;
    document.getElementById("lossBad").innerHTML=losses;
    document.getElementById("winBar").style="width: "+(wins/games*100)+"%";
    document.getElementById("drawBar").style="width: "+(draws/games*100)+"%";
    document.getElementById("lossBar").style="width: "+(losses/games*100)+"%";
}

function decider(player) {
    var choices=['rock','paper','scissors'];
    var computer=choices[Math.floor(Math.random()*choices.length)];
    document.getElementById("playerpicture").src="img/"+player+'.jpg';
    document.getElementById("playerpicture").title=player;
    document.getElementById("computerpicture").src="img/"+computer+'.jpg';
    document.getElementById("computerpicture").title=computer;
    
    document.getElementById("hideatstart1").hidden=false;
    document.getElementById("hideatstart2").hidden=false;
                
    if (player==='rock') {
        if (computer==='rock') {
            return 'draw';
        }
        else if (computer==='paper') {
            return 'defeat';
        }
        else {
            return 'win';
        }
    }
    else if (player==='paper') {
        if (computer==='rock') {
            return 'win';
        }
        else if (computer==='paper') {
            return 'draw';
        }
        else {
            return 'defeat';
        }
    }
    else {
        if (computer==='rock') {
            return 'defeat';
        }
        else if (computer==='paper') {
            return 'win';
        }
        else {
            return 'draw';
        }
    }    
}