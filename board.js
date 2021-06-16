import stats from './stats.js';
import trie from './trie.js';
import utils from './utils.js';

let board = function(dictionary) {
  this.board_ = [];
  this.dictionary_ = dictionary;
};

board.LETTER_SCORE = {
  'A': 1,
  'B': 3,
  'C': 3,
  'D': 2,
  'E': 1,
  'F': 4,
  'G': 2,
  'H': 4,
  'I': 1,
  'J': 8,
  'K': 5,
  'L': 1,
  'M': 3,
  'N': 1,
  'O': 1,
  'P': 3,
  'Q': 10,
  'R': 1,
  'S': 1,
  'T': 1,
  'U': 1,
  'V': 4,
  'W': 4,
  'X': 8,
  'Y': 4,
  'Z': 10,

  '1': 0,  // Double letter.
  '2': 0,  // Double word.
  '3': 0,  // Triple letter.
  '4': 0   // Triple word.
};

board.CENTER_TILE_INDEX = 144;

board.prototype.parseFromString = function(str) {
  for (var i = 0, j = 0; i < str.length; ++i) {
    if (str.charAt(i) == ' ') {
      continue;
    }
    this.board_[j++] = str.charAt(i);
    if (str.charAt(i) == '.' || str.charAt(i) == '*') {
      this.board_[j-1] = null;
    }
  }
};

board.prototype.printBoardToStr = function() {
  var board = '';
  for (var i = 1; i < 16; ++i) {
    for (var j = 0; j < 16; ++j) {
      var index = i * 17 + j;
      if (!this.board_[index]) {
        board += '. ';
      } else {
        board += this.board_[index] + ' ';
      }
    }
    board += '\n';
  }
  return board;
};

board.prototype.printBoardToHTML = function() {
  var board = document.getElementById('board');
  utils.removeAllChildren(board);

  for (var i = 1; i < 16; ++i) {
    for (var j = 1; j < 16; ++j) {
      var index = i * 17 + j;
      var tile = document.createElement('div');
      var cssClass = 'tile';

      if (this.isLetter(index)) {
        tile.innerHTML = this.getTileHTML(this.board_[index]);
        cssClass += ' letter';
      }

      var squareVal = this.board_[index];
      var displayText = '';
      var specialSquare = false;
      if (squareVal == '4') {  // Triple Word
        specialSquare = true;
        displayText = 'TW';
        cssClass += ' tw';
      } else if (squareVal == '3') {  // Double Word
        specialSquare = true;
        displayText = 'DW';
        cssClass += ' dw';
        if (index == 144) {
          cssClass += ' center-square';
        }
      } else if (squareVal == '2') {  // Triple Letter
        specialSquare = true;
        displayText = 'TL';
        cssClass += ' tl';
      } else if (squareVal == '1') {  // Double Letter
        specialSquare = true;
        displayText = 'DL';
        cssClass += ' dl';
      }
      if (specialSquare) {
        var label = document.createElement('div');
        label.innerHTML = displayText;
        label.className = 'special-square';
        tile.appendChild(label);
      }

      tile.className = cssClass;
      tile.style.top = (i - 1) * 40;
      tile.style.left = (j - 1) * 40;
      board.appendChild(tile);
    }
  }
};

board.prototype.charAt = function(index) {
  return this.board_[index] !== undefined ? this.board_[index] : '';
};

board.prototype.isLetter = function(index) {
  return this.board_[index] >= 'A' && this.board_[index] <= 'Z';
};

board.prototype.computePrefix = function(index, horizontal) {
  var prefix = '';
  var offset = horizontal ? 1 : 17;
  var prev = index - offset;

  while (this.isLetter(prev)) {
    prefix += this.board_[prev];
    prev -= offset;
  }

  return utils.reverse(prefix);
};

board.prototype.updateScoreAndMultiplier =
    function(ch, index, scoreObj) {
  var startTime = (new Date()).getTime();
  var letterScore = board.LETTER_SCORE[ch];
  scoreObj['score'] += letterScore;
  var squareVal = this.board_[index];
  if (squareVal == '4') {  // Triple Word
    scoreObj['scoreMultiplier'] *= 3;
  } else if (squareVal == '3') {  // Double Word
    scoreObj['scoreMultiplier'] *= 2;
  } else if (squareVal == '2') {  // Triple Letter
    scoreObj['score'] += (2 * letterScore);
  } else if (squareVal == '1') {  // Double Letter
    scoreObj['score'] += letterScore;
  }
  var endTime = (new Date()).getTime();
  stats.getSingleton().incTime(
      'updateScoreAndMultiplier', endTime - startTime);
};

board.prototype.makeMove = function(
    startSquare, horizontal, letters) {
  var ret = [];
  var inc = horizontal ? 1 : 17;
  for (var i  = 0, pos = startSquare; i < letters.length; ++i, pos += inc) {
    // Skip squares that are filled.
    while (this.isLetter(pos)) {
      pos += inc;
    }
    this.board_[pos] = letters.charAt(i);
    ret.push(pos);
  }
  return ret;
};

board.prototype.computeScore = function(
    index, str, isHorizontal) {
  var offset = isHorizontal ? 1 : 17;
  var totalScore = 0;
  var scoreObj = {
    'score': 0,
    'scoreMultiplier': 1,
    'word': ''
  };

  // Form a word in the "default" direction. This is the direction specified
  // by the "isHorizontal" arg.

  // Check for any possible prefix.
  var startTime = (new Date()).getTime();
  var prev = index - offset;
  while (this.isLetter(prev)) {
    var ch = this.board_[prev];
    var letterScore = board.LETTER_SCORE[ch];
    scoreObj['score'] += letterScore;
    scoreObj['word'] += ch;
    prev -= offset;
  }
  scoreObj['word'] = utils.reverse(scoreObj['word']);
  var endTime = (new Date()).getTime();
  stats.getSingleton().incTime('defaultDirPrefix', endTime - startTime);

  var i = 0;
  var curIndex = index;
  while (i < str.length) {
    if (this.isLetter(curIndex)) {
      ch = this.board_[curIndex];
      letterScore = board.LETTER_SCORE[ch];
      scoreObj['score'] += letterScore;
    } else {
      ch = str.charAt(i);
      this.updateScoreAndMultiplier(str.charAt(i), curIndex, scoreObj);
      ++i;
    }
    scoreObj['word'] += ch;
    curIndex += offset;
  }

  // Check for any possible suffix.
  while (this.isLetter(curIndex)) {
    var ch = this.board_[curIndex];
    var letterScore = board.LETTER_SCORE[ch];
    scoreObj['score'] += letterScore;
    scoreObj['word'] += ch;
    curIndex += offset;
  }

  totalScore += scoreObj['score'] * scoreObj['scoreMultiplier'];

  if (this.dictionary_.lookup(scoreObj['word']).status != trie.WORD_FOUND) {
    endTime = (new Date()).getTime();
    stats.getSingleton().incTime('defaultDirFail', endTime - startTime);
    return -1;
  }
  endTime = (new Date()).getTime();
  stats.getSingleton().incTime('defaultDirSuccess', endTime - startTime);

  // Check for all possible vertical words.
  startTime = (new Date()).getTime();
  i = 0;
  curIndex = index;
  while (i < str.length) {
    // Skip this square if it already has a letter.
    if (this.isLetter(curIndex)) {
      curIndex += offset;
      continue;
    }
    // Skip this square if there is no letter either above / left or
    // below / right.
    if (!this.isLetter(curIndex - (18 - offset)) &&
        !this.isLetter(curIndex + (18 - offset))) {
      curIndex += offset;
      ++i;
      continue;
    }

    // Get the fragment above / left of this square.
    scoreObj = {
      'score': 0,
      'scoreMultiplier': 1,
      'word': ''
    };
    prev = curIndex - (18 - offset);
    while (this.isLetter(prev)) {
      var ch = this.board_[prev];
      var letterScore = board.LETTER_SCORE[ch];
      scoreObj['score'] += letterScore;
      scoreObj['word'] += ch;
      prev -= (18 - offset);
    }
    scoreObj['word'] = utils.reverse(scoreObj['word']);

    // Place a tile on the current square.
    ch = str.charAt(i);
    this.updateScoreAndMultiplier(str.charAt(i), curIndex, scoreObj);
    scoreObj['word'] += ch;

    // Get the fragment below / right of this square.
    var next = curIndex + (18 - offset);
    while (this.isLetter(next)) {
      var ch = this.board_[next];
      var letterScore = board.LETTER_SCORE[ch];
      scoreObj['score'] += letterScore;
      scoreObj['word'] += ch;
      next += (18 - offset);
    }

    totalScore += scoreObj['score'] * scoreObj['scoreMultiplier'];

    if (this.dictionary_.lookup(scoreObj['word']).status !=
        trie.WORD_FOUND) {
      endTime = (new Date()).getTime();
      stats.getSingleton().incTime('oppositeDir', endTime - startTime);
      return -1;
    }

    curIndex += offset;
    ++i;
  }

  endTime = (new Date()).getTime();
  stats.getSingleton().incTime('oppositeDir', endTime - startTime);

  return totalScore;
};

board.prototype.getTileCoords = function(index) {
  var board = document.getElementById('board');
  var boardPos = utils.getDocumentCoords(board);
  var tileY = Math.floor(index / 17);
  var tileX = index % 17;

  return {
    x: boardPos.x + (tileX - 1) * 40,
    y: boardPos.y + (tileY - 1) * 40
  };
};

board.prototype.getSnapToGridTileIndex = function(tile) {
  var board = document.getElementById('board');
  var boardPos = utils.getDocumentCoords(board);
  var boardWidth = 15 * 40;
  var boardHeight = boardWidth;
  var tilePos = utils.getDocumentCoords(tile);
  var tileWidth = 40;
  var tileHeight = 40;

  if (tilePos.x + tileWidth <= boardPos.x ||
      tilePos.x >= boardPos.x + boardWidth ||
      tilePos.y + tileHeight <= boardPos.y ||
      tilePos.y >= boardPos.y + boardHeight) {
    return {
      success: false,
      index: -1
    };
  }

  return {
    success: true,
    x: boardPos.x + Math.round((tilePos.x - boardPos.x) / 40) * 40,
    y: boardPos.y + Math.round((tilePos.y - boardPos.y) / 40) * 40,
    index: (Math.round((tilePos.y - boardPos.y) / 40) + 1) * 17 +
           Math.round((tilePos.x - boardPos.x) / 40) + 1
  };
};

board.prototype.getTileHTML = function(tileChar) {
  var html = '<div style="margin-top:5px; margin-left:4px;">' +
                 '<span>' + tileChar + '</span>' +
                 '<span style="color:#ffffff;' +
                              'font-size:0.6em;' +
                              'vertical-align:sub;">' +
                     board.LETTER_SCORE[tileChar] +
                 '</span>' +
             '</div>';
  return html;
};

export default board;

