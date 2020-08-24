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
        addProperty({ name: 'description', type: 'string' }),
      ])

      assert.deepEqual(newSchema.properties, {
        ...v1Schema.properties,
        description: { type: 'string', default: '' },
      })
    })

    it('supports nullable fields', () => {
      const newSchema = updateSchema(v1Schema, [
        addProperty({ name: 'description', type: ['string', 'null'] }),
      ])

      assert.deepEqual(newSchema.properties, {
        ...v1Schema.properties,
        description: { type: ['string', 'null'], default: null },
      })
    })

    it('uses default value if provided', () => {
      const newSchema = updateSchema(v1Schema, [
        addProperty({ name: 'description', type: 'string', default: 'hi' }),
      ])

      assert.deepEqual(newSchema.properties, {
        ...v1Schema.properties,
        description: { type: 'string', default: 'hi' },
      })
    })

    it('sets field as required', () => {
      const newSchema = updateSchema(v1Schema, [
        addProperty({ name: 'description', type: 'string', required: true }),
      ])

      assert.deepEqual(newSchema.properties, {
        ...v1Schema.properties,
        description: { type: 'string', default: '' },
      })

      assert.deepEqual(newSchema.required, [...(v1Schema.required || []), 'description'])
    })

    it('fails when presented with invalid data', () => {
      const badData: any = { garbage: 'input' }
      assert.throws(() => {
        updateSchema(v1Schema, [addProperty(badData)])
      }, `Missing property name in addProperty.\nFound:\n${JSON.stringify(badData)}`)
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

    it('fails when presented with invalid data', () => {
      const badData: any = { garbage: 'input' }
      assert.throws(() => {
        updateSchema(v1Schema, [addProperty(badData)])
      }, `Missing property destinationType in 'convert'.\nFound:\n${JSON.stringify(badData)}`)
    })
  })

  describe('inside', () => {
    it('adds new properties inside a key', () => {
      const newSchema = updateSchema(v1Schema, [
        addProperty({ name: 'metadata', type: 'object' }),
        inside('metadata', [
          addProperty({ name: 'createdAt', type: 'number' }),
          addProperty({ name: 'updatedAt', type: 'number' }),
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
        addProperty({ name: 'metadata', type: 'object' }),
        inside('metadata', [
          addProperty({ name: 'createdAt', type: 'number' }),
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
        addProperty({ name: 'tasks', type: 'array', items: { type: 'object' as const } }),
        inside('tasks', [
          map([
            addProperty({ name: 'name', type: 'string' }),
            addProperty({ name: 'description', type: 'string' }),
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
            default: {},
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
        addProperty({ name: 'tasks', type: 'array', items: { type: 'object' as const } }),
        inside('tasks', [
          map([addProperty({ name: 'name', type: 'string' }), renameProperty('name', 'title')]),
        ]),
      ])

      assert.deepEqual(newSchema.properties, {
        ...v1Schema.properties,
        tasks: {
          type: 'array',
          default: [],
          items: {
            type: 'object',
            default: {},
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

  describe('headProperty', () => {
    it('can turn an array into a scalar', () => {
      const newSchema = updateSchema(v1Schema, [
        addProperty({ name: 'assignees', type: 'array', items: { type: 'string' as const } }),
        headProperty('assignees'),
      ])

      // Really, the correct result would be:
      // { { type: 'null', type: 'string' }, default: 'Joe' } }
      // the behaviour you see below here doesn't really work with at least AJV
      // https://github.com/ajv-validator/ajv/issues/276
      assert.deepEqual(newSchema.properties, {
        ...v1Schema.properties,
        assignees: { anyOf: [{ type: 'null' }, { type: 'string', default: '' }] },
      })
    })

    it('can preserve schema information for an array of objects becoming a single object', () => {
      const newSchema = updateSchema(v1Schema, [
        addProperty({ name: 'assignees', type: 'array', items: { type: 'object' as const } }),
        inside('assignees', [map([addProperty({ name: 'name', type: 'string' })])]),
        headProperty('assignees'),
      ])

      const expectedSchema = {
        ...v1Schema.properties,
        assignees: {
          anyOf: [
            { type: 'null' },
            {
              type: 'object',
              default: {},
              properties: {
                name: { type: 'string', default: '' },
              },
              required: ['name'],
            },
          ],
        },
      }

      assert.deepEqual(newSchema.properties, expectedSchema)
    })
  })

  describe('wrapProperty', () => {
    it('can wrap a scalar into an array', () => {
      const newSchema = updateSchema(v1Schema, [
        addProperty({ name: 'assignee', type: ['string', 'null'] }),
        wrapProperty('assignee'),
      ])

      assert.deepEqual(newSchema.properties, {
        ...v1Schema.properties,
        assignee: {
          type: 'array',
          default: [],
          items: {
            type: 'string' as const,
            default: '',
          },
        },
      })
    })

    it.skip('can wrap an object into an array', () => {
      const newSchema = updateSchema(v1Schema, [
        addProperty({ name: 'assignee', type: ['object', 'null'] }),
        inside('assignee', [
          addProperty({ name: 'id', type: 'string' }),
          addProperty({ name: 'name', type: 'string' }),
        ]),
        wrapProperty('assignee'),
      ])

      assert.deepEqual(newSchema.properties, {
        ...v1Schema.properties,
        assignee: {
          type: 'array',
          default: [],
          items: {
            type: 'object' as const,
            properties: {
              name: { type: 'string', default: '' },
              id: { type: 'string', default: '' },
            },
          },
        },
      })
    })
  })

  describe('hoistProperty', () => {
    it('hoists the property up in the schema', () => {
      const newSchema = updateSchema(v1Schema, [
        addProperty({ name: 'metadata', type: 'object' }),
        inside('metadata', [
          addProperty({ name: 'createdAt', type: 'number' }),
          addProperty({ name: 'editedAt', type: 'number' }),
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

    it('hoists up an object with child properties', () => {
      // hoist up a details object out of metadata
      const newSchema = updateSchema(v1Schema, [
        addProperty({ name: 'metadata', type: 'object' }),
        inside('metadata', [
          addProperty({ name: 'details', type: 'object' }),
          inside('details', [addProperty({ name: 'title', type: 'string' })]),
        ]),
        hoistProperty('metadata', 'details'),
      ])

      assert.deepEqual(newSchema.properties, {
        ...v1Schema.properties,
        metadata: {
          type: 'object',
          default: {},
          properties: {},
          required: [],
        },
        details: {
          type: 'object',
          default: {},
          properties: {
            title: { type: 'string', default: '' },
          },
          required: ['title'],
        },
      })
    })
  })

  describe('plungeProperty', () => {
    it('plunges the property down in the schema', () => {
      // move the existing summary down into a metadata object
      const newSchema = updateSchema(v1Schema, [
        addProperty({ name: 'metadata', type: 'object' }),
        inside('metadata', [
          addProperty({ name: 'createdAt', type: 'number' }),
          addProperty({ name: 'editedAt', type: 'number' }),
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

    it('fails when presented with invalid data', () => {
      assert.throws(() => {
        updateSchema(v1Schema, [plungeProperty('metadata', 'nosaj-thing')])
      }, /Could not find a property called nosaj-thing among/)
    })

    it.skip('plunges an object down with its child properties', () => {
      // plunge metadata object into a container object
      const newSchema = updateSchema(v1Schema, [
        addProperty({ name: 'container', type: 'object' }),
        addProperty({ name: 'metadata', type: 'object' }),
        inside('metadata', [
          addProperty({ name: 'createdAt', type: 'number' }),
          addProperty({ name: 'editedAt', type: 'number' }),
        ]),
        plungeProperty('container', 'metadata'),
      ])

      assert.deepEqual(newSchema.properties, {
        ...v1Schema.properties,
        container: {
          type: 'object',
          default: {},
          required: ['metadata'],
          properties: {
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
              },
              required: ['createdAt', 'editedAt', 'summary'],
            },
          },
        },
      })
    })
  })
})
