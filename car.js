function Car(options) {
    this.offset = options.offset;
    this.z = options.z;
    this.sprite = options.sprite || Util.randomChoice(SPRITES.CARS);
    this.speed = options.speed || 1;
}
