
import {
  articleMocks,
  userMocks,
} from './mocks'

import {
  ArticleModel,
  UserModel,
} from './models'

export function fill() {
  return Promise.all([
    ArticleModel.deleteMany({}),
    UserModel.deleteMany({}),
  ])
    .then(() => Promise.all(userMocks.map(
      (user, index) => UserModel
        .create(user)
        .then(doc => ArticleModel.create({
          user: doc._id,
          ...articleMocks[index],
        })),
    )))
}

export default fill