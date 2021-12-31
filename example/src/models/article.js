/**
 * Article model
 */
import mongoose from 'mongoose'
import mongooseFuzzySearching from '../../../'
import util from 'util'

import UserModel from './user'
import { ModelLink } from '../utils'



let schema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  title: String,
  content: String,

  fuzzyMeta: {
    user: {
      displayName: String,
      firstName: String,
      lastName: String,
    }
  }
}, { timestamps: true })



schema.pre([
  'save',
  'update',
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
], { document: true, query: true }, async function (next) {
  const links = [
    await new ModelLink(ArticleModel, {
      model: UserModel,
      foreignField: 'fuzzyMeta.articles',
      localField: 'user',
      array: true,
    })
      .field('_id', 'fuzzyMeta.articles.$._id')
      .field('title', 'fuzzyMeta.articles.$.title')
      .field('content', 'fuzzyMeta.articles.$.content')
      .loadDocument(this),
  ]

  await Promise.all(links.map(link => link.update(this)))

  if (this.isNew || (this.isModified && this.isModified('user'))) {
    const user = await UserModel.findById(this.user)
    if (user) {
      this.fuzzyMeta.user = {
        displayName: user.profile.displayName,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
      }
    }
  }

  next()
})



schema.plugin(mongooseFuzzySearching, {
  fields: [
    {
      name: 'title'
    },
    {
      name: 'content'
    },
    {
      name: 'fuzzyMeta.user',
      keys: [ 'displayName', 'firstName', 'lastName' ],
    }
  ],
})



export const ArticleModel = mongoose.model('Article', schema)
export default ArticleModel
