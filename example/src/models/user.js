/**
 * User model
 */
import mongoose from 'mongoose'
import mongooseFuzzySearching from '../../../'
import util from 'util'

import ArticleModel from './article'
import { ModelLink } from '../utils'



let schema = new mongoose.Schema({
  email: String,
  profile: {
    displayName: String,
    firstName: String,
    lastName: String,
  },

  fuzzyMeta: {
    articles: {
      type: [{
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Article',
        },
        title: String,
        content: String,
      }],
      default: [],
    }
  }
}, { timestamps: true })


schema.pre([
  'save',
  'update',
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
],
{ document: true, query: true },
async function (next) {
  const links = [
    await new ModelLink(UserModel, {
      model: ArticleModel,
      foreignField: 'user',
    })
      .field('profile.displayName', 'fuzzyMeta.user.displayName')
      .field('profile.firstName', 'fuzzyMeta.user.firstName')
      .field('profile.lastName', 'fuzzyMeta.user.lastName')
      .loadDocument(this),
  ]
  
  await Promise.all(links.map(link => link.update(this)))

  next()
})



schema.plugin(mongooseFuzzySearching, {
  fields: [
    {
      name: 'profile',
      keys: [ 'displayName', 'firstName', 'lastName' ],
    },
    {
      name: 'fuzzyMeta.articles',
      keys: [ 'title', 'content' ],
      array: true,
    }
  ],
})



export const UserModel = mongoose.model('User', schema)
export default UserModel
