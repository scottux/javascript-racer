/**
 * Canvas rendering helpers
 * @namespace
 * @type {{polygon: Render.polygon, segment: Render.segment, background: Render.background, sprite: Render.sprite, player: Render.player, fog: Render.fog, rumbleWidth: Render.rumbleWidth, laneMarkerWidth: Render.laneMarkerWidth}}
 */
var Render = {
    /**
     *
     * @param ctx
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     * @param x3
     * @param y3
     * @param x4
     * @param y4
     * @param color
     */
    polygon: function (ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x4, y4);
        ctx.closePath();
        ctx.fill();
    },
    /**
     *
     * @param ctx
     * @param width
     * @param lanes
     * @param x1
     * @param y1
     * @param w1
     * @param x2
     * @param y2
     * @param w2
     * @param fog
     * @param color
     */
    segment: function (ctx, width, lanes, x1, y1, w1, x2, y2, w2, fog, color) {
        var r1 = Render.rumbleWidth(w1, lanes);
        var r2 = Render.rumbleWidth(w2, lanes);
        var l1 = Render.laneMarkerWidth(w1, lanes);
        var l2 = Render.laneMarkerWidth(w2, lanes);
        var lanew1;
        var lanew2;
        var lanex1;
        var lanex2;
        var lane;

        ctx.fillStyle = color.grass;
        ctx.fillRect(0, y2, width, y1 - y2);
        Render.polygon(ctx, x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, color.rumble);
        Render.polygon(ctx, x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, color.rumble);
        Render.polygon(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, color.road);
        if (color.lane) {
            lanew1 = w1 * 2 / lanes;
            lanew2 = w2 * 2 / lanes;
            lanex1 = x1 - w1 + lanew1;
            lanex2 = x2 - w2 + lanew2;
            for (lane = 1; lane < lanes; lanex1 += lanew1, lanex2 += lanew2, lane++) {
                Render.polygon(ctx, lanex1 - l1 / 2, y1, lanex1 + l1 / 2, y1, lanex2 + l2 / 2, y2, lanex2 - l2 / 2, y2, color.lane);
            }
        }
        Render.fog(ctx, 0, y1, width, y2 - y1, fog, Game.currentStage.colors.FOG);
    },
    /**
     *
     * @param ctx
     * @param background
     * @param width
     * @param height
     * @param layer
     * @param rotation
     * @param offset
     */
    background: function (ctx, background, width, height, layer, rotation, offset) {
        rotation = rotation || 0;
        offset = offset || 0;
        var imageW = layer.w / 2;
        var imageH = layer.h;
        var sourceX = layer.x + Math.floor(layer.w * rotation);
        var sourceY = layer.y;
        var sourceW = Math.min(imageW, layer.x + layer.w - sourceX);
        var sourceH = imageH;
        var destX = 0;
        var destY = offset;
        var destW = Math.floor(width * (sourceW / imageW));
        var destH = height;

        ctx.drawImage(background, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH);
        if (sourceW < imageW) {
            ctx.drawImage(background, layer.x, sourceY, imageW - sourceW, sourceH, destW - 1, destY, width - destW, destH);
        }
    },
    /**
     *
     * @param ctx
     * @param width
     * @param height
     * @param resolution
     * @param roadWidth
     * @param sprites
     * @param sprite
     * @param scale
     * @param destX
     * @param destY
     * @param offsetX
     * @param offsetY
     * @param clipY
     */
    sprite: function (ctx, width, height, resolution, roadWidth, sprites, sprite, scale, destX, destY, offsetX, offsetY, clipY) {
        //  scale for projection AND relative to roadWidth (for tweakUI)
        var clipH;
        var projectionScale = scale * width / 2;
        var roadScale = SPRITES.SCALE * roadWidth;
        var destW = (sprite.w * projectionScale) * roadScale;
        var destH = (sprite.h * projectionScale) * roadScale;

        destX = destX + (destW * (offsetX || 0));
        destY = destY + (destH * (offsetY || 0));
        clipH = clipY ? Math.max(0, destY + destH - clipY) : 0;
        if (clipH < destH) {
            ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h - (sprite.h * clipH / destH), destX, destY, destW, destH - clipH);
        }
    },
    /**
     *
     * @param ctx
     * @param width
     * @param height
     * @param resolution
     * @param roadWidth
     * @param sprites
     * @param speedPercent
     * @param scale
     * @param destX
     * @param destY
     * @param steer
     * @param updown
     */
    player: function (ctx, width, height, resolution, roadWidth, sprites, speedPercent, scale, destX, destY, steer, updown) {
        var bounce = (1.5 * Math.random() * speedPercent * resolution) * Util.randomChoice([-1, 1]);
        var sprite;

        if (steer < 0) {
            sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_LEFT : SPRITES.PLAYER_LEFT;
        } else if (steer > 0) {
            sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_RIGHT : SPRITES.PLAYER_RIGHT;
        } else {
            sprite = (updown > 0) ? SPRITES.PLAYER_UPHILL_STRAIGHT : SPRITES.PLAYER_STRAIGHT;
        }
        Render.sprite(ctx, width, height, resolution, roadWidth, sprites, sprite, scale, destX, destY + bounce, -0.5, -1);
    },
    /**
     *
     * @param ctx
     * @param x
     * @param y
     * @param width
     * @param height
     * @param fog
     * @param color
     */
    fog: function (ctx, x, y, width, height, fog, color) {
        if (fog < 1) {
            ctx.globalAlpha = (1 - fog);
            ctx.fillStyle = color;
            ctx.fillRect(x, y, width, height);
            ctx.globalAlpha = 1;
        }
    },
    /**
     *
     * @param projectedRoadWidth
     * @param lanes
     * @returns {number}
     */
    rumbleWidth: function (projectedRoadWidth, lanes) {
        return projectedRoadWidth / Math.max(6, 2 * lanes);
    },
    /**
     *
     * @param projectedRoadWidth
     * @param lanes
     * @returns {number}
     */
    laneMarkerWidth: function (projectedRoadWidth, lanes) {
        return projectedRoadWidth / Math.max(32, 8 * lanes);
    }
};
