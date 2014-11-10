/*
    As cursor moves, it releases the words for the current picture, also
    fading it in. When all the picture's words have been released, the next
    picture loads.
    Requires jQuery.
*/

var movement = 0, // pixels
    wordEvery = 150, // pixels
    windMin = 40,
    windMax = 120,
    wordAnimX, wordAnimY, // e.g. "+=33px"
    
    lastCoords,
    inTransition = true,
    $body, $fader,
    
    pictureIndex,
    thoughtIndex,
    words,
    wordsInThisThought,
    
    // pixels
    minFontSize = 20,
    maxFontSize = 60;

function transition()
{
    inTransition = true; // pause the mousemove magic and the repeater
    if (
        (typeof thoughtIndex == "undefined") ||
        (typeof pictureIndex == "undefined"))
    {
        // init
        randomSort(thoughts);
        randomSort(pictures);
        thoughtIndex = pictureIndex = 0;
    } else {
        thoughtIndex++;
        pictureIndex++;
        if (thoughtIndex >= thoughts.length) {
            thoughtIndex = 0;
            randomSort(thoughts);
        }
        if (pictureIndex >= pictures.length) {
            pictureIndex = 0;
            randomSort(pictures);
        }
    }
    // determine random wind for the words in this thought
    var windAmt = {
        x: windMin + Math.round(Math.random() * (windMax - windMin)),
        y: windMin + Math.round(Math.random() * (windMax - windMin))
    };
    wordAnimX = (Math.round(Math.random()) ? "+" : "-") + "=" + windAmt.x + "px";
    wordAnimY = (Math.round(Math.random()) ? "+" : "-") + "=" + windAmt.y + "px";
    // (re-)init movement tracker
    movement = 0;
    // prepare words
    words = thoughts[thoughtIndex].split(" ");
    wordsInThisThought = words.length;
    // start preloading the image, continue when finished
    var loader = new Image();
    loader.onload = function() {
        // fade out current image
        $fader.stop(true).animate({opacity: 1}, 3000, "swing", function() {
                $body.css("background-image", "url("+pictures[pictureIndex]+")");
                inTransition = false; // resume mousemove magic/repeater
        });
    }
    loader.src = pictures[pictureIndex];
}

function randomSort(arr)
{
    arr.sort(function(a, b) {
        return Math.round(-1 + (Math.random() * 2));
    });
}

function bodyMouseMove(e)
{
    if (!inTransition && lastCoords) {
        // get the length of the "hypotenuse" of the movement
        var thisMove = Math.sqrt(
            Math.pow(Math.abs(lastCoords[0] - e.pageX), 2) +
            Math.pow(Math.abs(lastCoords[1] - e.pageY), 2));
        movement += thisMove;
        if (movement >= wordEvery) {
            movement = 0;
            if (words.length > 0) {
                // release a word
                var fontSize = minFontSize + Math.round(Math.random() * (maxFontSize - minFontSize));
                var newWord = words.shift();
                var $wordDiv = $("<div class='word'></div>").append(newWord).css({
                        display: "none",
                        fontSize: fontSize + "px"
                });
                $body.append($wordDiv);
                // have to insert the div before assigning left/top because
                // otherwise width()/height() won't work.
                $wordDiv.css({
                        left: (e.pageX - Math.round($wordDiv.width() / 2)) + "px",
                        top: (e.pageY - Math.round($wordDiv.height() / 2)) + "px"
                });
                $wordDiv.css("display", "block").animate(
                    {
                        opacity: 0,
                        left: wordAnimX,
                        top: wordAnimY
                    },
                    4000,
                    "linear",
                    function() {
                        $(this).remove();
                        if (
                            (words.length == 0) &&
                            ($(".word").length == 0))
                        {
                            // if that was the last word that just disappeared,
                            // move onto the next thought.
                            transition();
                        }
                    });
            }
        }
    }
    lastCoords = [e.pageX, e.pageY];
}

function repeater()
{
    if (!inTransition) {
        // determine new fade level
        var wordsReleased = wordsInThisThought - words.length;
        // total movement so far divided by total movement required to advance
        var progressFactor = ((wordsReleased * wordEvery) + movement) / (wordsInThisThought * wordEvery);
        $fader.css("opacity", 1 - progressFactor);
    }
}

$(function() {
        // init
        $body = $(document.body);
        $fader = $("#fader").eq(0);
        transition();
        $body.mousemove(bodyMouseMove);
        setInterval(repeater, 50);
});
