/**
 * Heads up
 * @constructor
 */
function Hud() {
    this.speed = {value: null, dom: Dom.get('speed_value')};
    this.current_lap_time = {value: null, dom: Dom.get('current_lap_time_value')};
    this.last_lap_time = {value: null, dom: Dom.get('last_lap_time_value')};
    this.fast_lap_time = {value: null, dom: Dom.get('fast_lap_time_value')};

}

/**
 * Update display value if needed.
 * @param key
 * @param value
 */
Hud.prototype.update = function (key, value) {
    if (this[key].value !== value) { // accessing DOM can be slow, so only do it if value has changed
        this[key].value = value;
        Dom.set(this[key].dom, value);
    }
};
