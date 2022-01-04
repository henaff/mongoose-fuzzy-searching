import dot from 'dot-object'



export class ModelLink {

  constructor(
    fromModel,
    options,
  ) {
    this.fromModel = fromModel
    this.model = options?.model
    this.foreignField = options?.foreignField
    this.localField = options?.localField
    this.fields = options?.fields ?? {}
    this.array = options?.array ?? false
  }

  field(local, foreign) {
    this.fields[local] = foreign
    return this
  }

  hasModification(doc) {
    return this.fields && doc.isModified
      &&  Object
            .keys(this.fields)
            .some(field => doc.isModified(field))
  }

  hasUpdate(doc) {
    return this.fields && doc.getUpdate
      &&  Object
            .keys(this.fields)
            .some(field => doc.get(field))
  }

  isEdited(doc, field) {
    return this.hasModification(doc)
      ? doc.isModified(field)
      : doc.get(field)
  }

  async loadDocument(doc) {
    this._hasModification = this.hasModification(doc)
    this._hasUpdate = this.hasUpdate(doc)
    this._self = this._hasModification
      ? doc
      : await this.fromModel
          .findOne(doc._conditions)
          .select({
            _id: 1,
            [this.localField]: 1,
          })
          .exec()
    return this
  }
  
  async update(doc) {
    if (!this._hasModification && !this._hasUpdate)
      return

    if (this.array) {
      const qExists = { [`${this.foreignField}.$._id`]: this._self._id }
      const exists = await this.model.exists(qExists)
      console.log({
        qExists,
        exists,
      })
      const operator = exists ? '$set' : '$push'
      let operation = Object
        .entries(this.fields)
        .filter(([local, foreign]) => this.isEdited(doc, local))
      if (exists)
        operation = operation.reduce((acc, [local, foreign]) => {
          acc[foreign] = this._hasModification
            ? dot.pick(local, doc._doc)
            : doc.get(local)
          return acc
        }, qExists)
      else
        operation = operation.reduce((acc, [local, foreign]) => {
          foreign = foreign.split('.').reverse()[0]
          acc[this.foreignField][foreign] = this._hasModification
            ? dot.pick(local, doc._doc)
            : doc.get(local)
          return acc
        }, { [this.foreignField]: {} })
      const q = {
        _id: this._self[this.localField],
        ...(
          exists
            ? qExists
            : {}
        )
      }
      const update = { [operator]: operation }
      await this.model.updateMany(q, update).exec() // .then(console.log)
    } else {
      if (this.fields && this._self) {
        await this.model.updateMany({
          [this.foreignField]: this._self._id,
        }, {
          $set: Object
            .entries(this.fields)
            .filter(([local, foreign]) => this.isEdited(doc, local))
            .reduce((acc, [local, foreign]) => {
              acc[foreign] = this._hasModification
                ? dot.pick(local, doc._doc)
                : doc.get(local)
              return acc
            }, {})
        }).exec()
      }
    }
  }
}

export default ModelLink