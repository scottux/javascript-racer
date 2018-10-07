/**
 * Minimalist DOM helpers
 * @namespace
 * @type {{get: Dom.get, set: Dom.set, on: Dom.on, un: Dom.un, show: Dom.show, blur: Dom.blur, addClassName: Dom.addClassName, removeClassName: Dom.removeClassName, toggleClassName: Dom.toggleClassName, storage: (*)}}
 */
var Dom = {
    /**
     *
     * @param id
     * @returns {*}
     */
    get: function (id) {
        return ((id instanceof HTMLElement) || (id === document)) ? id : document.getElementById(id);
    },
    /**
     *
     * @param id
     * @param html
     */
    set: function (id, html) {
        Dom.get(id).innerHTML = html;
    },
    /**
     *
     * @param ele
     * @param type
     * @param fn
     * @param capture
     */
    on: function (ele, type, fn, capture) {
        Dom.get(ele).addEventListener(type, fn, capture);
    },
    /**
     *
     * @param ele
     * @param type
     * @param fn
     * @param capture
     */
    un: function (ele, type, fn, capture) {
        Dom.get(ele).removeEventListener(type, fn, capture);
    },
    /**
     *
     * @param ele
     * @param type
     */
    show: function (ele, type) {
        Dom.get(ele).style.display = (type || 'block');
    },
    /**
     *
     * @param ev
     */
    blur: function (ev) {
        ev.target.blur();
    },
    /**
     *
     * @param ele
     * @param name
     */
    addClassName: function (ele, name) {
        Dom.toggleClassName(ele, name, true);
    },
    /**
     *
     * @param ele
     * @param name
     */
    removeClassName: function (ele, name) {
        Dom.toggleClassName(ele, name, false);
    },
    /**
     *
     * @param ele
     * @param name
     * @param on
     */
    toggleClassName: function (ele, name, on) {
        var n;
        var classes;

        ele = Dom.get(ele);
        classes = ele.className.split(' ');
        n = classes.indexOf(name);
        on = (typeof on === 'undefined') ? (n < 0) : on;
        if (on && (n < 0)) {
            classes.push(name);
        } else if (!on && (n >= 0)) {
            classes.splice(n, 1);
        }
        ele.className = classes.join(' ');
    },
    storage: window.localStorage || {}
};
