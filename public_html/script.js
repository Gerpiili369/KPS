var voitot=0;
var häviöt=0;
var tasapelit=0;

function KPS(pelaaja) {
    document.getElementById("tulos").innerHTML=päättäjä(pelaaja);
            
    if (document.getElementById("tulos").innerHTML==='VOITTO') {voitot+=1;}
    if (document.getElementById("tulos").innerHTML==='HÄVIÖ') {häviöt+=1;}
    if (document.getElementById("tulos").innerHTML==='TASAPELI') {tasapelit+=1;}
    
    document.getElementById("kirjanpito").innerHTML="Voitot: "+voitot+" Häviöt: "+häviöt+" Tasapelit: "+tasapelit;
}

function päättäjä(pelaaja) {
    var vaihtoehdot=['kivi','paperi','sakset'];
    var tietokone=vaihtoehdot[Math.floor(Math.random()*vaihtoehdot.length)];
    document.getElementById("tietokone").innerHTML=tietokone;
    document.getElementById("pelaajankuva").src=pelaaja+'.jpg';
    document.getElementById("tietokoneenkuva").src=tietokone+'.jpg';
                
    if (pelaaja==='kivi') {
        if (tietokone==='kivi') {
            return 'TASAPELI';
        }
        else if (tietokone==='paperi') {
            return 'HÄVIÖ';
        }
        else {
            return 'VOITTO';
        }
    }
    else if (pelaaja==='paperi') {
        if (tietokone==='kivi') {
            return 'VOITTO';
        }
        else if (tietokone==='paperi') {
            return 'TASAPELI';
        }
        else {
            return 'HÄVIÖ';
        }
    }
    else {
        if (tietokone==='kivi') {
            return 'HÄVIÖ';
        }
        else if (tietokone==='paperi') {
            return 'VOITTO';
        }
        else {
            return 'TASAPELI';
        }
    }    
}