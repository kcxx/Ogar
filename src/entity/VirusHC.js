var Cell = require('./Cell');
var Virus = require('../entity/Virus');

function VirusHC() {
    Cell.apply(this, Array.prototype.slice.call(arguments));

    this.cellType = 2;
    this.spiked = 1;
    this.fed = 0;
    this.color = {r: 255, g: 0, b: 0};
    this.ownerr = "";
    this.namee = "Explode: 15";
}

module.exports = VirusHC;
VirusHC.prototype = new Cell();

VirusHC.prototype.calcMove = null; // Only for player controlled movement

VirusHC.prototype.feed = function(feeder,gameServer) {
    this.setAngle(feeder.getAngle()); // Set direction if the VirusHC explodes
    this.mass += feeder.mass*1.5;
    this.fed++; // Increase feed count
if(feeder.nameee === undefined)
{
	this.ownerr = "";
    this.namee = "Explode: "+(15-this.fed);
}else
{
	this.ownerr = feeder.nameee;
    this.namee = "Owner: "+this.ownerr+" | Explode: "+(15-this.fed);
}

    gameServer.removeNode(feeder);
    // Check if the VirusHC is going to explode
    if (this.fed >= 15) {
        this.mass = 150; // Reset mass
        this.fed = 0;
    gameServer.removeNode(this);

for(var av = 0; av < 50; av++)
{
  var angle = Math.random() * 6.28; // (Math.PI * 2) ??? Precision is not our greatest concern here
    var r = 0;
    var pos = {
        x: this.position.x + ( r * Math.sin(angle) ),
        y: this.position.y + ( r * Math.cos(angle) )
    };

    // Spawn food
    var f = new Virus(gameServer.getNextNodeId(), null, pos, 50);
    f.setColor({r: 150, g: 0, b: 0});

    gameServer.addNode(f);
    gameServer.currentFood++;
    f.massd = 50;
f.namee = this.ownerr;
f.hc = 1;
    // Move engine
    f.angle = angle;
    var dist = 550; // Random distance
    f.setMoveEngineData(dist,450);
	
    gameServer.setAsMovingNode(f);    }}
};

// Main Functions

VirusHC.prototype.getEatingRange = function() {
    return this.getSize() * .4; // 0 for ejected cells
};

VirusHC.prototype.onConsume = function(consumer,gameServer) {
    var client = consumer.owner;
    if(client.name === this.namee && !(client.name === ""))
{   consumer.addMass(this.mass);
}else
{
    var maxSplits = Math.floor(consumer.mass/16) - 1; // Maximum amount of splits
    var numSplits = 32 - client.cells.length; // Get number of splits
    numSplits = Math.min(numSplits,maxSplits);
    var splitMass = Math.min(consumer.mass/(numSplits + 1), 36); // Maximum size of new splits

    // Cell consumes mass before splitting
    consumer.addMass(this.mass);

    // Cell cannot split any further
    if (numSplits <= 0) {
        return;
    }

    // Big cells will split into cells larger than 36 mass (1/4 of their mass)
    var bigSplits = 0;
    var endMass = consumer.mass - (numSplits * splitMass);
    if ((endMass > 300) && (numSplits > 0)) {
        bigSplits++;
        numSplits--;
    }
    if ((endMass > 1200) && (numSplits > 0)) {
        bigSplits++;
        numSplits--;
    }
    if ((endMass > 3000) && (numSplits > 0)) {
        bigSplits++;
        numSplits--;
    }

    // Splitting
    var angle = 0; // Starting angle
    for (var k = 0; k < numSplits; k++) {
        angle += 6/numSplits; // Get directions of splitting cells
        gameServer.newCellVirused(client, consumer, angle, splitMass,150);
        consumer.mass -= splitMass;
    }

    for (var k = 0; k < bigSplits; k++) {
        angle = Math.random() * 6.28; // Random directions
        splitMass = consumer.mass / 4;
        gameServer.newCellVirused(client, consumer, angle, splitMass,20);
        consumer.mass -= splitMass;
    }
	
    // Prevent consumer cell from merging with other cells
    consumer.calcMergeTime(gameServer.config.playerRecombineTime);}
};

VirusHC.prototype.onAdd = function(gameServer) {
    gameServer.nodesVirus.push(this);
};

VirusHC.prototype.onRemove = function(gameServer) {
    var index = gameServer.nodesVirus.indexOf(this);
    if (index != -1) {
        gameServer.nodesVirus.splice(index, 1);
    } else {
        console.log("[Warning] Tried to remove a non existing VirusHC!");
    }
};

