var voitot=0;
var häviöt=0;
var tasapelit=0;
var pelit=0;
var tulos="";

function KPS(pelaaja) {
    tulos=päättäjä(pelaaja);
    pelit+=1;
            
    if (tulos==='win') {voitot+=1;}
    if (tulos==='defeat') {häviöt+=1;}
    if (tulos==='draw') {tasapelit+=1;}
    
    document.getElementById("tulos").src="img/"+tulos+'.png';
    
    document.getElementById("winBad").innerHTML=voitot;
    document.getElementById("drawBad").innerHTML=tasapelit;
    document.getElementById("lossBad").innerHTML=häviöt;
    document.getElementById("winBar").style="width: "+(voitot/pelit*100)+"%";
    document.getElementById("drawBar").style="width: "+(tasapelit/pelit*100)+"%";
    document.getElementById("lossBar").style="width: "+(häviöt/pelit*100)+"%";
}

function päättäjä(pelaaja) {
    var vaihtoehdot=['kivi','paperi','sakset'];
    var tietokone=vaihtoehdot[Math.floor(Math.random()*vaihtoehdot.length)];
    document.getElementById("pelaajankuva").src="img/"+pelaaja+'.jpg';
    document.getElementById("tietokoneenkuva").src="img/"+tietokone+'.jpg';
                
    if (pelaaja==='kivi') {
        if (tietokone==='kivi') {
            return 'draw';
        }
        else if (tietokone==='paperi') {
            return 'defeat';
        }
        else {
            return 'win';
        }
    }
    else if (pelaaja==='paperi') {
        if (tietokone==='kivi') {
            return 'win';
        }
        else if (tietokone==='paperi') {
            return 'draw';
        }
        else {
            return 'defeat';
        }
    }
    else {
        if (tietokone==='kivi') {
            return 'defeat';
        }
        else if (tietokone==='paperi') {
            return 'win';
        }
        else {
            return 'draw';
        }
    }    
}