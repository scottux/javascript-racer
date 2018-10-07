/**
 * The details of the scenery and road geometry for the stage.
 * @param options
 * @constructor
 */
function Stage(options) {
    options = options || {};
    this.colors = options.colors || COLORS;
    this.bg = options.bg || BACKGROUND;
    this.lanes = options.lanes || 2;
}
