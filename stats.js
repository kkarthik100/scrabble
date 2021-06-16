let stats = function() {
  this.stats_ = {};
};

stats.singleton_ = null;

stats.getSingleton = function() {
  if (!stats.singleton_) {
    stats.singleton_ = new stats();
  }
  return stats.singleton_;
};

stats.prototype.incTime = function(varName, val) {
  this.incVar_('time_' + varName, val);
};

stats.prototype.incCount = function(varName, opt_step) {
  this.incVar_('count_' + varName, opt_step ? opt_step : 1);
};

stats.prototype.allStatsToString = function() {
  return this.timeStatsToString() + '\n' + this.countStatsToString();
};

stats.prototype.timeStatsToString = function() {
  return this.statsWithPrefixToStr_('time_');
};

stats.prototype.countStatsToString = function() {
  return this.statsWithPrefixToStr_('count_');
};

stats.prototype.statsWithPrefixToStr_ = function(prefix) {
  var result = [];
  for (var stat in this.stats_) {
    if (this.stats_.hasOwnProperty(stat)) {
      if (stat.substring(0, prefix.length) == prefix) {
        if (prefix == 'time_') {
          result.push(stat.substring(prefix.length) + ': ' +
                      this.stats_[stat] / 1000 + ' seconds');
        } else {
          result.push(stat.substring(prefix.length) + ': ' + this.stats_[stat]);
        }
      }
    }
  }
  return result.join('\n');
};

stats.prototype.incVar_ = function(varName, val) {
  if (this.stats_[varName] === undefined) {
    this.stats_[varName] = 0;
  }
  this.stats_[varName] += val;
};

export default stats;

