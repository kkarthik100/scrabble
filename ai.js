import bag from './bag.js';
import board from './board.js';
import stats from './stats.js';
import trie from './trie.js';
import utils from './utils.js';

let ai = function(board, dictionary) {
  this.board_ = board;
  this.dictionary_ = dictionary;
  this.tiles_ = '';
  this.scoreSoFar_ = 0;
};

ai.prototype.removeTilesAndRefreshFromBag = function(tilesPlayed) {
  this.tiles_ = utils.difference(this.tiles_, tilesPlayed);
  this.tiles_ += bag.getSingleton().pick(7 - this.tiles_.length);
};

ai.prototype.calculateWordLengthBounds_ = function(index) {
  // Horizontal.
  var minLengthHorizontal = 0;
  var maxLengthHorizontal = 0;
  if (this.board_.isLetter(index - 1)) {
    minLengthHorizontal = 1;
  }
  for (var i = index, tiles = 0; i < (Math.floor(index / 17) + 1) * 17 - 1;
       ++i) {
    if (minLengthHorizontal == 0) {
      // If we have a letter above, below, or to the right...
      if (this.board_.isLetter(i - 17) ||
          this.board_.isLetter(i + 17) ||
          this.board_.isLetter(i + 1)) {
        ++tiles;
        minLengthHorizontal = tiles;
        maxLengthHorizontal = minLengthHorizontal;
        continue;
      }
    }
    if (this.board_.isLetter(i)) {
      continue;
    }
    ++tiles;
    ++maxLengthHorizontal;
    if (tiles == this.tiles_.length) {
      break;
    }
  }
  if (minLengthHorizontal == 0) {
    maxLengthHorizontal = 0;
  }

  // Vertical.
  var minLengthVertical = 0;
  var maxLengthVertical = 0;
  if (this.board_.isLetter(index - 17)) {
    minLengthVertical = 1;
  }
  for (var i = index, tiles = 0; i < 17 * 16; i += 17) {
    if (minLengthVertical == 0) {
      // If we have a letter to the left, right or below...
      if (this.board_.isLetter(i - 1) ||
          this.board_.isLetter(i + 1) ||
          this.board_.isLetter(i + 17)) {
        ++tiles;
        minLengthVertical = tiles;
        maxLengthVertical = minLengthVertical;
        continue;
      }
    }
    if (this.board_.isLetter(i)) {
      continue;
    }
    ++tiles;
    ++maxLengthVertical;
    if (tiles == this.tiles_.length) {
      break;
    }
  }
  if (minLengthVertical == 0) {
    maxLengthVertical = 0;
  }

/*
  var bounds = {};
  bounds.minLengthHorizontal = minLengthHorizontal;
  bounds.maxLengthHorizontal = maxLengthHorizontal;
  bounds.minLengthVertical = minLengthVertical;
  bounds.maxLengthVertical = maxLengthVertical;

  return bounds;
*/
  return {
    'minLengthHorizontal': minLengthHorizontal,
    'maxLengthHorizontal': maxLengthHorizontal,
    'minLengthVertical': minLengthVertical,
    'maxLengthVertical': maxLengthVertical
  };
};

ai.prototype.allPossiblePermuationsToConsider_ =
    function(str, min, max) {
  let trieObj = new trie();
  var powerSet = this.powerSet_(str, min, max);
  for (var i = 0; i < powerSet.length; ++i) {
    var permutations = this.permutations_(powerSet[i]);
    for (var j = 0; j < permutations.length; ++j) {
      trieObj.add(permutations[j]);
    }
  }
  return trieObj;
};

ai.prototype.powerSet_ = function(str, min, max) {
  var powerSet = [];
  this.powerSetImpl_(powerSet, '', '', str, 0, min, max);
  return powerSet;
};

ai.prototype.powerSetImpl_ = function(
    powerSet, prefixStr, prefixCallHistoryStr, str, index, min, max) {
  if (index == str.length) {
    if (prefixStr.length >= min && prefixStr.length <= max) {
      powerSet.push(prefixStr);
    }
    return;
  }

  var curChar = str.charAt(index);
  for (var i = 0, charRepeats = false; i < index; ++i) {
    if (curChar == str.charAt(i)) {
      charRepeats = true;
      var lastCall = prefixCallHistoryStr.charAt(i) == '1';
    }
  }

  // Make a recursive call skipping the current character.
  this.powerSetImpl_(powerSet, prefixStr, prefixCallHistoryStr + '0',
                     str, index + 1, min, max);

  // Maybe make a recursive call including the current character.
  if (charRepeats) {
    if (lastCall) {
      this.powerSetImpl_(powerSet, prefixStr + curChar,
                         prefixCallHistoryStr + '1', str, index + 1, min, max);
    }
  } else {
    this.powerSetImpl_(powerSet, prefixStr + curChar,
                       prefixCallHistoryStr + '1', str, index + 1, min, max);
  }
};

ai.prototype.permutations_ = function(str) {
  var permutations = [];
  this.permutationsImpl_(permutations, '', str);
  return permutations;
};

ai.prototype.permutationsImpl_ = function(result, prefix, str) {
  if (str.length == 0) {
    result.push(prefix);
    return;
  }

  for (var i = 0; i < str.length; ++i) {
    for (var j = 0, found = false; j < i; ++j) {
      if (str.charAt(i) == str.charAt(j)) {
        found = true;
        break;
      }
    }
    if (found) {
      continue;
    }

    // Create a new string by removing the i-th character.
    // Should probably use String.splice(), or some built-in function?
    var newStr = '';
    for (var j = 0; j < str.length; ++j) {
      if (i != j) {
        newStr += str.charAt(j);
      }
    }

    this.permutationsImpl_(result, prefix + str.charAt(i), newStr);
  }
};

ai.prototype.computeBestMove = function() {
  // For each square not occupied by a letter:
  //   - Calculate all possible strings playable from that position.
  //   - Test which of these strings form legal words in that position.
  //   - For every legal word, compute the score and store in a list.
  //   - The "best move" is the one with the maximum score.
  //
  // This is a simplistic algorithm that does not consider rack distributions
  // and other nuances of advanced play. But it should be sufficient to play
  // a very decent game of scrabble.

  var bestMove = {
    horizontal: false,
    index: -1,
    score: -1,
    tiles: '',
    word: ''
  };

  // Build a trie that contains all possible words that are constructible,
  // from the current tiles the AI player has.
  var permutationsTrie = this.allPossiblePermuationsToConsider_(
    this.tiles_, 1, 7);

  for (var i = 1; i < 16; ++i) {
    for (var j = 1; j < 16; ++j) {
      var index = i * 17 + j;
      if (this.board_.isLetter(index)) {
        continue;
      }

      var bounds = this.calculateWordLengthBounds_(index);

      // No move is possible either in the horizontal or the vertical
      // direction, as we cannot connect with any letter on the board,
      // from this position.
      if (bounds['minLengthHorizontal'] == 0 &&
          bounds['maxLengthHorizontal'] == 0 &&
          bounds['minLengthVertical'] == 0 &&
          bounds['maxLengthVertical'] == 0) {
        continue;
      }

      var ret = this.computeBestScoreAt_(permutationsTrie, index, bounds);

      if (ret.score > bestMove.score) {
        bestMove.horizontal = ret.horizontal;
        bestMove.index = index;
        bestMove.score = ret.score;
        bestMove.tiles = ret.tiles;
        bestMove.word = ret.word;
      }
    }
  }

  this.scoreSoFar_ += bestMove.score;
  return bestMove;
};

ai.prototype.computeBestScoreAt_ = function(
    permutationsTrie, index, bounds) {
  var horizWord = {
    horizontal: true,
    score: -1,
    tiles: '',
    word: ''
  };
  var vertWord = {
    horizontal: false,
    score: -1,
    tiles: '',
    word: ''
  };

  var minLength = bounds['minLengthHorizontal'];
  var maxLength = bounds['maxLengthHorizontal'];
  var prefix = this.board_.computePrefix(index, true);
  this.computeBestScoreAtImpl_(
      permutationsTrie.trie_,
      '',
      index,
      true,
      prefix,
      horizWord,
      0,
      minLength,
      maxLength);

  minLength = bounds['minLengthVertical'];
  maxLength = bounds['maxLengthVertical'];
  prefix = this.board_.computePrefix(index, false);
  this.computeBestScoreAtImpl_(
      permutationsTrie.trie_,
      '',
      index,
      false,
      prefix,
      vertWord,
      0,
      minLength,
      maxLength);

  return horizWord.score >= vertWord.score ? horizWord : vertWord;
};

ai.prototype.computeBestScoreAtImpl_ = function(
    trieNode, trieNodePrefix, index, horizontal, prefix, bestWord,
    depth, minLength, maxLength) {
  for (var ch in trieNode) {
    if (trieNode.hasOwnProperty(ch)) {
      if (depth >= minLength) {
        if (ch == '#') {
          var ret = this.tryStrAt_(index, horizontal, prefix, trieNodePrefix);
          if (ret.status == trie.WORD_NOT_FOUND) {
            if (ret.longestValidPrefix &&
                (ret.longestValidPrefix.length - prefix.length < depth - 1)) {
              return ret;
            }
          } else {
            var score = this.board_.computeScore(
                index, trieNodePrefix, horizontal);

            // If all 7 tiles were used, add an extra 50 points. This is
            // called a "Bingo" in scrabble lingo.
            if (score > 0 && trieNodePrefix.length == 7) {
              score += 50;
            }

            if (score > bestWord.score) {
              bestWord.score = score;
              bestWord.tiles = trieNodePrefix;
              bestWord.word = ret.word;
            }
          }
          if (depth > maxLength) {
            return ret;
          } else {
            continue;
          }
        }
      }

      if (depth < maxLength) {
        ret = this.computeBestScoreAtImpl_(
            trieNode[ch], trieNodePrefix + ch, index, horizontal, prefix,
            bestWord, depth + 1, minLength, maxLength);
        if (ret && ret.status == trie.WORD_NOT_FOUND) {
          if (ret.longestValidPrefix &&
              (ret.longestValidPrefix.length - prefix.length < depth)) {
            return ret;
          }
        }
      }
    }
  }
};

ai.prototype.tryStrAt_ = function(index, horizontal, prefix, str) {
  var offset = horizontal ? 1 : 17;
  var word = prefix;

  for (var i  = 0, pos = index; i < str.length; ++i, pos += offset) {
    // Skip squares that are filled.
    while (this.board_.isLetter(pos)) {
      word += this.board_.charAt(pos);
      pos += offset;
    }
    word += str.charAt(i);
  }

  // Append any suffix, if one exists.
  while (this.board_.isLetter(pos)) {
    word += this.board_.charAt(pos);
    pos += offset;
  }

  return this.dictionary_.lookup(word);
};

export default ai;

