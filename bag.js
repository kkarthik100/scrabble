import utils from './utils.js';

let bag = function() {
  this.bag_ = [];
  this.init_();
};

bag.singleton_ = null;

bag.getSingleton = function() {
  if (!bag.singleton_) {
    bag.singleton_ = new bag();
  }
  return bag.singleton_;
};

bag.prototype.init_ = function() {
  var letterCount = {
    'A': 9,
    'B': 2,
    'C': 2,
    'D': 4,
    'E': 12,
    'F': 2,
    'G': 3,
    'H': 2,
    'I': 9,
    'J': 1,
    'K': 1,
    'L': 4,
    'M': 2,
    'N': 6,
    'O': 8,
    'P': 2,
    'Q': 1,
    'R': 6,
    'S': 4,
    'T': 6,
    'U': 4,
    'V': 2,
    'W': 2,
    'X': 1,
    'Y': 2,
    'Z': 1
  };

  // Create the array.
  for (var p in letterCount) {
    if (letterCount.hasOwnProperty(p)) {
      for (var i = 0; i < letterCount[p]; ++i) {
        this.bag_.push(p);
      }
    }
  }

  // Shake the bag!
  utils.shuffle(this.bag_);
};

bag.prototype.pick = function(numTiles) {
  var tiles = [];
  var bag = this.bag_;
  var count = bag.length > numTiles ? numTiles : bag.length;

  for (var i = 0; i < count; ++i) {
    var index = Math.round(Math.random() * (bag.length - 1));
    tiles.push(bag[index]);
    bag[index] = bag[bag.length - 1];
    bag.length--;
  }

  return tiles.join('');
};

bag.prototype.tilesRemaining = function() {
  return this.bag_.length;
};

export default bag;

