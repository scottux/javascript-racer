/**
 * A collection of Road Segments
 * @param options
 * @constructor
 */
function SegmentCollection(options) {
    options = options || {};
    this.SEGMENT_LENGTH = options.segmentLength || 200;
    this.RUMBLE_LENGTH = options.rumbleLength || 3;
}
// Extend array for collection
SegmentCollection.prototype = [];
/**
 *
 * @param curve
 * @param y
 */
SegmentCollection.prototype.add = function (curve, y) {
    var len = this.length;

    // add a new segment to the collection
    this.push(new Segment({
        index: len,
        p1: {world: {y: this.lastY(), z: len * this.SEGMENT_LENGTH}, camera: {}, screen: {}},
        p2: {world: {y: y, z: (len + 1) * this.SEGMENT_LENGTH}, camera: {}, screen: {}},
        curve: curve,
        color: Math.floor(len / this.RUMBLE_LENGTH) % 2 ? Game.currentStage.colors.DARK : Game.currentStage.colors.LIGHT
    }));
};
/**
 *
 * @param index
 * @param sprite
 * @param offset
 */
SegmentCollection.prototype.addSprite = function (index, sprite, offset) {
    this[index].addSprite(sprite, offset);

    return this;
};
/**
 *
 * @param z
 * @returns {*}
 */
SegmentCollection.prototype.find = function (z) {
    return this[Math.floor(z / this.SEGMENT_LENGTH) % this.length];
};
/**
 *
 * @returns {number}
 */
SegmentCollection.prototype.lastY = function () {
    return !this.length ? 0 : this[this.length - 1].p2.world.y;
};
