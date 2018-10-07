function Segment(options) {
    this.index = options.index;
    this.p1 = options.p1;
    this.p2 = options.p2;
    this.curve = options.curve;
    this.sprites = options.sprites || [];
    this.cars = options.cars || new CarCollection();
    this.color = options.color;
}
Segment.prototype.addCar = function (car) {
    this.cars.push(car);

    return this;
};
Segment.prototype.addSprite = function (sprite, offset) {
    this.sprites.push({source: sprite, offset: offset});

    return this;
};
