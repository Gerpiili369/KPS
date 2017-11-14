function decider(p1, p2) {
    //var choices=['rock','paper','scissors'];
    //var computer=choices[Math.floor(Math.random()*choices.length)];

    if (p1==='rock') {
        if (p2==='rock') {
            return 'draw';
        }
        else if (p2==='paper') {
            return 'p2';
        }
        else {
            return 'p1';
        }
    }
    else if (p1==='paper') {
        if (p2==='rock') {
            return 'p1';
        }
        else if (p2==='paper') {
            return 'draw';
        }
        else {
            return 'p2';
        }
    }
    else {
        if (p2==='rock') {
            return 'p2';
        }
        else if (p2==='paper') {
            return 'p1';
        }
        else {
            return 'draw';
        }
    }
}
