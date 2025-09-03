const { loadSelectors, finalizeHealingReport } = require('./healing');

function healingPlugin(on, config) {
  on('before:run', () => { loadSelectors(); });
  on('after:run', () => { finalizeHealingReport(); });
  return config;
}
module.exports = healingPlugin;