var config = {};

config.main = {};

config.main.port = 8080;
config.main.db = 'mongodb://user:pass@server:port/collection';
config.main.getProgressInterval = 500;

module.exports = config;