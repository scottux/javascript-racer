/**
 * General purpose helpers (mostly math)
 * @namespace
 * @type {{timestamp: Util.timestamp, toInt: Util.toInt, toFloat: Util.toFloat, limit: Util.limit, randomInt: Util.randomInt, randomChoice: Util.randomChoice, percentRemaining: Util.percentRemaining, accelerate: Util.accelerate, interpolate: Util.interpolate, easeIn: Util.easeIn, easeOut: Util.easeOut, easeInOut: Util.easeInOut, exponentialFog: Util.exponentialFog, increase: Util.increase, project: Util.project, overlap: Util.overlap}}
 */
var Util = {
    /**
     *
     * @returns {number}
     */
    timestamp: function () {
        return new Date().getTime();
    },
    /**
     *
     * @param obj
     * @param def
     * @returns {*}
     */
    toInt: function (obj, def) {
        var x;

        if (obj !== null) {
            x = parseInt(obj, 10);
            if (!isNaN(x)) {
                return x;
            }
        }

        return Util.toInt(def, 0);
    },
    /**
     *
     * @param obj
     * @param def
     * @returns {*}
     */
    toFloat: function (obj, def) {
        var x;

        if (obj !== null) {
            x = parseFloat(obj);
            if (!isNaN(x)) { return x; }
        }

        return Util.toFloat(def, 0.0);
    },
    /**
     *
     * @param value
     * @param min
     * @param max
     * @returns {number}
     */
    limit: function (value, min, max) {
        return Math.max(min, Math.min(value, max));
    },
    /**
     *
     * @param min
     * @param max
     * @returns {number}
     */
    randomInt: function (min, max) {
        return Math.round(Util.interpolate(min, max, Math.random()));
    },
    /**
     *
     * @param options
     * @returns {*}
     */
    randomChoice: function (options) {
        return options[Util.randomInt(0, options.length - 1)];
    },
    /**
     *
     * @param n
     * @param total
     * @returns {number}
     */
    percentRemaining: function (n, total) {
        return (n % total) / total;
    },
    /**
     *
     * @param v
     * @param accel
     * @param dt
     * @returns {*}
     */
    accelerate: function (v, accel, dt) {
        return v + (accel * dt);
    },
    /**
     *
     * @param a
     * @param b
     * @param percent
     * @returns {*}
     */
    interpolate: function (a, b, percent) {
        return a + (b - a) * percent
    },
    /**
     *
     * @param a
     * @param b
     * @param percent
     * @returns {*}
     */
    easeIn: function (a, b, percent) {
        return a + (b - a) * Math.pow(percent, 2);
    },
    /**
     *
     * @param a
     * @param b
     * @param percent
     * @returns {*}
     */
    easeOut: function (a, b, percent) {
        return a + (b - a) * (1 - Math.pow(1 - percent, 2));
    },
    /**
     *
     * @param a
     * @param b
     * @param percent
     * @returns {*}
     */
    easeInOut: function (a, b, percent) {
        return a + (b - a) * ((-Math.cos(percent * Math.PI) / 2) + 0.5);
    },
    /**
     *
     * @param distance
     * @param density
     * @returns {number}
     */
    exponentialFog: function (distance, density) {
        return 1 / (Math.pow(Math.E, (Math.pow(distance, 2) * density)));
    },
    /**
     *
     * @param start
     * @param increment
     * @param max
     * @returns {*}
     */
    increase: function (start, increment, max) { // with looping
        var result = start + increment;

        while (result >= max){
            result -= max;
        }
        while (result < 0){
            result += max;
        }

        return result;
    },
    /**
     *
     * @param p
     * @param cameraX
     * @param cameraY
     * @param cameraZ
     * @param cameraDepth
     * @param width
     * @param height
     * @param roadWidth
     */
    project: function (p, cameraX, cameraY, cameraZ, cameraDepth, width, height, roadWidth) {
        p.camera.x = (p.world.x || 0) - cameraX;
        p.camera.y = (p.world.y || 0) - cameraY;
        p.camera.z = (p.world.z || 0) - cameraZ;
        p.screen.scale = cameraDepth / p.camera.z;
        p.screen.x = Math.round((width / 2) + (p.screen.scale * p.camera.x * width / 2));
        p.screen.y = Math.round((height / 2) - (p.screen.scale * p.camera.y * height / 2));
        p.screen.w = Math.round((p.screen.scale * roadWidth * width / 2));
    },
    /**
     *
     * @param x1
     * @param w1
     * @param x2
     * @param w2
     * @param percent
     * @returns {boolean}
     */
    overlap: function (x1, w1, x2, w2, percent) {
        var half = (percent || 1) / 2;
        var min1 = x1 - (w1 * half);
        var max1 = x1 + (w1 * half);
        var min2 = x2 - (w2 * half);
        var max2 = x2 + (w2 * half);

        return !((max1 < min2) || (min1 > max2));
    }
};
