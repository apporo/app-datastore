'use strict';

module.exports = [
  {
    name: 'InfoModel',
    descriptor: {
      name: {type: String, require: true, unique: true},
      label: {type: String, require: true},
      selected: { type: Boolean }
    },
    options: {
      collection: 'info'
    }
  }
]