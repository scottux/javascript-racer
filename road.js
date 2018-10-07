/**
 * A Road for the racer to drive on.
 * @param options
 * @constructor
 */
function Road(options) {
    this.MAX_CARS = options.maxCars || 200;
    this.segments = new SegmentCollection(options);
    this.totalLength = null;
    this.cars = [];
    this.playerZ = null; // player relative z distance from camera (computed)
    this.setMaxSpeed(options.step);
    this.width = options.roadWidth || 2000;
}
/**
 * Set the mspeed limit.
 * @param step
 */
Road.prototype.setMaxSpeed = function (step) {
    step = step || 1/60;
    this.maxSpeed = this.segments.SEGMENT_LENGTH / step;
};
/**
 * Add a roadside sprite
 * @param n
 * @param sprite
 * @param offset
 * @returns {Road}
 */
Road.prototype.addSprite = function (n, sprite, offset) {
    this.segments[n].sprites.push({source: sprite, offset: offset});

    return this;
};
/**
 * Resets the roadside sprites.
 */
Road.prototype.resetSprites = function resetSprites() {
    var n;
    var i;
    var side;
    var sprite;
    var offset;
    var finishLine = this.segments.length - 25;

    // Billboard routine
    this.addSprite(20, SPRITES.BILLBOARD07, -1)
        .addSprite(40, SPRITES.BILLBOARD06, -1)
        .addSprite(60, SPRITES.BILLBOARD08, -1)
        .addSprite(80, SPRITES.BILLBOARD09, -1)
        .addSprite(100, SPRITES.BILLBOARD01, -1)
        .addSprite(120, SPRITES.BILLBOARD02, -1)
        .addSprite(140, SPRITES.BILLBOARD03, -1)
        .addSprite(160, SPRITES.BILLBOARD04, -1)
        .addSprite(180, SPRITES.BILLBOARD05, -1)
        .addSprite(240, SPRITES.BILLBOARD07, -1.2)
        .addSprite(240, SPRITES.BILLBOARD06, 1.2)
        .addSprite(finishLine, SPRITES.BILLBOARD07, -1.2)
        .addSprite(finishLine, SPRITES.BILLBOARD06, 1.2);

    // Palm Tree routine
    for (n = 10; n < 200; n += 4 + Math.floor(n / 100)) {
        this.addSprite(n, SPRITES.PALM_TREE, 0.5 + Math.random() * 0.5)
            .addSprite(n, SPRITES.PALM_TREE, 1 + Math.random() * 2);
    }

    // Columns routine
    for (n = 250; n < 1000; n += 5) {
        this.addSprite(n, SPRITES.COLUMN, 1.1)
            .addSprite(n + Util.randomInt(0, 5), SPRITES.TREE1, -1 - (Math.random() * 2))
            .addSprite(n + Util.randomInt(0, 5), SPRITES.TREE2, -1 - (Math.random() * 2));
    }

    // Plant routine
    for (n = 200; n < this.segments.length; n += 3) {
        this.addSprite(n, Util.randomChoice(SPRITES.PLANTS), Util.randomChoice([1, -1]) * (2 + Math.random() * 5));
    }

    // Random plants and billboards routine
    for (n = 1000; n < (this.segments.length - 50); n += 100) {
        side = Util.randomChoice([1, -1]);
        this.addSprite(n + Util.randomInt(0, 50), Util.randomChoice(SPRITES.BILLBOARDS), -side);
        for (i = 0; i < 20; i++) {
            sprite = Util.randomChoice(SPRITES.PLANTS);
            offset = side * (1.5 + Math.random());
            this.addSprite(n + Util.randomInt(0, 50), sprite, offset);
        }
    }
};
/**
 * Traffic
 */
Road.prototype.resetCars = function () {
    var n;
    var car;
    var segment;
    var offset;
    var z;
    var sprite;
    var speed;

    this.cars = [];
    for (n = 0; n < this.MAX_CARS; n++) {
        offset = Math.random() * Util.randomChoice([-0.8, 0.8]);
        z = Math.floor(Math.random() * this.segments.length) * this.segments.SEGMENT_LENGTH;
        sprite = Util.randomChoice(SPRITES.CARS);
        speed = this.maxSpeed / 4 + Math.random() * this.maxSpeed / (sprite === SPRITES.SEMI ? 4 : 2);
        car = {offset: offset, z: z, sprite: sprite, speed: speed};
        segment = this.segments.find(car.z);
        segment.cars.push(car);
        this.cars.push(car);
    }
};
/**
 * Add a road segment
 * @param enter
 * @param hold
 * @param leave
 * @param curve
 * @param y
 * @returns {Road}
 */
Road.prototype.add = function (enter, hold, leave, curve, y) {
    var startY = this.segments.lastY();
    var endY = startY + (Util.toInt(y, 0) * this.segments.SEGMENT_LENGTH);
    var n;
    var total = enter + hold + leave;

    for (n = 0; n < enter; n++) {
        this.segments.add(Util.easeIn(0, curve, n / enter), Util.easeInOut(startY, endY, n / total));
    }
    for (n = 0; n < hold; n++) {
        this.segments.add(curve, Util.easeInOut(startY, endY, (enter + n) / total));
    }
    for (n = 0; n < leave; n++) {
        this.segments.add(Util.easeInOut(curve, 0, n / leave), Util.easeInOut(startY, endY, (enter + hold + n) / total));
    }

    return this;
};
/**
 * Add a straight segment.
 * @param num
 * @returns {Road}
 */
Road.prototype.addStraight = function (num) {
    num = num || ROAD.LENGTH.MEDIUM;
    return this.add(num, num, num, 0, 0);
};
/**
 * Add a hill segment.
 * @param num
 * @param height
 * @returns {Road}
 */
Road.prototype.addHill = function (num, height) {
    num = num || ROAD.LENGTH.MEDIUM;
    height = height || ROAD.HILL.MEDIUM;
    return this.add(num, num, num, 0, height);
};
/**
 * Add a curve segment.
 * @param num
 * @param curve
 * @param height
 * @returns {Road}
 */
Road.prototype.addCurve = function (num, curve, height) {
    num = num || ROAD.LENGTH.MEDIUM;
    curve = curve || ROAD.CURVE.MEDIUM;
    height = height || ROAD.HILL.NONE;
    return this.add(num, num, num, curve, height);
};
/**
 * Add a low rolling hills segment.
 * @param num
 * @param height
 * @returns {Road}
 */
Road.prototype.addLowRollingHills = function (num, height) {
    num = num || ROAD.LENGTH.SHORT;
    height = height || ROAD.HILL.LOW;
    return this.add(num, num, num, 0, height / 2)
        .add(num, num, num, 0, -height)
        .add(num, num, num, ROAD.CURVE.EASY, height)
        .add(num, num, num, 0, 0)
        .add(num, num, num, -ROAD.CURVE.EASY, height / 2)
        .add(num, num, num, 0, 0);
};
/**
 * Add "S" Curve segment.
 * @returns {Road}
 */
Road.prototype.addSCurves = function () {
    return this.add(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, -ROAD.CURVE.EASY, ROAD.HILL.NONE)
        .add(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.CURVE.MEDIUM, ROAD.HILL.MEDIUM)
        .add(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.CURVE.EASY, -ROAD.HILL.LOW)
        .add(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, -ROAD.CURVE.EASY, ROAD.HILL.MEDIUM)
        .add(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, -ROAD.CURVE.MEDIUM, -ROAD.HILL.MEDIUM);
};
/**
 * Add bumpy segment.
 * @returns {Road}
 */
Road.prototype.addBumps = function () {
    return this.add(10, 10, 10, 0, 5)
        .add(10, 10, 10, 0, -2)
        .add(10, 10, 10, 0, -5)
        .add(10, 10, 10, 0, 8)
        .add(10, 10, 10, 0, 5)
        .add(10, 10, 10, 0, -7)
        .add(10, 10, 10, 0, 5)
        .add(10, 10, 10, 0, -2);
};
/**
 * Add downhill to end segment.
 * @param num
 * @returns {Road}
 */
Road.prototype.addDownhillToEnd = function (num) {
    num = num || 200;

    return this.add(num, num, num, -ROAD.CURVE.EASY, -this.segments.lastY() / this.segments.SEGMENT_LENGTH);
};
/**
 * Reset the entire road, segments, tracks, and all.
 */
Road.prototype.reset = function () {
    var n;
    var playerSegment;

    this.segments.length = 0;

    this.addStraight(ROAD.LENGTH.SHORT);
    this.addLowRollingHills();
    this.addSCurves();
    this.addCurve(ROAD.LENGTH.MEDIUM, ROAD.CURVE.MEDIUM, ROAD.HILL.LOW);
    this.addBumps();
    this.addLowRollingHills();
    this.addCurve(ROAD.LENGTH.LONG * 2, ROAD.CURVE.MEDIUM, ROAD.HILL.MEDIUM);
    this.addStraight();
    this.addHill(ROAD.LENGTH.MEDIUM, ROAD.HILL.HIGH);
    this.addSCurves();
    this.addCurve(ROAD.LENGTH.LONG, -ROAD.CURVE.MEDIUM, ROAD.HILL.NONE);
    this.addHill(ROAD.LENGTH.LONG, ROAD.HILL.HIGH);
    this.addCurve(ROAD.LENGTH.LONG, ROAD.CURVE.MEDIUM, -ROAD.HILL.LOW);
    this.addBumps();
    this.addHill(ROAD.LENGTH.LONG, -ROAD.HILL.MEDIUM);
    this.addStraight();
    this.addSCurves();
    this.addDownhillToEnd();

    this.resetSprites();
    this.resetCars();

    playerSegment = this.segments.find(this.playerZ).index;
    this.segments[playerSegment + 2].color = this.segments[playerSegment + 3].color = Game.currentStage.colors.START;
    for (n = 0; n < this.segments.RUMBLE_LENGTH; n++) {
        this.segments[this.segments.length - 1 - n].color = Game.currentStage.colors.FINISH;
    }

    this.totalLength = this.segments.length * this.segments.SEGMENT_LENGTH;
};
