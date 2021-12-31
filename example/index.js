
import connect from './src/connect'
import fill from './src/fill'
import test from './src/test'

connect()
  .then(() => console.log('Connected to database'))
  .then(() => fill())
  .then(() => console.log('Database filled'))
  .then(() => test())
  .then(() => console.log('Test passed'))