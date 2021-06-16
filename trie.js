import stats from './stats.js';

let trie = function() {
  this.trie_ = {};
};

trie.WORD_FOUND = 1;
trie.WORD_NOT_FOUND = 2;

trie.prototype.add = function(word) {
  word = word.toUpperCase();
  var obj = this.trie_;
  for (var i = 0; i < word.length; ++i) {
    var ch = word.charAt(i);
    if (!obj[ch]) {
      obj[ch] = {};
    }
    obj = obj[ch];
  }
  obj['#'] = true;
};

trie.prototype.lookup = function(word) {
  var startTime = (new Date()).getTime();
  var obj = this.trie_;
  for (var i = 0; i < word.length; ++i) {
    var ch = word.charAt(i);
    if (!obj[ch]) {
      return {
        longestValidPrefix: word.substring(0, i),
        status: trie.WORD_NOT_FOUND,
        word: word
      };
    }
    obj = obj[ch];
  }
  var endTime = (new Date()).getTime();
  stats.getSingleton().incTime('trieLookup', endTime - startTime);

  return obj['#'] ? { status: trie.WORD_FOUND,
                      word: word } :
                    { status: trie.WORD_NOT_FOUND,
                      word: word };
};

trie.prototype.print = function(maxDepth) {
  this.printImpl_(this.trie_, '', maxDepth);
};

trie.prototype.printImpl_ = function(obj, str, maxDepth) {
  if (obj['#']) {
    window.console.log(str);
  }

  if (str.length >= maxDepth) {
    return;
  }

  for (var p in obj) {
    if (obj.hasOwnProperty(p)) {
      this.printImpl_(obj[p], str + p, maxDepth);
    }
  }
};

trie.prototype.countChars = function() {
  return this.countCharsImpl_(this.trie_);
};

trie.prototype.countCharsImpl_ = function(obj) {
  var count = 0;
  for (var p in obj) {
    if (obj.hasOwnProperty(p)) {
      count++;
      count += this.countCharsImpl_(obj[p]);
    }
  }
  return count;
};

export default trie;

