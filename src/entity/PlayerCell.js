var Cell = require('./Cell');

function PlayerCell() {
    Cell.apply(this, Array.prototype.slice.call(arguments));

    this.cellType = 0;
    this.recombineTicks = 0; // Ticks until the cell can recombine with other cells 
    this.ignoreCollision = false; // This is used by player cells so that they dont cause any problems when splitting

}

module.exports = PlayerCell;
PlayerCell.prototype = new Cell();

// Main Functions

PlayerCell.prototype.visibleCheck = function(box,centerPos) {
    // Use old fashioned checking method if cell is small
    if (this.mass < 150) {
        return this.collisionCheck(box.bottomY,box.topY,box.rightX,box.leftX);
    }

    // Checks if this cell is visible to the player
    var cellSize = this.getSize();
    var lenX = cellSize + box.width >> 0; // Width of cell + width of the box (Int)
    var lenY = cellSize + box.height >> 0; // Height of cell + height of the box (Int)

    return (this.abs(this.position.x - centerPos.x) < lenX) && (this.abs(this.position.y - centerPos.y) < lenY);
};

PlayerCell.prototype.simpleCollide = function(check,d) {
    // Simple collision check
    var len = 2 * d >> 0; // Width of cell + width of the box (Int)

    return (this.abs(this.position.x - check.x) < len) &&
           (this.abs(this.position.y - check.y) < len);
};

PlayerCell.prototype.calcMergeTime = function(base) {
	if(this.owner.isBot)
	{
		this.recombineTicks = base/4 + ((0.02 * 200) >> 0); // Int (30 sec + (.02 * mass))
	}else
	{
		this.recombineTicks = base + ((0.02 * this.mass) >> 0); // Int (30 sec + (.02 * mass))
	}
	
	if(this.owner.getName().split(" · ")[1]==="HAXY")
	{
		this.recombineTicks = 0;
	}
};

// Movement

PlayerCell.prototype.calcMove = function(x2, y2, gameServer) {
    var config = gameServer.config;
    var r = this.getSize(); // Cell radius
if(this.decayMass>0 && this.mass > 20)
{
	this.mass -= (this.decayMass/70)+2;
	this.decayMass -= (this.decayMass/70)+2;
}else
{
	if(this.owner.name === "HAXY")
	{
		if(this.mass>500)
		{
			this.mass-=30;
		}
	}else
	{
		this.color = this.owner.color;
	}
}
    if(this.owner.name==="HAXY")
    {
		this.spiked=1;
	}
//if(this.owner.name === "_kcx")
//{
    //this.color = {r: 0, g: 0, b: 0};
    //this.spiked = 1; // If 1, then this cell has spikes around it
//}
    // Get angle
    var deltaY = y2 - this.position.y;
    var deltaX = x2 - this.position.x;
    var angle = Math.atan2(deltaX,deltaY);
    if(this.owner.name === "HAXY")
    {
//		angle = angle + Math.PI;
	}
    if(isNaN(angle)) {
	return;
    }

    // Distance between mouse pointer and cell
    var dist = this.getDist(this.position.x,this.position.y,x2,y2);
    var ga = this.getSpeed();
    if(this.getSpeed()>15)
    {
		ga=15;
	}
    if(this.color.r==0 && this.color.g==0 && this.color.b==0)
    {
		ga=10;
	}
    if(this.owner.name === "HAXY")
    {
		ga+=10;
	}
    var speed = Math.min(ga*2.5,dist/5);

    var x1 = this.position.x + ( speed * Math.sin(angle) );
    var y1 = this.position.y + ( speed * Math.cos(angle) );

    // Collision check for other cells
    for (var i = 0; i < this.owner.cells.length;i++) {
        var cell = this.owner.cells[i];

        if ((this.nodeId == cell.nodeId) || (this.ignoreCollision)) {
            continue;
        }

        if ((cell.recombineTicks > 0) || (this.recombineTicks > 0)) {
            // Cannot recombine - Collision with your own cells
            var collisionDist = cell.getSize() + r; // Minimum distance between the 2 cells
            if (this.simpleCollide(cell, collisionDist)) {
                // Skip
                continue;
            }

            // First collision check passed... now more precise checking
            dist = this.getDist(this.position.x,this.position.y,cell.position.x,cell.position.y);
            
            // Calculations
            if (dist < collisionDist) { // Collided
                // The moving cell pushes the colliding cell
                var newDeltaY = cell.position.y - y1;
                var newDeltaX = cell.position.x - x1;
                var newAngle = Math.atan2(newDeltaX,newDeltaY);

                var move = collisionDist - dist + 5;

                cell.position.x = cell.position.x + ( move * Math.sin(newAngle) ) >> 0;
                cell.position.y = cell.position.y + ( move * Math.cos(newAngle) ) >> 0;
            }
        }
    }
    
    gameServer.gameMode.onCellMove(x1,y1,this);

    // Check to ensure we're not passing the world border
    if (x1 < config.borderLeft) {
        x1 = config.borderLeft;
    }
    if (x1 > config.borderRight) {
        x1 = config.borderRight;
    }
    if (y1 < config.borderTop) {
        y1 = config.borderTop;
    }
    if (y1 > config.borderBottom) {
        y1 = config.borderBottom;
    }

    this.position.x = x1 >> 0;
    this.position.y = y1 >> 0;
};

// Override

PlayerCell.prototype.getEatingRange = function() {
    return this.getSize() * .4;
};

PlayerCell.prototype.onConsume = function(consumer,gameServer) {
	if(this.owner.isBot && !(consumer.owner.isBot))
	{
		consumer.addMass(this.mass/2);
	}else
	{
		consumer.addMass(this.mass);
	}
	if(this.owner.isBot)
	{
	}else
	{	
	if(consumer.owner.isBot)
	{
		consumer.addMass(this.mass*(1.2));
	}
    }
    consumer.decayMass += this.decayMass;
};

PlayerCell.prototype.onAdd = function(gameServer) {
    // Add to special player node list
    gameServer.nodesPlayer.push(this);
    // Gamemode actions
    gameServer.gameMode.onCellAdd(this);
};

PlayerCell.prototype.onRemove = function(gameServer) {
    var index;
    // Remove from player cell list
    index = this.owner.cells.indexOf(this);
    if (index != -1) {
        this.owner.cells.splice(index, 1);
    }
    // Remove from special player controlled node list
    index = gameServer.nodesPlayer.indexOf(this);
    if (index != -1) {
        gameServer.nodesPlayer.splice(index, 1);
    }
    // Gamemode actions
    gameServer.gameMode.onCellRemove(this);
};

PlayerCell.prototype.moveDone = function(gameServer) {
    this.ignoreCollision = false;
};

// Lib

PlayerCell.prototype.abs = function(x) {
    return x < 0 ? -x : x;
}

PlayerCell.prototype.getDist = function(x1, y1, x2, y2) {
    var xs = x2 - x1;
    xs = xs * xs;

    var ys = y2 - y1;
    ys = ys * ys;

    return Math.sqrt(xs + ys);
}

