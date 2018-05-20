var path = require('path');

module.exports = {
  application: {
    enabled: true
  },
  plugins: {
    appDatastore: {
      mappingStore: path.join(__dirname, '../lib/mappings/products')
    }
  },
  bridges: {
    mongoose: {
      application: {
        manipulator: {
          connection_options: {
            host: '127.0.0.1',
            port: '27017',
            name: 'test'
          }
        }
      }
    }
  }
};
