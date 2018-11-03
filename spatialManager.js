/*

spatialManager.js

A module which handles spatial lookup, as required for...
e.g. general collision detection.

*/

"use strict";

/* jshint browser: true, devel: true, globalstrict: true */

/*
0        1         2         3         4         5         6         7         8
12345678901234567890123456789012345678901234567890123456789012345678901234567890
*/

var spatialManager = {

// "PRIVATE" DATA

_nextSpatialID : 1, // make all valid IDs non-falsey (i.e. don't start at 0)

_entities : [],

// "PRIVATE" METHODS
//
// <none yet>


// PUBLIC METHODS

getNewSpatialID : function() {

    // TODO: YOUR STUFF HERE!
    return this._nextSpatialID++;

},

register: function(entity) {
    var pos = entity.getPos();
    var spatialID = entity.getSpatialID();
    
    // TODO: YOUR STUFF HERE!
    this._entities[spatialID]=entity;
    
},

unregister: function(entity) {
    var spatialID = entity.getSpatialID();

    // TODO: YOUR STUFF HERE!
    delete this._entities[spatialID];

},

findEntityInRange: function(posX, posY, radius) {

    // TODO: YOUR STUFF HERE!

    var shortest = Number.MAX_SAFE_INTEGER;
    
    for(var entity in this._entities){
            var eposX = this._entities[entity].getPos().posX;           //entity's pos
            var eposY = this._entities[entity].getPos().posY;

            var dist = util.wrappedDistSq(posX, posY, eposX, eposY, canvas.width, canvas.height);             
            var combinedRadiusSq = Math.pow((radius+this._entities[entity].getRadius()), 2);               // Radius of the entities combined, squared
            
            if(dist < combinedRadiusSq){                   //Check if distance is less then combinedRadius
                return this._entities[entity];   
            }
        }   
},



render: function(ctx) {
    var oldStyle = ctx.strokeStyle;
    ctx.strokeStyle = "red";
    for (var ID in this._entities) {
        var e = this._entities[ID];
        util.strokeBox(ctx, e.cx, e.cy, e.getWidth(), e.getHeight());
    }
    ctx.strokeStyle = oldStyle;
}

}
