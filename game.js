import ai from './ai.js';
import bag from './bag.js';
import board from './board.js';
import stats from './stats.js';
import trie from './trie.js';
import utils from './utils.js';

let game = function() {
  this.dictionary_ = new trie();
  this.board_ = new board(this.dictionary_);
  this.board_.parseFromString(this.initBoard_());
  this.board_.printBoardToHTML();

  this.human_ = null;
  this.aiPlayers_ = [];
  this.moveNumber_ = 0;

  this.elementBeingDragged_ = null;
  this.elementOffsetX_ = 0;
  this.elementOffsetY_ = 0;
  this.animatedTiles_ = [];

  var button = document.getElementById('humanPlayButton');
  utils.bind(button, 'click', this.humanMove_.bind(this));

  button = document.getElementById('humanRecallButton');
  button.disabled = true;
  utils.bind(button, 'click', this.humanRecall_.bind(this));

  button = document.getElementById('humanShuffleButton');
  button.disabled = true;
  utils.bind(button, 'click', this.humanShuffle_.bind(this));

  button = document.getElementById('dictionaryButton');
  utils.bind(button, 'click', this.checkDictionary_.bind(this));

  utils.bind(document, 'mousemove', this.dragHandler_.bind(this));

  // Disable selection, otherwise it produces a horrible jarring effect when
  // a tile is dragged. For Firefox, we add a "-moz-user-select: none" style
  // to the body (in the stylesheet).
  utils.bind(document, 'selectstart', function(evt) {
    evt.preventDefault();
  });
};

game.singleton_ = null;

game.getSingleton = function() {
  if (!game.singleton_) {
    game.singleton_ = new game();
  }
  return game.singleton_;
};

game.readDictionary = function(words) {
  game.getSingleton().readDictionary_(words)
};

game.play = function() {
  game.getSingleton().play_()
};

game.prototype.play_ = function() {
  this.initGame_();

  this.human_.name = window.prompt('Type in your name:') || 'HUMAN';
  this.human_.name = this.human_.name.toUpperCase();
  document.getElementById('scoreHuman').innerHTML = this.human_.name;

  document.body.style.display = '';
};

game.prototype.dragHandler_ = function(evt) {
  var el = this.elementBeingDragged_;
  if (el) {
    el.style.position = 'fixed';
    el.style.zIndex = 10;  // So that the tile floats above other elements.
    el.style.left = evt.clientX - this.elementOffsetX_;
    el.style.top = evt.clientY - this.elementOffsetY_;
  }
};

game.prototype.initGame_ = function() {
  // For now, we just have 1 AI player and 1 human player.

  // Initialize the human.
  this.human_ = {
    name: 'HUMAN',
    tiles: bag.getSingleton().pick(7),
    tilesBeingMoved: [],
    scoreSoFar: 0
  };

  this.printTilesAndMaybeSetEventHandlers_(this.human_.tiles, false);

  // Initialize the AI player.
  let aiPlayer = new ai(this.board_, this.dictionary_);
  this.aiPlayers_.push(aiPlayer);
  aiPlayer.removeTilesAndRefreshFromBag('');
  this.printTilesAndMaybeSetEventHandlers_(aiPlayer.tiles_, true);

  // Enable the 'Play' and 'Shuffle' buttons.
  document.getElementById('humanPlayButton').disabled = false;
  document.getElementById('humanShuffleButton').disabled = false;

  // Display the number of tiles remaining.
  document.getElementById('tilesRemaining').innerHTML = 'Tiles remaining: ' +
      bag.getSingleton().tilesRemaining();
};

game.prototype.controller_ = function() {
  // Display the number of tiles remaining.
  document.getElementById('tilesRemaining').innerHTML = 'Tiles remaining: ' +
      bag.getSingleton().tilesRemaining();

  // Disable various buttons.
  document.getElementById('humanPlayButton').disabled = true;
  document.getElementById('humanRecallButton').disabled = true;
  document.getElementById('humanShuffleButton').disabled = true;

  // Has the human finished all tiles?
  if (this.human_.tiles == '') {
    this.displayEndOfGameMessage_(true);
//  TODO(karthikkumar)
//    this.cleanUp_();
    return;
  }

  this.aiMove_(this.aiPlayers_[0]);
};

game.prototype.humanMove_ = function() {
  var arr = this.human_.tilesBeingMoved;

  // Check that the first move passes through the center square.
  if (this.moveNumber_ == 0) {
    for (var i = 0, centerTile = false; i < arr.length; ++i) {
      // Why is this check needed? When can an arr[i] be null?
      if (!arr[i]) {
        continue;
      }
      if (arr[i].index == board.CENTER_TILE_INDEX) {
        centerTile = true;
      }
    }
    if (!centerTile) {
      alert('The first move must pass through the center square. Try again.');
      return;
    }
  }

  // All the tiles should line up either horizontally, or vertically (we ignore
  // tiles placed outside the board; they will be garbage collected when
  // this.printTilesAndMaybeSetEventHandlers_ is called).
  var first = null;
  var numTiles = 0;
  var alignX = false;
  var alignY = false;
  var repeats = {};
  for (var i = 0; i < arr.length; ++i) {
    if (!arr[i]) {
      continue;
    }

    numTiles++;

    if (!first) {
      first = {
        x: arr[i].x,
        y: arr[i].y
      };
      repeats[first.x + ':' + first.y] = true;
      continue;
    }


    // Is this tile placed on top of another tile?
    if (repeats[arr[i].x + ':' + arr[i].y]) {
      alert('You have placed a tile on top of another! Try again.');
      return;
    }

    // At least the x or the y must match with the first tile found.
    if (arr[i].x == first.x) {
      alignY = true;
    } else if (arr[i].y == first.y) {
      alignX = true;
    } else {
      alert('All tiles must be in a line! Try again.');
      return;
    }
  }

  if (numTiles == 0) {
    alert('You need to drag one or more tiles and drop them ' +
          'on the board. Then click "Play!"');
    return;
  }

  if (numTiles == 1) {
    // This is necessary, to move the only element to the front of the
    // array (arr[0]) and all undefined values to the end.
    // (The Array.sort() function does this).
    arr.sort();
  } else {  // > 1 tiles
    if (alignX && alignY) {
      alert('All tiles must be in one line! Try again.');
      return;
    }

    if (alignX) {
      arr.sort(function(tile1, tile2) {
        return tile1.x - tile2.x;
      });
    } else if (alignY) {
      arr.sort(function(tile1, tile2) {
        return tile1.y - tile2.y;
      });
    }
  }

  // Now that we have sorted the tiles (either horizontally or vertically), we
  // can construct the string from the letter on each tile, in order.
  var tilesStr = '';
  for (var i = 0; i < arr.length; ++i) {
    if (!arr[i]) {
      continue;
    }
    tilesStr += arr[i].tileChar;
  }

  var score;
  if (tilesStr.length > 1) {
    score = this.board_.computeScore(arr[0].index, tilesStr, alignX);
  } else {
    // For one letter moves, we don't know the orientation. So, we need to try
    // both directions, if the first direction fails.
    score = this.board_.computeScore(arr[0].index, tilesStr, true);
    if (score == -1) {
      score = this.board_.computeScore(arr[0].index, tilesStr, false);
    }
  }
  if (score == -1) {
    alert('Invalid word! Try again.');
    return;
  }

  this.board_.makeMove(arr[0].index, alignX, tilesStr);
  this.board_.printBoardToHTML();
  this.human_.tiles = utils.difference(this.human_.tiles, tilesStr);
  this.human_.tiles += bag.getSingleton().pick(
      7 - this.human_.tiles.length),
  this.human_.tilesBeingMoved = [];
  this.printTilesAndMaybeSetEventHandlers_(this.human_.tiles, false);

  // Update and display the score.
  this.human_.scoreSoFar += score;
  this.animateScoreCounter_(score, 'scoreHuman', this.human_.name);

  this.moveNumber_++;
  this.controller_();
};

game.prototype.humanRecall_ = function() {
  this.board_.printBoardToHTML();
  this.human_.tilesBeingMoved = [];
  this.printTilesAndMaybeSetEventHandlers_(this.human_.tiles, false);

  document.getElementById('humanRecallButton').disabled = true;
};

game.prototype.humanShuffle_ = function() {
  // Shuffle the tiles.
  this.human_.tiles = utils.shuffle(
      this.human_.tiles.split('')).join('');

  this.board_.printBoardToHTML();
  this.human_.tilesBeingMoved = [];
  this.printTilesAndMaybeSetEventHandlers_(this.human_.tiles, false);
};

game.prototype.checkDictionary_ = function() {
  var word = window.prompt('Check if a word is in the dictionary:');
  if (this.dictionary_.lookup(word.toUpperCase()).status ==
      trie.WORD_FOUND) {
    alert('"' + word + '" is a dictionary word.');
  } else {
    alert('"' + word + '" is NOT a dictionary word!');
  }
};

game.prototype.aiMove_ = function(aiPlayer) {
  // - Compute the 'best' move and make it.
  // - Update the tiles and the score on the UI.

  var bestMove = aiPlayer.computeBestMove();
  window.console && window.console.log(bestMove);
  var tileIndicesOnBoard = this.board_.makeMove(bestMove.index,
                                                bestMove.horizontal,
                                                bestMove.tiles);

  // Get the source coords. This is an array of triplets, where each triplet
  // is itself an array. The first two elements of a triplet are the (x,y)
  // coordinates of a tile on the rack. The third element is the index of
  // the tile on the rack.
  var sourceCoords = [];
  var rackCoords = utils.getDocumentCoords(
      document.getElementById('tilesAI'));
  var tiles = this.aiPlayers_[0].tiles_;
  var usedAlready = [];
  for (var i = 0; i < bestMove.tiles.length; ++i) {
    for (var j = 0; j < tiles.length; ++j) {
      if ((bestMove.tiles[i] == tiles[j]) && !usedAlready[j]) {
        sourceCoords.push([rackCoords.x + (j * 40) + 10,
                           rackCoords.y + 10, j]);
        usedAlready[j] = true;
        break;
      }
    }
  }

  // Get the destination coords. This is an array of pairs, where each pair
  // is itself an array, that is the coordinate (x, y) of the tile on the
  // board.
  var destCoords = [];
  for (i = 0; i < tileIndicesOnBoard.length; ++i) {
    destCoords.push(this.board_.getTileCoords(tileIndicesOnBoard[i]));
  }

  this.animateAIMove_(sourceCoords, destCoords, bestMove.tiles, aiPlayer);
  this.animateScoreCounter_(bestMove.score, 'scoreAI', 'MACHINE');
  this.moveNumber_++;
};

game.prototype.animateAIMove_ = function(from, to, tiles, aiPlayer) {
  var numTiles = from.length;
  var curTile = 0;
  var deltas = [];
  var curPos = [];

  // Calculate the deltas to move in the X and Y direction for each tile.
  // This is a one time calculation, so there is no need to repeat this during
  // the animation.
  for (var i = 0; i < tiles.length; ++i) {
    var xFrom = from[i][0];
    var xTo = to[i].x;
    var yFrom = from[i][1];
    var yTo = to[i].y;
    var diffX = Math.abs(xTo - xFrom);
    var diffY = Math.abs(yTo - yFrom);
    var step = 2;

    if (diffX >= diffY) {
      deltas.push([diffX / diffY * (xTo >= xFrom ? step : -step),
                   yTo >= yFrom ? step : -step]);
    } else {
      deltas.push([xTo >= xFrom ? step : -step,
                   diffY / diffX * (yTo >= yFrom ? step : -step)]);
    }
    curPos.push([from[i][0], from[i][1]]);

    // Create the tile that needs to be animated.
    var tile = document.createElement('div');
    tile.className = 'tile letter letter-ai';
    tile.innerHTML = this.board_.getTileHTML(tiles.charAt(i));
    tile.style.visibility = 'hidden';
    tile.style.position = 'fixed';
    document.body.appendChild(tile);
    this.animatedTiles_.push(tile);
  }

  // Hide the first tile that is to be animated.
  var rackNode = document.getElementById('tilesAI');
  rackNode.childNodes[from[0][2]].style.visibility = 'hidden';

  var animator = utils.bindFn(function() {
    var tileProp = this.animatedTiles_[curTile].style;
    tileProp.visibility = 'visible';
    tileProp.left = Math.round(curPos[curTile][0]);
    tileProp.top = Math.round(curPos[curTile][1]);
    curPos[curTile][0] += deltas[curTile][0];
    curPos[curTile][1] += deltas[curTile][1];

    // If this tile has overshot it's destination, reposition at the correct
    // destination coordinates and move on to animate the next tile.
    if ((to[curTile].x >= from[curTile][0] &&
         curPos[curTile][0] >= to[curTile].x) ||
        (to[curTile].x < from[curTile][0] &&
         curPos[curTile][0] <= to[curTile].x) ||
        (to[curTile].y >= from[curTile][1] &&
         curPos[curTile][1] >= to[curTile].y) ||
        (to[curTile].y < from[curTile][1] &&
         curPos[curTile][1] <= to[curTile].y)) {
      tileProp.left = to[curTile].x;
      tileProp.top = to[curTile].y;
      ++curTile;
      if (curTile == numTiles) {
        aiPlayer.removeTilesAndRefreshFromBag(tiles);
        this.printTilesAndMaybeSetEventHandlers_(aiPlayer.tiles_, true);
        window.clearInterval(timerId);

        // Display the number of tiles remaining.
        document.getElementById('tilesRemaining').innerHTML =
            'Tiles remaining: ' +
            bag.getSingleton().tilesRemaining();

        // Has the AI finished all tiles?
        if (this.aiPlayers_[0].tiles_ == '') {
          this.displayEndOfGameMessage_(false);
      //  TODO(karthikkumar)
      //    this.cleanUp_();
          return;
        }

        // Enable the 'Play' and 'Shuffle' buttons.
        document.getElementById('humanPlayButton').disabled = false;
        document.getElementById('humanShuffleButton').disabled = false;
      } else {
        // Hide the next tile that is to be animated.
        var rackNode = document.getElementById('tilesAI');
        rackNode.childNodes[from[curTile][2]].style.visibility = 'hidden';
      }
    }
  }, this);

  var timerId = window.setInterval(animator, 10);
};

game.prototype.garbageCollectAnimatedTiles_ = function() {
  // Garbage collect the tile nodes that were used to animate the AI move.
  for (var i = 0; i < this.animatedTiles_.length; ++i) {
    this.animatedTiles_[i].parentNode.removeChild(this.animatedTiles_[i]);
  }
  this.animatedTiles_ = [];
  this.board_.printBoardToHTML();
};

game.prototype.printTilesAndMaybeSetEventHandlers_ = function(
    tiles, isAIPlayer) {
  var node = document.getElementById(isAIPlayer ? 'tilesAI' : 'tilesHuman');

  // Garbage collect the old tiles (that were on the rack earlier).
  utils.removeAllChildren(node);

  for (var i = 0; i < tiles.length; ++i) {
    var tile = document.createElement('div');
    tile.className = 'tile letter';
    if (!isAIPlayer) {
      // Do not show the AI player's tiles.
      tile.innerHTML = this.board_.getTileHTML(tiles.charAt(i));
    }
    tile.style.left = i * 40 + 10;
    tile.style.top = 10;
    node.appendChild(tile);

    if (isAIPlayer) {
      continue;
    }

    utils.bind(tile, 'mousedown', (function(context, tile) {
      return utils.bindFn(function(evt) {
        this.garbageCollectAnimatedTiles_();

        this.elementBeingDragged_ = tile;
        var coords = utils.getDocumentCoords(tile);

        // Subtract from the position of the mouse to get the amount the
        // top and left edges of the element are offset from the mouse
        // position.
        this.elementOffsetX_ = evt.clientX - coords.x;
        this.elementOffsetY_ = evt.clientY - coords.y;
      }, context);})(this, tile));

    utils.bind(tile, 'mouseup', (function(
        context, indexOnRack, tileChar) {
      return utils.bindFn(function(evt) {
        var tile = this.elementBeingDragged_;
        var ret = this.board_.getSnapToGridTileIndex(tile);
        if (ret.success) {
          tile.style.left = ret.x;
          tile.style.top = ret.y;
          this.human_.tilesBeingMoved[indexOnRack] = {
            x: ret.x,
            y: ret.y,
            index: ret.index,
            tileChar: tileChar
          };
        } else {
          this.human_.tilesBeingMoved[indexOnRack] = undefined;
        }
        tile.style.zIndex = 0;
        this.elementBeingDragged_ = null;
        document.getElementById('humanRecallButton').disabled = false;
      }, context);})(this, i, tiles.charAt(i)));

    utils.bind(tile, 'mouseover', (function(tile) {
      return function(evt) {
        tile.className = 'tile letter letter-hover';
      };})(tile));

    utils.bind(tile, 'mouseout', (function(tile) {
      return function(evt) {
        tile.className = 'tile letter';
      };})(tile));

    /////////////////////
    // Add touch events.
    /////////////////////

    utils.bind(tile, 'touchstart', (function(context, tile) {
      return utils.bindFn(function(evt) {
        this.garbageCollectAnimatedTiles_();
        tile.className = 'tile letter letter-hover';
      }, context);})(this, tile));

    utils.bind(tile, 'touchend', (function(
        context, indexOnRack, tileChar) {
      return utils.bindFn(function(evt) {
        var tile = evt.changedTouches[0].target;
        var ret = this.board_.getSnapToGridTileIndex(tile);
        if (ret.success) {
          tile.style.left = ret.x;
          tile.style.top = ret.y;
          this.human_.tilesBeingMoved[indexOnRack] = {
            x: ret.x,
            y: ret.y,
            index: ret.index,
            tileChar: tileChar
          };
        } else {
          this.human_.tilesBeingMoved[indexOnRack] = undefined;
        }
        tile.style.zIndex = 0;
        tile.className = 'tile letter';
        document.getElementById('humanRecallButton').disabled = false;
      }, context);})(this, i, tiles.charAt(i)));

    utils.bind(tile, 'touchmove', (function(tile) {
      return function(evt) {
        if (evt.touches.length == 1) {
          var touch = evt.touches[0];
          tile.style.position = 'fixed';
          tile.style.zIndex = 10;  // So that the tile floats above other elements.
          tile.style.left = touch.clientX;
          tile.style.top = touch.clientY;
        }
      };})(tile));
  }
};

game.prototype.animateScoreCounter_ = function(
    score, nodeId, playerName) {
  var callback = (function() {
    var scoreStr = document.getElementById(nodeId).innerHTML;
    scoreStr = scoreStr.split(':');
    if (scoreStr.length == 2) {
      var startScore = Number(scoreStr[1]);
    } else {
      startScore = 0;
    }
    var scoreCounter = startScore;
    if (score < 0) {
      score = 0;
    }

    return function() {
      document.getElementById(nodeId).innerHTML =
          playerName + ': ' + scoreCounter;
      if (scoreCounter >= startScore + score) {
        window.clearInterval(timerId);
      }
      ++scoreCounter;
    };
  })();
  var timerId = window.setInterval(callback, 100);
};

game.prototype.displayEndOfGameMessage_ = function(humanWon) {
  if (this.human_.scoreSoFar > this.aiPlayers_[0].scoreSoFar_) {
    alert('You win!');
  } else if (this.human_.scoreSoFar < this.aiPlayers_[0].scoreSoFar_) {
    alert('Machine wins!');
  } else {
    alert('Game ends in a draw!');
  }
};

game.prototype.readDictionary_ = function(words) {
  var startTime = (new Date()).getTime();
  for (var i = 0; i < words.length; ++i) {
    this.dictionary_.add(words[i]);
  }
  var endTime = (new Date()).getTime();
  stats.getSingleton().incTime('trieInit', endTime - startTime);
};

game.prototype.initBoard_ = function() {
/*
  return '' +
      '# # # # # # # # # # # # # # # # #' +
      '# 4 . . 1 . . . 4 . . . 1 . . 4 #' +
      '# . 3 . . . 2 . . . 2 . . . 3 . #' +
      '# . . 3 . . . 1 . 1 . . . 3 . . #' +
      '# 1 . . 3 . . . C . . . 3 . . 1 #' +
      '# . . . . 3 . . Y . . 3 . . . . #' +
      '# . 2 . . . 2 . G . 2 . . . 2 . #' +
      '# . . 1 . . . 1 N 1 . . . 1 . . #' +
      '# 4 . . 1 . . W E A . . 1 . . 4 #' +
      '# . . 1 . . . 1 T 1 . . . 1 . . #' +
      '# . 2 . . . 2 . S E T . . . 2 . #' +
      '# . . . . 3 . . . . . 3 . . . . #' +
      '# 1 . . 3 . . . 1 . . . 3 . . 1 #' +
      '# . . 3 . . . 1 . 1 . . . 3 . . #' +
      '# . 3 . . . 2 . . . 2 . . . 3 . #' +
      '# 4 . . 1 . . . 4 . . . 1 . . 4 #' +
      '# # # # # # # # # # # # # # # # #';
*/
  return '' +
      '# # # # # # # # # # # # # # # # #' +
      '# 4 . . 1 . . . 4 . . . 1 . . 4 #' +
      '# . 3 . . . 2 . . . 2 . . . 3 . #' +
      '# . . 3 . . . 1 . 1 . . . 3 . . #' +
      '# 1 . . 3 . . . 1 . . . 3 . . 1 #' +
      '# . . . . 3 . . . . . 3 . . . . #' +
      '# . 2 . . . 2 . . . 2 . . . 2 . #' +
      '# . . 1 . . . 1 . 1 . . . 1 . . #' +
      '# 4 . . 1 . . . 3 . . . 1 . . 4 #' +
      '# . . 1 . . . 1 . 1 . . . 1 . . #' +
      '# . 2 . . . 2 . . . 2 . . . 2 . #' +
      '# . . . . 3 . . . . . 3 . . . . #' +
      '# 1 . . 3 . . . 1 . . . 3 . . 1 #' +
      '# . . 3 . . . 1 . 1 . . . 3 . . #' +
      '# . 3 . . . 2 . . . 2 . . . 3 . #' +
      '# 4 . . 1 . . . 4 . . . 1 . . 4 #' +
      '# # # # # # # # # # # # # # # # #';
};

window['game'] = game

