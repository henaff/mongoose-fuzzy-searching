import {
  ArticleModel,
  UserModel,
} from './models'

export async function test() {
  /*const term = '2020';
  console.log({ term })
  const res = await ArticleModel.fuzzySearch(term)
    .then(docs => {
      return docs.map(doc => {
        return  new Object({
          title: doc.title,
          content: doc.content,
          user: doc.fuzzyMeta.user.displayName,
          confidenceScore: doc._doc.confidenceScore,
        })
      })
    });
  console.log(res)*/
  await UserModel.updateOne(
    { 'profile.displayName': 'Science Click' },
    { $set: { 'profile.displayName': 'Science Clicks' } },
  ).exec()

  await ArticleModel.updateOne(
    { 'title': 'Mediaclasse raconte Gargantua de Rabelais' },
    { $set: { 'title': 'Mediaclasse raconte Gargantua de Strasbourg' } },
  )
}

export default test