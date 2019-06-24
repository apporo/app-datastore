module.exports = {
  plugins: {
    appDatastore: {
      services: {
        dataManipulator: {
          methods: {
            find: { logging: {} },
            findOne: { logging: {} },
            get: { logging: {} },
            count: { logging: {} },
            create: { logging: {} },
            update: { logging: {} },
            delete: { logging: {} }
          }
        }
      }
    }
  },
  bridges: {
    mongoose: {
      appDatastore: {
        manipulator: {
          methods: {
            getConnection: {
              useDefaultTexture: true
            }
          }
        }
      }
    }
  }
}