/**
 * GAME LOOP helpers
 * @type {{currentStage: Stage, run: Game.run, loadImages: Game.loadImages, setKeyListener: Game.setKeyListener, playMusic: Game.playMusic}}
 */
var Game = {  // a modified version of the game loop from my previous boulderdash game - see http://codeincomplete.com/posts/2011/10/25/javascript_boulderdash/#gameloop
    /**
     * @type {Stage}
     */
    currentStage: new Stage(),
    /**
     *
     * @param options
     */
    run: function (options) {
        Game.loadImages(options.images, function (images) {
            var canvas = options.canvas; // canvas render target is provided by caller
            var update = options.update; // method to update game logic is provided by caller
            var render = options.render; // method to render the game is provided by caller
            var step = options.step; // fixed frame step (1/fps) is specified by caller
            //var stats = options.stats; // stats instance is provided by caller
            var last = Util.timestamp();
            var dt = 0;
            var gdt = 0;

            options.ready(images); // tell caller to initialize itself because images are loaded and we're ready to rumble
            Game.setKeyListener(options.keys);
            frame(); // lets get this party started
            Game.playMusic();

            function frame() {
                var now = Util.timestamp();

                dt = Math.min(1, (now - last) / 1000); // using requestAnimationFrame have to be able to handle large delta's caused when it 'hibernates' in a background or non-visible tab
                gdt = gdt + dt;
                while (gdt > step) {
                    gdt = gdt - step;
                    update(step);
                }
                render();
                //stats.update();
                last = now;
                requestAnimationFrame(frame, canvas);
            }
        });
    },
    /**
     *
     * @param names
     * @param callback
     */
    loadImages: function (names, callback) { // load multiple images and callback when ALL images have loaded
        var name;
        var n;
        var result = [];
        var count = names.length;

        for (n = 0; n < count; n++) {
            name = names[n];
            result[n] = document.createElement('img');
            Dom.on(result[n], 'load', onload);
            result[n].src = "images/" + name + ".png";
        }

        function onload() {
            if (--count === 0) {
                callback(result);
            }
        }
    },
    /**
     *
     * @param keys
     */
    setKeyListener: function (keys) {
        Dom.on(document, 'keydown', function (ev) {
            onkey(ev.keyCode, 'down');
        });
        Dom.on(document, 'keyup', function (ev) {
            onkey(ev.keyCode, 'up');
        });

        function onkey(keyCode, mode) {
            var n;
            var k;

            for (n = 0; n < keys.length; n++) {
                k = keys[n];
                k.mode = k.mode || 'up';
                if ((k.key === keyCode) || (k.keys && (k.keys.indexOf(keyCode) >= 0))) {
                    if (k.mode === mode) {
                        k.action.call();
                    }
                }
            }
        }
    },

    //---------------------------------------------------------------------------

    // stats: function(parentId, id) { // construct mr.doobs FPS counter - along with friendly good/bad/ok message box
    //
    //   var result = new Stats();
    //   result.domElement.id = id || 'stats';
    //   Dom.get(parentId).appendChild(result.domElement);
    //
    //   var msg = document.createElement('div');
    //   msg.style.cssText = "border: 2px solid gray; padding: 5px; margin-top: 5px; text-align: left; font-size: 1.15em; text-align: right;";
    //   msg.innerHTML = "Your canvas performance is ";
    //   Dom.get(parentId).appendChild(msg);
    //
    //   var value = document.createElement('span');
    //   value.innerHTML = "...";
    //   msg.appendChild(value);
    //
    //   setInterval(function() {
    //     var fps   = result.current();
    //     var ok    = (fps > 50) ? 'good'  : (fps < 30) ? 'bad' : 'ok';
    //     var color = (fps > 50) ? 'green' : (fps < 30) ? 'red' : 'gray';
    //     value.innerHTML       = ok;
    //     value.style.color     = color;
    //     msg.style.borderColor = color;
    //   }, 5000);
    //   return result;
    // },

    //---------------------------------------------------------------------------

    /**
     *
     */
    playMusic: function () {
        var music = Dom.get('music');

        music.loop = true;
        music.volume = 0.05; // shhhh! annoying music!
        music.muted = (Dom.storage.muted === "true");
        music.play();
        Dom.toggleClassName('mute', 'on', music.muted);
        Dom.on('mute', 'click', function () {
            Dom.storage.muted = music.muted = !music.muted;
            Dom.toggleClassName('mute', 'on', music.muted);
        });
    }
};
