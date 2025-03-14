// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config')

// Add polyfill for os.availableParallelism
const os = require('os')
if (!os.availableParallelism) {
  os.availableParallelism = () => Math.max(os.cpus().length - 1, 1)
}

module.exports = (() => {
  const config = getDefaultConfig(__dirname)
  return config
})()
