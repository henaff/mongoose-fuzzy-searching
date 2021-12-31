/**
 * Connect to localhost mongoose
 */
import mongoose from 'mongoose'

export function connect() {
  return new Promise(
    (resolve, reject) => mongoose.connect('mongodb://localhost:27017/fuzzy-meta-test', {
      // useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  )
}

export default connect
