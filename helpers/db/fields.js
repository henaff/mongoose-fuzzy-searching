const dot = require('dot-object');
const dotProp = require('dot-prop');

class Create {
  constructor(schema, Type, addToSchema, addArrayToSchema) {
    this.indexes = {};
    this.weights = {};
    this.schema = schema;
    this.Type = Type;
    this.addToSchema = addToSchema;
    this.addArrayToSchema = addArrayToSchema;
  }

  fromString(item) {
    this.schema.add(this.addToSchema(item));
    this.indexes[`${item}_fuzzy`] = 'text';
  }

  fromObject(item) {
    this.schema.add(this.addToSchema(item.name));
    this.indexes[`${item.name}_fuzzy`] = 'text';
    if (item.weight) {
      this.weights[`${item.name}_fuzzy`] = item.weight;
    }
  }

  fromObjectKeys(item) {
    item.keys.forEach((key) => {
      this.indexes[`${item.name}_fuzzy.${key}_fuzzy`] = 'text';
      if (!item.array) this.schema.add(this.addToSchema(`${item.name}_fuzzy.${key}`));
    });
    if (item.array) this.schema.add(this.addArrayToSchema(this.Type)(item.name));
  }
}

class Remove {
  constructor(schema) {
    this.schema = schema;
  }

  fromString(item) {
    delete this.schema[`${item}_fuzzy`];
  }

  fromObject(item) {
    delete this.schema[`${item.name}_fuzzy`];
  }

  fromObjectKeys(item) {
    delete this.schema[`${item.name}_fuzzy`];
  }
}

class Generate {
  constructor(attributes, makeNGrams) {
    this.attributes = attributes;
    this.makeNGrams = makeNGrams;
  }

  fromString(item) {
    let value = this.attributes[item];
    if (value) {
      if (Array.isArray(value)) {
        value = value.join(' ');
      }

      this.attributes[`${item}_fuzzy`] = this.makeNGrams(value);
    }
  }

  fromObject(item) {
    let value = this.attributes[`${item.name}`];
    if (value) {
      const escapeSpecialCharacters = item.escapeSpecialCharacters !== false;

      if (Array.isArray(value)) {
        value = value.join(' ');
      }

      this.attributes[`${item.name}_fuzzy`] = this.makeNGrams(
        value,
        escapeSpecialCharacters,
        item.minSize,
        item.prefixOnly,
      );
    }
  }

  fromObjectKeys(item) {
    if (dot.pick(item.name, this.attributes)) {
      const escapeSpecialCharacters = item.escapeSpecialCharacters !== false;
      const attrs = [];
      let obj = {};

      let data = dot.pick(item.name, this.attributes);
      if (!Array.isArray(data)) {
        data = [data];
      }

      data.forEach((d) => {
        item.keys.forEach((key) => {
          obj = {
            ...obj,
            [`${key}_fuzzy`]: this.makeNGrams(
              dot.pick(key, d),
              escapeSpecialCharacters,
              item.minSize,
              item.prefixOnly,
            ),
          };
        });
        attrs.push(obj);
      });
      if (item.array === true) {
        dotProp.set(this.attributes, `${item.name}_fuzzy`, attrs);
      } else {
        dotProp.set(this.attributes, `${item.name}_fuzzy`, attrs[0]);
      }
    } else {
      const arrayUpdateOperators = [
        '$push',
        '$pull',
        '$addToSet',
        '$pop',
        '$pullAll',
        '$pushAll',
        '$each',
      ];
      arrayUpdateOperators.forEach((operator) => {
        if (this.attributes[operator] && this.attributes[operator][item.name]) {
          const escapeSpecialCharacters = item.escapeSpecialCharacters !== false;
          const attrs = [];
          let obj = {};
          let data = this.attributes[operator][item.name];
          if (!Array.isArray(data)) {
            data = [data];
          }
          data.forEach((d) => {
            item.keys.forEach((key) => {
              obj = {
                ...obj,
                [`${key}_fuzzy`]: this.makeNGrams(
                  dot.pick(key, d),
                  escapeSpecialCharacters,
                  item.minSize,
                  item.prefixOnly,
                ),
              };
            });
            attrs.push(obj);
          });
          // eslint-disable-next-line prefer-destructuring
          this.attributes[operator][`${item.name}_fuzzy`] = item.array === true ? attrs : attrs[0];
        }
      });
      const updateOperators = ['$set', '$unset', '$inc', '$mul'];
      updateOperators.forEach((operator) => {
        if (this.attributes[operator] && this.attributes[operator][item.name]) {
          const escapeSpecialCharacters = item.escapeSpecialCharacters !== false;
          const attrs = [];
          let obj = {};
          let data = this.attributes[operator][item.name];
          if (!Array.isArray(data)) {
            data = [data];
          }
          data.forEach((d) => {
            item.keys.forEach((key) => {
              obj = {
                ...obj,
                [`${key}_fuzzy`]: this.makeNGrams(
                  dot.pick(key, d),
                  escapeSpecialCharacters,
                  item.minSize,
                  item.prefixOnly,
                ),
              };
            });
            attrs.push(obj);
          });
          // eslint-disable-next-line prefer-destructuring
          this.attributes[operator][`${item.name}_fuzzy`] = item.array === true ? attrs : attrs[0];
        } else {
          item.keys.forEach((key) => {
            if (this.attributes[operator] && this.attributes[operator][`${item.name}.${key}`]) {
              const escapeSpecialCharacters = item.escapeSpecialCharacters !== false;
              let obj = {};
              let data = this.attributes[operator][`${item.name}.${key}`];
              if (!Array.isArray(data)) {
                data = [data];
              }
              data.forEach((d) => {
                obj = {
                  ...obj,
                  [`${key}_fuzzy`]: this.makeNGrams(
                    d,
                    escapeSpecialCharacters,
                    item.minSize,
                    item.prefixOnly,
                  ),
                };
              });
              // eslint-disable-next-line prefer-destructuring
              this.attributes[operator][`${item.name}_fuzzy.${key}_fuzzy`] = obj[`${key}_fuzzy`];
            } else if (
              this.attributes[operator] &&
              this.attributes[operator][`${item.name}.$.${key}`]
            ) {
              const escapeSpecialCharacters = item.escapeSpecialCharacters !== false;
              let obj = {};
              let data = this.attributes[operator][`${item.name}.$.${key}`];
              if (!Array.isArray(data)) {
                data = [data];
              }
              data.forEach((d) => {
                obj = {
                  ...obj,
                  [`${key}_fuzzy`]: this.makeNGrams(
                    d,
                    escapeSpecialCharacters,
                    item.minSize,
                    item.prefixOnly,
                  ),
                };
              });
              // eslint-disable-next-line prefer-destructuring
              this.attributes[operator][`${item.name}_fuzzy.$.${key}_fuzzy`] = obj[`${key}_fuzzy`];
            }
          });
        }
      });
    }
  }
}

const createByFieldType = (isString, isObject) => (obj) => (item) => {
  if (isString(item)) {
    obj.fromString(item);
    return;
  }

  if (!isObject(item)) {
    throw new TypeError('Fields items must be String or Object.');
  }

  if (item.keys) {
    obj.fromObjectKeys(item);
    return;
  }

  obj.fromObject(item);
};

/**
 * Add the fields to the collection
 * @param {object} schema - The mongoose schema
 * @param {array} fields - The fields to add to the collection
 */
const createFields =
  (addToSchema, addArrayToSchema, createField, MixedType) => (schema, fields) => {
    const create = new Create(schema, MixedType, addToSchema, addArrayToSchema);
    fields.forEach(createField(create));
    return { indexes: create.indexes, weights: create.weights };
  };

/**
 * Removes fuzzy keys from the document
 * @param {array} fields - the fields to remove
 */
const removeFuzzyElements = (createField) => (fields) => (_doc, ret) => {
  const remove = new Remove(ret);
  fields.forEach(createField(remove));
  return remove.schema;
};

/**
 * Creates nGrams for the documents
 * @param {object} attributes - Schema attributes
 * @param {array} fields
 */
const createNGrams = (makeNGrams, createField) => (attributes, fields) => {
  if (!attributes) {
    return;
  }
  const generate = new Generate(attributes, makeNGrams);
  fields.forEach(createField(generate));
};

module.exports = {
  createByFieldType,
  createFields,
  removeFuzzyElements,
  createNGrams,
};
