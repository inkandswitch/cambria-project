import assert from 'assert'
import { JSONSchema7 } from 'json-schema'
import { updateSchema } from '../src/json-schema'
import {
  addProperty,
  inside,
  map,
  headProperty,
  wrapProperty,
  hoistProperty,
  plungeProperty,
  renameProperty,
  convertValue,
} from '../src/helpers'

describe('transforming a json schema', () => {
  const v1Schema = {
    $schema: 'http://json-schema.org/draft-07/schema',
    type: 'object',
    title: 'ProjectDoc',
    description: 'An Arthropod project with some tasks',
    additionalProperties: false,
    $id: 'ProjectV1',
    properties: {
      name: {
        type: 'string',
        default: '',
      },
      summary: {
        type: 'string',
        default: '',
      },
    },
    required: ['name', 'summary'],
  } as JSONSchema7 // need to convince typescript this is valid json schema

  describe('addProperty', () => {
    it('adds the property', () => {
      const newSchema = updateSchema(v1Schema, [
        addProperty({ destination: 'description', type: 'string' }),
      ])

      assert.deepEqual(newSchema.properties, {
        ...v1Schema.properties,
        description: { type: 'string', default: '' },
      })
    })

    it('uses default value if provided', () => {
      const newSchema = updateSchema(v1Schema, [
        addProperty({ destination: 'description', type: 'string', default: 'hi' }),
      ])

      assert.deepEqual(newSchema.properties, {
        ...v1Schema.properties,
        description: { type: 'string', default: 'hi' },
      })
    })

    it('sets field as required', () => {
      const newSchema = updateSchema(v1Schema, [
        addProperty({ destination: 'description', type: 'string', required: true }),
      ])

      assert.deepEqual(newSchema.properties, {
        ...v1Schema.properties,
        description: { type: 'string', default: '' },
      })

      assert.deepEqual(newSchema.required, [...(v1Schema.required || []), 'description'])
    })
  })

  describe('renameProperty', () => {
    const newSchema = updateSchema(v1Schema, [renameProperty('name', 'title')])

    it('adds a new property and removes the old property', () => {
      assert.deepEqual(newSchema.properties, {
        title: {
          type: 'string',
          default: '',
        },
        summary: {
          type: 'string',
          default: '',
        },
      })
    })

    it('removes the old property from required array', () => {
      assert.equal(newSchema.required?.indexOf('name'), -1)
    })
  })

  describe('convertValue', () => {
    it('changes the type on the existing property', () => {
      const newSchema = updateSchema(v1Schema, [
        convertValue(
          'summary',
          [
            { todo: false, inProgress: false, done: true },
            { false: 'todo', true: 'done' },
          ],
          'string',
          'boolean'
        ),
      ])

      assert.deepEqual(newSchema.properties, {
        name: {
          type: 'string',
          default: '',
        },
        summary: {
          type: 'boolean',
          default: false,
        },
      })
    })

    it("doesn't update the schema when there's no type change", () => {
      const newSchema = updateSchema(v1Schema, [
        convertValue('summary', [{ something: 'another' }, { another: 'something' }]),
      ])

      assert.deepEqual(newSchema, v1Schema)
    })
  })

  describe('inside', () => {
    it('adds new properties inside a key', () => {
      const newSchema = updateSchema(v1Schema, [
        addProperty({ destination: 'metadata', type: 'object' }),
        inside('metadata', [
          addProperty({ destination: 'createdAt', type: 'number' }),
          addProperty({ destination: 'updatedAt', type: 'number' }),
        ]),
      ])

      assert.deepEqual(newSchema.properties, {
        ...v1Schema.properties,
        metadata: {
          type: 'object',
          default: {},
          properties: {
            createdAt: {
              type: 'number',
              default: 0,
            },
            updatedAt: {
              type: 'number',
              default: 0,
            },
          },
          required: ['createdAt', 'updatedAt'],
        },
      })
    })

    it('renames properties inside a key', () => {
      const newSchema = updateSchema(v1Schema, [
        addProperty({ destination: 'metadata', type: 'object' }),
        inside('metadata', [
          addProperty({ destination: 'createdAt', type: 'number' }),
          renameProperty('createdAt', 'created'),
        ]),
      ])

      assert.deepEqual(newSchema.properties, {
        name: {
          type: 'string',
          default: '',
        },
        summary: {
          type: 'string',
          default: '',
        },
        metadata: {
          type: 'object',
          default: {},
          properties: {
            created: {
              type: 'number',
              default: 0,
            },
          },
          required: ['created'],
        },
      })
    })
  })

  describe('map', () => {
    it('adds new properties inside an array', () => {
      const newSchema = updateSchema(v1Schema, [
        addProperty({ destination: 'tasks', type: 'array', arrayItemType: 'object' }),
        inside('tasks', [
          map([
            addProperty({ destination: 'name', type: 'string' }),
            addProperty({ destination: 'description', type: 'string' }),
          ]),
        ]),
      ])

      assert.deepEqual(newSchema.properties, {
        ...v1Schema.properties,
        tasks: {
          type: 'array',
          default: [],
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                default: '',
              },
              description: {
                type: 'string',
                default: '',
              },
            },
            required: ['name', 'description'],
          },
        },
      })
    })

    it('renames properties inside an array', () => {
      const newSchema = updateSchema(v1Schema, [
        addProperty({ destination: 'tasks', type: 'array', arrayItemType: 'object' }),
        inside('tasks', [
          map([
            addProperty({ destination: 'name', type: 'string' }),
            renameProperty('name', 'title'),
          ]),
        ]),
      ])

      assert.deepEqual(newSchema.properties, {
        ...v1Schema.properties,
        tasks: {
          type: 'array',
          default: [],
          items: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                default: '',
              },
            },
            required: ['title'],
          },
        },
      })
    })
  })

  describe('wrapProperty', () => {
    it('can wrap a scalar into an array', () => {
      const newSchema = updateSchema(v1Schema, [
        addProperty({ destination: 'assignees', type: 'array', arrayItemType: 'string' }),
        headProperty('assignees'),
      ])

      assert.deepEqual(newSchema.properties, {
        ...v1Schema.properties,
        assignees: { type: 'string', default: '' },
      })
    })
  })

  describe('headProperty', () => {
    it('can turn an array into a scalar', () => {
      const newSchema = updateSchema(v1Schema, [
        addProperty({ destination: 'assignee', type: 'string' }),
        wrapProperty('assignee'),
      ])

      assert.deepEqual(newSchema.properties, {
        ...v1Schema.properties,
        assignee: {
          type: 'array',
          default: [],
          items: {
            type: 'string',
          },
        },
      })
    })
  })

  describe('hoistProperty', () => {
    it('hoists the property up in the schema', () => {
      const newSchema = updateSchema(v1Schema, [
        addProperty({ destination: 'metadata', type: 'object' }),
        inside('metadata', [
          addProperty({ destination: 'createdAt', type: 'number' }),
          addProperty({ destination: 'editedAt', type: 'number' }),
        ]),
        hoistProperty('metadata', 'createdAt'),
      ])

      assert.deepEqual(newSchema.properties, {
        ...v1Schema.properties,
        metadata: {
          type: 'object',
          default: {},
          properties: {
            editedAt: {
              type: 'number',
              default: 0,
            },
          },
          required: ['editedAt'],
        },
        createdAt: {
          type: 'number',
          default: 0,
        },
      })
    })
  })

  describe('plungeProperty', () => {
    it('plunges the property down in the schema', () => {
      // move the existing summary down into a metadata object
      const newSchema = updateSchema(v1Schema, [
        addProperty({ destination: 'metadata', type: 'object' }),
        inside('metadata', [
          addProperty({ destination: 'createdAt', type: 'number' }),
          addProperty({ destination: 'editedAt', type: 'number' }),
        ]),
        plungeProperty('metadata', 'summary'),
      ])

      assert.deepEqual(newSchema.properties, {
        name: v1Schema.properties?.name,
        metadata: {
          type: 'object',
          default: {},
          properties: {
            createdAt: {
              type: 'number',
              default: 0,
            },
            editedAt: {
              type: 'number',
              default: 0,
            },
            summary: {
              type: 'string',
              default: '',
            },
          },
          required: ['createdAt', 'editedAt', 'summary'],
        },
      })
    })
  })
})
