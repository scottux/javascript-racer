(function () {

    var stages = [
        new Stage({lanes: 3}), // hills
        new Stage({
            lanes: 4,
            colors: {
                SKY: '#9cbeee',
                TREE: '#000000',
                FOG: '#e0efe5',
                LIGHT: {
                    road: '#383838',
                    grass: '#b0adaf',
                    rumble: '#5a5859',
                    lane: '#c0bb3f'
                },
                DARK: {
                    road: '#2d2d2d',
                    grass: '#bcb9bb',
                    rumble: '#7c797b'
                },
                START: {road: 'white', grass: 'white', rumble: 'white'},
                FINISH: {road: 'black', grass: 'black', rumble: 'black'}

            }
        }), // city
        new Stage({
            colors: {
                SKY: '#ee957b',
                TREE: '#ffda76',
                FOG: '#efe7d1',
                LIGHT: {
                    road: '#6B6B6B',
                    grass: '#cbc086',
                    rumble: '#a59155',
                    lane: '#CCCCCC'
                },
                DARK: {
                    road: '#696969',
                    grass: '#beb379',
                    rumble: '#9c8950'
                },
                START: {road: 'white', grass: 'white', rumble: 'white'},
                FINISH: {road: 'black', grass: 'black', rumble: 'black'}

            }
        }), // desert
        new Stage({
            lanes: 1,
            colors: {
                SKY: '#c7a6ff',
                TREE: '#ffffff',
                FOG: '#b8dfef',
                LIGHT: {
                    road: '#b3ab74',
                    grass: '#22a8cb',
                    rumble: '#6b696a',
                    lane: '#af9672'
                },
                DARK: {
                    road: '#aaa26c',
                    grass: '#1e93b2',
                    rumble: '#5a5859'
                },
                START: {road: 'white', grass: 'white', rumble: 'white'},
                FINISH: {road: 'black', grass: 'black', rumble: 'black'}

            }
        }) // ocean
    ];

    var fps = 60;                               // how many 'update' frames per second
    var step = 1 / fps;                         // how long is each frame (in seconds)
    var width = 1024;                           // logical canvas width
    var height = 768;                           // logical canvas height
    var centrifugal = 0.3;                      // centrifugal force multiplier when going around curves
    var skySpeed = 0.001;                       // background sky layer scroll speed when going around curve (or up hill)
    var hillSpeed = 0.002;                      // background hill layer scroll speed when going around curve (or up hill)
    var treeSpeed = 0.003;                      // background tree layer scroll speed when going around curve (or up hill)
    var skyOffset = 0;                          // current sky scroll offset
    var hillOffset = 0;                         // current hill scroll offset
    var treeOffset = 0;                         // current tree scroll offset
    var roadWidth = 2000;                    // actually half the roads width, easier math if the road spans from -roadWidth to +roadWidth

    var road = new Road({
        segmentLength: 200,
        rumbleLength: 3,
        maxCars: 200,
        step: step,
        roadWidth: roadWidth
    });
//        var stats = Game.stats('fps');       // mr.doobs FPS counter
    var canvas = Dom.get('canvas');       // our canvas...
    var ctx = canvas.getContext('2d'); // ...and its drawing context
    var background = null;                    // our background image (loaded below)
    var sprites = null;                    // our spritesheet (loaded below)
    var resolution = null;                    // scaling factor to provide resolution independence (computed)
    var fieldOfView = 100;                     // angle (degrees) for field of view
    var cameraHeight = 1000;                    // z height of camera
    var cameraDepth = null;                    // z distance camera is from screen (computed)
    var drawDistance = 300;                     // number of segments to draw
    var playerX = 0;                       // player x offset from center of road (-1 to 1 to stay independent of roadWidth)
    var fogDensity = 5;                       // exponential fog density
    var position = 0;                       // current camera Z position (add playerZ to get player's absolute Z position)
    var speed = 0;                       // current speed
    var accel = road.maxSpeed / 5;             // acceleration rate - tuned until it 'felt' right
    var breaking = -road.maxSpeed;               // deceleration rate when braking
    var decel = -road.maxSpeed / 5;             // 'natural' deceleration rate when neither accelerating, nor braking
    var offRoadDecel = -road.maxSpeed / 2;             // off road deceleration is somewhere in between
    var offRoadLimit = road.maxSpeed / 4;             // limit when off road deceleration no longer applies (e.g. you can always go at least this speed even when off road)
    var currentLapTime = 0;                       // current lap time
    var lastLapTime = null;                    // last lap time

    var keyLeft = false;
    var keyRight = false;
    var keyFaster = false;
    var keySlower = false;

    var hud = {
        speed: {value: null, dom: Dom.get('speed_value')},
        current_lap_time: {value: null, dom: Dom.get('current_lap_time_value')},
        last_lap_time: {value: null, dom: Dom.get('last_lap_time_value')},
        fast_lap_time: {value: null, dom: Dom.get('fast_lap_time_value')}
    };


    //=========================================================================
    // THE GAME LOOP
    //=========================================================================

    Game.run({
        canvas: canvas,
        render: render,
        update: update,
        /*stats: stats,*/
        step: step,
        images: ["background", "sprites"],
        keys: [
            {
                keys: [KEY.LEFT, KEY.A], mode: 'down', action: function () {
                keyLeft = true;
            }
            },
            {
                keys: [KEY.RIGHT, KEY.D], mode: 'down', action: function () {
                keyRight = true;
            }
            },
            {
                keys: [KEY.UP, KEY.W], mode: 'down', action: function () {
                keyFaster = true;
            }
            },
            {
                keys: [KEY.DOWN, KEY.S], mode: 'down', action: function () {
                keySlower = true;
            }
            },
            {
                keys: [KEY.LEFT, KEY.A], mode: 'up', action: function () {
                keyLeft = false;
            }
            },
            {
                keys: [KEY.RIGHT, KEY.D], mode: 'up', action: function () {
                keyRight = false;
            }
            },
            {
                keys: [KEY.UP, KEY.W], mode: 'up', action: function () {
                keyFaster = false;
            }
            },
            {
                keys: [KEY.DOWN, KEY.S], mode: 'up', action: function () {
                keySlower = false;
            }
            }
        ],
        ready: function (images) {
            Game.currentStage = Util.randomChoice(stages);
            background = images[0];
            sprites = images[1];
            reset();
            Dom.storage.fast_lap_time = Dom.storage.fast_lap_time || 180;
            updateHud('fast_lap_time', formatTime(Util.toFloat(Dom.storage.fast_lap_time)));
        }
    });

    //=========================================================================
    // TWEAK UI HANDLERS
    //=========================================================================

    Dom.on('resolution', 'change', function (ev) {
        var w;
        var h;
        var ratio;

        switch (ev.target.options[ev.target.selectedIndex].value) {
            case 'fine':
                w = 1280;
                h = 960;
                ratio = w / width;
                break;
            case 'high':
                w = 1024;
                h = 768;
                ratio = w / width;
                break;
            case 'medium':
                w = 640;
                h = 480;
                ratio = w / width;
                break;
            case 'low':
                w = 480;
                h = 360;
                ratio = w / width;
                break;
        }
        reset({width: w, height: h});
        Dom.blur(ev);
    });

    Dom.on('lanes', 'change', function (ev) {
        Dom.blur(ev);
        reset({lanes: ev.target.options[ev.target.selectedIndex].value});
    });
    Dom.on('roadWidth', 'change', resetValue);
    Dom.on('cameraHeight', 'change', resetValue);
    Dom.on('drawDistance', 'change', resetValue);
    Dom.on('fieldOfView', 'change', resetValue);
    Dom.on('fogDensity', 'change', resetValue);

    //=========================================================================
    // UPDATE THE GAME WORLD
    //=========================================================================

    function update(dt) {
        var n;
        var car;
        var carW;
        var sprite;
        var spriteW;
        var playerSegment = road.segments.find(position + road.playerZ);
        var playerW = SPRITES.PLAYER_STRAIGHT.w * SPRITES.SCALE;
        var speedPercent = speed / road.maxSpeed;
        var dx = dt * 2 * speedPercent; // at top speed, should be able to cross from left to right (-1 to 1) in 1 second
        var startPosition = position;

        updateCars(dt, playerSegment, playerW);

        position = Util.increase(position, dt * speed, road.totalLength);
        if (keyLeft) {
            playerX = playerX - dx;
        } else if (keyRight) {
            playerX = playerX + dx;
        }
        playerX = playerX - (dx * speedPercent * playerSegment.curve * centrifugal);

        if (keyFaster) {
            speed = Util.accelerate(speed, accel, dt);
        } else if (keySlower) {
            speed = Util.accelerate(speed, breaking, dt);
        } else {
            speed = Util.accelerate(speed, decel, dt);
        }

        if ((playerX < -1) || (playerX > 1)) {
            if (speed > offRoadLimit) {
                speed = Util.accelerate(speed, offRoadDecel, dt);
            }
            for (n = 0; n < playerSegment.sprites.length; n++) {
                sprite = playerSegment.sprites[n];
                spriteW = sprite.source.w * SPRITES.SCALE;
                if (Util.overlap(playerX, playerW, sprite.offset + spriteW / 2 * (sprite.offset > 0 ? 1 : -1), spriteW)) {
                    speed = road.maxSpeed / 5;
                    position = Util.increase(playerSegment.p1.world.z, -road.playerZ, road.totalLength); // stop in front of sprite (at front of segment)
                    break;
                }
            }
        }

        for (n = 0; n < playerSegment.cars.length; n++) {
            car = playerSegment.cars[n];
            carW = car.sprite.w * SPRITES.SCALE;
            if (speed > car.speed) {
                if (Util.overlap(playerX, playerW, car.offset, carW, 0.8)) {
                    speed = car.speed * (car.speed / speed);
                    position = Util.increase(car.z, -road.playerZ, road.totalLength);
                    break;
                }
            }
        }

        playerX = Util.limit(playerX, -3, 3);     // dont ever let it go too far out of bounds
        speed = Util.limit(speed, 0, road.maxSpeed); // or exceed maxSpeed

        skyOffset = Util.increase(skyOffset, skySpeed * playerSegment.curve * (position - startPosition) / road.segments.SEGMENT_LENGTH, 1);
        hillOffset = Util.increase(hillOffset, hillSpeed * playerSegment.curve * (position - startPosition) / road.segments.SEGMENT_LENGTH, 1);
        treeOffset = Util.increase(treeOffset, treeSpeed * playerSegment.curve * (position - startPosition) / road.segments.SEGMENT_LENGTH, 1);

        if (position > road.playerZ) {
            if (currentLapTime && (startPosition < road.playerZ)) {
                lastLapTime = currentLapTime;
                currentLapTime = 0;
                if (lastLapTime <= Util.toFloat(Dom.storage.fast_lap_time)) {
                    Dom.storage.fast_lap_time = lastLapTime;
                    updateHud('fast_lap_time', formatTime(lastLapTime));
                    Dom.addClassName('fast_lap_time', 'fastest');
                    Dom.addClassName('last_lap_time', 'fastest');
                } else {
                    Dom.removeClassName('fast_lap_time', 'fastest');
                    Dom.removeClassName('last_lap_time', 'fastest');
                }
                updateHud('last_lap_time', formatTime(lastLapTime));
                Dom.show('last_lap_time');
            } else {
                currentLapTime += dt;
            }
        }

        updateHud('speed', 5 * Math.round(speed / 500));
        updateHud('current_lap_time', formatTime(currentLapTime));
    }

    //-------------------------------------------------------------------------

    function updateCars(dt, playerSegment, playerW) {
        var n;
        var car;
        var oldSegment;
        var newSegment;
        var index;

        for (n = 0; n < road.cars.length; n++) {
            car = road.cars[n];
            oldSegment = road.segments.find(car.z);
            car.offset = car.offset + updateCarOffset(car, oldSegment, playerSegment, playerW);
            car.z = Util.increase(car.z, dt * car.speed, road.totalLength);
            car.percent = Util.percentRemaining(car.z, road.segments.SEGMENT_LENGTH); // useful for interpolation during rendering phase
            newSegment = road.segments.find(car.z);
            if (oldSegment !== newSegment) {
                index = oldSegment.cars.indexOf(car);
                oldSegment.cars.splice(index, 1);
                newSegment.cars.push(car);
            }
        }
    }

    function updateCarOffset(car, carSegment, playerSegment, playerW) {
        var i;
        var j;
        var dir;
        var segment;
        var otherCar;
        var otherCarW;
        var lookahead = 20;
        var carW = car.sprite.w * SPRITES.SCALE;

        // optimization, dont bother steering around other cars when 'out of sight' of the player
        if ((carSegment.index - playerSegment.index) > drawDistance) {

            return 0;
        }
        for (i = 1; i < lookahead; i++) {
            segment = road.segments[(carSegment.index + i) % road.segments.length];

            if ((segment === playerSegment) && (car.speed > speed) && (Util.overlap(playerX, playerW, car.offset, carW, 1.2))) {
                dir = getDirection(playerX);

                return dir * 1 / i * (car.speed - speed) / road.maxSpeed; // the closer the cars (smaller i) and the greated the speed ratio, the larger the offset
            }

            for (j = 0; j < segment.cars.length; j++) {
                otherCar = segment.cars[j];
                otherCarW = otherCar.sprite.w * SPRITES.SCALE;
                if ((car.speed > otherCar.speed) && Util.overlap(car.offset, carW, otherCar.offset, otherCarW, 1.2)) {
                    dir = getDirection(otherCar.offset);

                    return dir * 1 / i * (car.speed - otherCar.speed) / road.maxSpeed;
                }
            }
        }

        // if no cars ahead, but I have somehow ended up off road, then steer back on
        if (car.offset < -0.9) {
            return 0.1;
        } else if (car.offset > 0.9) {
            return -0.1;
        } else {
            return 0;
        }

        function getDirection(offset) {
            if (offset > 0.5) {
                return -1;
            } else if (offset < -0.5) {
                return 1;
            }

            return (car.offset > offset) ? 1 : -1;
        }
    }

    //-------------------------------------------------------------------------

    function updateHud(key, value) { // accessing DOM can be slow, so only do it if value has changed
        if (hud[key].value !== value) {
            hud[key].value = value;
            Dom.set(hud[key].dom, value);
        }
    }

    function formatTime(dt) {
        var minutes = Math.floor(dt / 60);
        var seconds = Math.floor(dt - (minutes * 60));
        var tenths = Math.floor(10 * (dt - Math.floor(dt)));
        var secondsTenths = (seconds < 10 ? "0" : "") + seconds + "." + tenths;

        if (minutes > 0) {
            return minutes + "." + secondsTenths;
        }

        return secondsTenths;
    }

    //=========================================================================
    // RENDER THE GAME WORLD
    //=========================================================================

    function render() {
        var baseSegment = road.segments.find(position);
        var basePercent = Util.percentRemaining(position, road.segments.SEGMENT_LENGTH);
        var playerSegment = road.segments.find(position + road.playerZ);
        var playerPercent = Util.percentRemaining(position + road.playerZ, road.segments.SEGMENT_LENGTH);
        var playerY = Util.interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
        var maxy = height;
        var n;
        var i;
        var segment;
        var car;
        var sprite;
        var spriteScale;
        var spriteX;
        var spriteY;
        var x = 0;
        var dx = -(baseSegment.curve * basePercent);

        ctx.clearRect(0, 0, width, height);

        Render.background(ctx, background, width, height, Game.currentStage.bg.SKY, skyOffset, resolution * skySpeed * playerY);
        Render.background(ctx, background, width, height, Game.currentStage.bg.HILLS, hillOffset, resolution * hillSpeed * playerY);
        Render.background(ctx, background, width, height, Game.currentStage.bg.TREES, treeOffset, resolution * treeSpeed * playerY);

        for (n = 0; n < drawDistance; n++) {
            segment = road.segments[(baseSegment.index + n) % road.segments.length];
            segment.looped = segment.index < baseSegment.index;
            segment.fog = Util.exponentialFog(n / drawDistance, fogDensity);
            segment.clip = maxy;

            Util.project(segment.p1, (playerX * roadWidth) - x, playerY + cameraHeight, position - (segment.looped ? road.totalLength : 0), cameraDepth, width, height, roadWidth);
            Util.project(segment.p2, (playerX * roadWidth) - x - dx, playerY + cameraHeight, position - (segment.looped ? road.totalLength : 0), cameraDepth, width, height, roadWidth);

            x = x + dx;
            dx = dx + segment.curve;

            if ((segment.p1.camera.z <= cameraDepth) || // behind us
                (segment.p2.screen.y >= segment.p1.screen.y) || // back face cull
                (segment.p2.screen.y >= maxy))                  // clip by (already rendered) hill
            { continue; }

            Render.segment(ctx, width, Game.currentStage.lanes,
                segment.p1.screen.x,
                segment.p1.screen.y,
                segment.p1.screen.w,
                segment.p2.screen.x,
                segment.p2.screen.y,
                segment.p2.screen.w,
                segment.fog,
                segment.color);

            maxy = segment.p1.screen.y;
        }

        for (n = (drawDistance - 1); n > 0; n--) {
            segment = road.segments[(baseSegment.index + n) % road.segments.length];

            for (i = 0; i < segment.cars.length; i++) {
                car = segment.cars[i];
                sprite = car.sprite;
                spriteScale = Util.interpolate(segment.p1.screen.scale, segment.p2.screen.scale, car.percent);
                spriteX = Util.interpolate(segment.p1.screen.x, segment.p2.screen.x, car.percent) + (spriteScale * car.offset * roadWidth * width / 2);
                spriteY = Util.interpolate(segment.p1.screen.y, segment.p2.screen.y, car.percent);
                Render.sprite(ctx, width, height, resolution, roadWidth, sprites, car.sprite, spriteScale, spriteX, spriteY, -0.5, -1, segment.clip);
            }

            for (i = 0; i < segment.sprites.length; i++) {
                sprite = segment.sprites[i];
                spriteScale = segment.p1.screen.scale;
                spriteX = segment.p1.screen.x + (spriteScale * sprite.offset * roadWidth * width / 2);
                spriteY = segment.p1.screen.y;
                Render.sprite(ctx, width, height, resolution, roadWidth, sprites, sprite.source, spriteScale, spriteX, spriteY, (sprite.offset < 0 ? -1 : 0), -1, segment.clip);
            }

            if (segment === playerSegment) {
                Render.player(ctx, width, height, resolution, roadWidth, sprites, speed / road.maxSpeed,
                    cameraDepth / road.playerZ,
                    width / 2,
                    (height / 2) - (cameraDepth / road.playerZ * Util.interpolate(playerSegment.p1.camera.y, playerSegment.p2.camera.y, playerPercent) * height / 2),
                    speed * (keyLeft ? -1 : keyRight ? 1 : 0),
                    playerSegment.p2.world.y - playerSegment.p1.world.y);
            }
        }
    }

    //=========================================================================
    // BUILD ROAD GEOMETRY
    //=========================================================================

    function reset(options) {
        options = options || {};
        canvas.width = width = Util.toInt(options.width, width);
        canvas.height = height = Util.toInt(options.height, height);
//            lanes = Util.toInt(options.lanes, Game.currentStage.lanes);
        roadWidth = Util.toInt(options.roadWidth, roadWidth);
        cameraHeight = Util.toInt(options.cameraHeight, cameraHeight);
        drawDistance = Util.toInt(options.drawDistance, drawDistance);
        fogDensity = Util.toInt(options.fogDensity, fogDensity);
        fieldOfView = Util.toInt(options.fieldOfView, fieldOfView);
        road.segments.SEGMENT_LENGTH = Util.toInt(options.segmentLength, road.segments.SEGMENT_LENGTH);
        road.segments.RUMBLE_LENGTH = Util.toInt(options.rumbleLength, road.segments.RUMBLE_LENGTH);
        cameraDepth = 1 / Math.tan((fieldOfView / 2) * Math.PI / 180);
        road.playerZ = (cameraHeight * cameraDepth);
        resolution = height / 480;
//            refreshTweakUI();

        if (!road.segments.length || options.segmentLength || options.rumbleLength) {
            road.reset(); // only rebuild road when necessary
        }
    }

    function resetValue(ev) {
        var obj = {};

        obj[ev.srcElement.id] = Util.limit(Util.toInt(ev.target.value), Util.toInt(ev.target.getAttribute('min')), Util.toInt(ev.target.getAttribute('max')));
        reset(obj);
    }

//        function refreshTweakUI() {
//            Dom.get('lanes').selectedIndex = lanes - 1;
//            Dom.get('currentRoadWidth').innerHTML = Dom.get('roadWidth').value = roadWidth;
//            Dom.get('currentCameraHeight').innerHTML = Dom.get('cameraHeight').value = cameraHeight;
//            Dom.get('currentDrawDistance').innerHTML = Dom.get('drawDistance').value = drawDistance;
//            Dom.get('currentFieldOfView').innerHTML = Dom.get('fieldOfView').value = fieldOfView;
//            Dom.get('currentFogDensity').innerHTML = Dom.get('fogDensity').value = fogDensity;
//        }

}());
