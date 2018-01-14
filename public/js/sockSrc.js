document.addEventListener('DOMContentLoaded', () => {
    let sockData = {url: '', options: {path:'/socket.io'}};

    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                sockData = JSON.parse(this.responseText);
            }

            document.getElementById("sockpath").src = `${sockData.options.path}/socket.io.js`;

            (function isSockReady() {
                if (typeof io != 'undefined') {
                    initialize(sockData);
                } else {
                    setTimeout(isSockReady, 108);
                }
            }) ();
        }
    }
    xhttp.open('GET', 'sockSrc.json', true);
    xhttp.send();
});
