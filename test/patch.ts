import assert from 'assert'
import { Patch, applyLensToPatch, PatchOp, expandPatch } from '../src/patch'
import { applyLensToDoc } from '../src/doc'
import { updateSchema, schemaForLens } from '../src/json-schema'
import { LensSource } from '../src/lens-ops'
import {
  renameProperty,
  addProperty,
  inside,
  map,
  hoistProperty,
  plungeProperty,
  wrapProperty,
  headProperty,
  convertValue,
} from '../src/helpers'

import { reverseLens } from '../src/reverse'
import { ReplaceOperation } from 'fast-json-patch'
import { JSONSchema7 } from 'json-schema'

export interface ProjectV1 {
  title: string
  tasks: { title: string }[]
  complete: boolean
  metadata: {
    createdAt: number
    updatedAt: number
  }
}

export interface ProjectV2 {
  name: string
  description: string
  issues: { title: string }[]
  status: string
  metadata: {
    createdAt: number
    updatedAt: number
  }
}

const lensSource: LensSource = [
  renameProperty('title', 'name'),
  addProperty({ name: 'description', type: 'string', default: '' }),
  convertValue(
    'complete',
    [
      { false: 'todo', true: 'done' },
      { todo: false, inProgress: false, done: true },
    ],
    'boolean',
    'string'
  ),
]

const projectV1Schema = <const>{
  $schema: 'http://json-schema.org/draft-07/schema',
  type: 'object' as const,
  additionalProperties: false,
  properties: {
    title: { type: 'string' as const },
    tasks: {
      type: 'array' as const,
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
        },
      },
    },
    complete: { type: 'boolean' as const },
    metadata: {
      type: 'object',
      properties: {
        createdAt: { type: 'number', default: 123 },
        updatedAt: { type: 'number', default: 123 },
      },
    },
  },
}

// ======================================
// Try sending a patch through the lens
// ======================================

describe('field rename', () => {
  it('converts upwards', () => {
    // Generate an edit from V1: setting the title field
    // (todo: try the json patch library's observer as an ergonomic interface?)
    const editTitleV1: Patch = [
      {
        op: 'replace' as const,
        path: '/title',
        value: 'new title',
      },
    ]
    // test the converted patch

    assert.deepEqual(applyLensToPatch(lensSource, editTitleV1, projectV1Schema), [
      { op: 'replace', path: '/name', value: 'new title' },
    ])
  })

  it('does not rename another property that starts with same string', () => {
    const editTitleBla: Patch = [
      {
        op: 'replace' as const,
        path: '/title_bla',
        value: 'new title',
      },
    ]

    assert.deepEqual(applyLensToPatch(lensSource, editTitleBla, projectV1Schema), editTitleBla)
  })

  it('converts downwards', () => {
    // We can also use the left lens to convert a v2 patch into a v1 patch
    const editNameV2: Patch = [
      {
        op: 'replace' as const,
        path: '/name',
        value: 'new name',
      },
    ]

    assert.deepEqual(
      applyLensToPatch(
        reverseLens(lensSource),
        editNameV2,
        updateSchema(projectV1Schema, lensSource)
      ),
      [{ op: 'replace', path: '/title', value: 'new name' }]
    )
  })

  it('works with whole doc conversion too', () => {
    // fills in default values for missing fields
    assert.deepEqual(applyLensToDoc(lensSource, { title: 'hello' }, projectV1Schema), {
      complete: '',
      description: '',
      name: 'hello',
      tasks: [],
      metadata: {
        createdAt: 123,
        updatedAt: 123,
      },
    })
  })
})

describe('add field', () => {
  it('becomes an empty patch when reversed', () => {
    const editDescription: Patch = [
      {
        op: 'replace' as const,
        path: '/description',
        value: 'going swimmingly',
      },
    ]
    assert.deepEqual(
      applyLensToPatch(
        reverseLens(lensSource),
        editDescription,
        updateSchema(projectV1Schema, lensSource)
      ),
      []
    )
  })
})

// ======================================
// Demo more complex conversions than a rename: todo boolean case
// ======================================

describe('value conversion', () => {
  it('converts from a boolean to a string enum', () => {
    const setComplete: Patch = [
      {
        op: 'replace' as const,
        path: '/complete',
        value: true,
      },
    ]

    assert.deepEqual(applyLensToPatch(lensSource, setComplete, projectV1Schema), [
      { op: 'replace', path: '/complete', value: 'done' },
    ])
  })

  it('reverse converts from a string enum to a boolean', () => {
    const setStatus: Patch = [
      {
        op: 'replace' as const,
        path: '/complete',
        value: 'inProgress',
      },
    ]

    assert.deepEqual(
      applyLensToPatch(
        reverseLens(lensSource),
        setStatus,
        updateSchema(projectV1Schema, lensSource)
      ),
      [{ op: 'replace', path: '/complete', value: false }]
    )
  })

  it('handles a value conversion and a rename in the same lens', () => {
    const lensSource = [
      renameProperty('complete', 'status'),
      convertValue(
        'status',
        [
          { false: 'todo', true: 'done' },
          { todo: false, inProgress: false, done: true },
        ],
        'boolean',
        'string'
      ),
    ]

    const setComplete: Patch = [
      {
        op: 'replace' as const,
        path: '/complete',
        value: true,
      },
    ]

    assert.deepEqual(applyLensToPatch(lensSource, setComplete, projectV1Schema), [
      { op: 'replace', path: '/status', value: 'done' },
    ])
  })
})

describe('nested objects', () => {
  describe('singly nested object', () => {
    // renaming metadata/basic/title to metadata/basic/name. a more sugary syntax:
    // in("metadata", rename("title", "name", "string"))
    const lensSource: LensSource = [inside('metadata', [renameProperty('title', 'name')])]

    const docSchema = {
      $schema: 'http://json-schema.org/draft-07/schema',
      type: 'object' as const,
      additionalProperties: false,
      properties: {
        metadata: {
          type: 'object' as const,
          properties: {
            title: { type: 'string' as const },
          },
        },
        otherparent: {
          type: 'object' as const,
          properties: {
            title: { type: 'string' as const, default: '' },
          },
        },
      },
    }

    it('renames a field correctly', () => {
      const setDescription: Patch = [
        {
          op: 'replace' as const,
          path: '/metadata/title',
          value: 'hello',
        },
      ]

      assert.deepEqual(applyLensToPatch(lensSource, setDescription, docSchema), [
        { op: 'replace' as const, path: '/metadata/name', value: 'hello' },
      ])
    })

    it('works with whole doc conversion', () => {
      assert.deepEqual(applyLensToDoc(lensSource, { metadata: { title: 'hello' } }, docSchema), {
        metadata: { name: 'hello' },
        otherparent: { title: '' },
      })
    })

    it("doesn't rename another field", () => {
      const randomPatch: Patch = [
        {
          op: 'replace' as const,
          path: '/otherparent/title',
          value: 'hello',
        },
      ]

      assert.deepEqual(applyLensToPatch(lensSource, randomPatch, docSchema), randomPatch)
    })

    it('renames a field in the left direction', () => {
      const setDescription: Patch = [
        {
          op: 'replace' as const,
          path: '/metadata/name',
          value: 'hello',
        },
      ]

      const updatedSchema = updateSchema(docSchema, lensSource)

      assert.deepEqual(applyLensToPatch(reverseLens(lensSource), setDescription, updatedSchema), [
        { op: 'replace' as const, path: '/metadata/title', value: 'hello' },
      ])
    })

    it('renames the field when a whole object is set in a patch', () => {
      const setDescription: Patch = [
        {
          op: 'replace' as const,
          path: '/metadata',
          value: { title: 'hello' },
        },
      ]

      assert.deepEqual(applyLensToPatch(lensSource, setDescription, docSchema), [
        {
          op: 'replace' as const,
          path: '/metadata',
          value: {},
        },
        {
          op: 'replace' as const,
          path: '/metadata/name',
          value: 'hello',
        },
      ])
    })
  })
})

describe('arrays', () => {
  // renaming tasks/n/title to tasks/n/name
  const lensSource: LensSource = [inside('tasks', [map([renameProperty('title', 'name')])])]

  it('renames a field in an array element', () => {
    assert.deepEqual(
      applyLensToPatch(
        lensSource,
        [
          {
            op: 'replace' as const,
            path: '/tasks/23/title',
            value: 'hello',
          },
        ],
        projectV1Schema
      ),
      [{ op: 'replace' as const, path: '/tasks/23/name', value: 'hello' }]
    )
  })

  it('renames a field in the left direction', () => {
    assert.deepEqual(
      applyLensToPatch(
        reverseLens(lensSource),
        [
          {
            op: 'replace' as const,
            path: '/tasks/23/name',
            value: 'hello',
          },
        ],
        updateSchema(projectV1Schema, lensSource)
      ),
      [{ op: 'replace' as const, path: '/tasks/23/title', value: 'hello' }]
    )
  })
})

describe('hoist (object)', () => {
  const lensSource: LensSource = [hoistProperty('metadata', 'createdAt')]

  it('pulls a field up to its parent', () => {
    assert.deepEqual(
      applyLensToPatch(
        lensSource,
        [
          {
            op: 'replace' as const,
            path: '/metadata/createdAt',
            value: 'July 7th, 2020',
          },
        ],
        projectV1Schema
      ),
      [{ op: 'replace' as const, path: '/createdAt', value: 'July 7th, 2020' }]
    )
  })
})

describe('plunge (object)', () => {
  const lensSource: LensSource = [plungeProperty('metadata', 'title')]

  // currently does not pass - strange ordering issue with fields in the object
  it.skip('pushes a field into a child with applyLensToDoc', () => {
    assert.deepEqual(
      applyLensToDoc(
        [{op: "plunge", host: "tags", name: "color"}],
        {
          // this currently throws an error but works if we re-order color and tags in the object below
          color: "orange",
          tags: {}
        }
      ),
      { tags: { color: 'orange' } }
    )
  })

  it('pushes a field into its child', () => {
    assert.deepEqual(
      applyLensToPatch(
        lensSource,
        [
          {
            op: 'replace' as const,
            path: '/title',
            value: 'Fun project',
          },
        ],
        projectV1Schema
      ),
      [{ op: 'replace' as const, path: '/metadata/title', value: 'Fun project' }]
    )
  })
})

describe('wrap (scalar to array)', () => {
  const docSchema: JSONSchema7 = {
    $schema: 'http://json-schema.org/draft-07/schema',
    type: 'object' as const,
    additionalProperties: false,
    properties: {
      assignee: { type: ['string' as const, 'null' as const] },
    },
  }
  const lensSource: LensSource = [wrapProperty('assignee')]

  it('converts head replace value into 0th element writes into its child', () => {
    assert.deepEqual(
      applyLensToPatch(
        lensSource,
        [
          {
            op: 'replace' as const,
            path: '/assignee',
            value: 'July 7th, 2020',
          },
        ],
        docSchema
      ),
      [{ op: 'replace' as const, path: '/assignee/0', value: 'July 7th, 2020' }]
    )
  })

  it('converts head add value into 0th element writes into its child', () => {
    assert.deepEqual(
      applyLensToPatch(
        lensSource,
        [
          {
            op: 'add' as const,
            path: '/assignee',
            value: 'July 7th, 2020',
          },
        ],
        docSchema
      ),
      [{ op: 'add' as const, path: '/assignee/0', value: 'July 7th, 2020' }]
    )
  })

  // todo: many possible options for how to handle this.
  // Consider other options:
  // https://github.com/inkandswitch/cambria/blob/default/conversations/converting-scalar-to-arrays.md
  it('converts head null write into a remove the first element op', () => {
    assert.deepEqual(
      applyLensToPatch(
        lensSource,
        [
          {
            op: 'replace' as const,
            path: '/assignee',
            value: null,
          },
        ],
        docSchema
      ),
      [{ op: 'remove' as const, path: '/assignee/0' }]
    )
  })

  it('handles a wrap followed by a rename', () => {
    const lensSource: LensSource = [
      wrapProperty('assignee'),
      renameProperty('assignee', 'assignees'),
    ]

    assert.deepEqual(
      applyLensToPatch(
        lensSource,
        [
          {
            op: 'replace' as const,
            path: '/assignee',
            value: 'pvh',
          },
        ],
        docSchema
      ),
      [{ op: 'replace' as const, path: '/assignees/0', value: 'pvh' }]
    )
  })

  it('converts nested values into 0th element writes into its child', () => {
    const docSchema: JSONSchema7 = {
      $schema: 'http://json-schema.org/draft-07/schema',
      type: 'object' as const,
      additionalProperties: false,
      properties: {
        assignee: { type: ['object', 'null'], properties: { name: { type: 'string' } } },
      },
    }

    assert.deepEqual(
      applyLensToPatch(
        lensSource,
        [
          {
            op: 'replace' as const,
            path: '/assignee/name',
            value: 'Orion',
          },
        ],
        docSchema
      ),
      [{ op: 'replace' as const, path: '/assignee/0/name', value: 'Orion' }]
    )
  })

  describe('reverse direction', () => {
    // this duplicates the tests of head;
    // and is just a sanity check that the reverse isn't totally broken.
    // (could be also tested independently, but this is a nice backup)
    it('converts array first element write into a write on the scalar', () => {
      assert.deepEqual(
        applyLensToPatch(
          reverseLens(lensSource),
          [{ op: 'replace' as const, path: '/assignee/0', value: 'July 7th, 2020' }],
          updateSchema(docSchema, lensSource)
        ),
        [
          {
            op: 'replace' as const,
            path: '/assignee',
            value: 'July 7th, 2020',
          },
        ]
      )
    })
  })
})

describe('head (array to nullable scalar)', () => {
  const docSchema = <const>{
    $schema: 'http://json-schema.org/draft-07/schema',
    type: 'object' as const,
    additionalProperties: false,
    properties: {
      assignee: { type: 'array', items: { type: 'string' } },
    },
  }
  const lensSource: LensSource = [headProperty('assignee')]

  it('converts head set value into 0th element writes into its child', () => {
    assert.deepEqual(
      applyLensToPatch(
        lensSource,
        [
          {
            op: 'replace' as const,
            path: '/assignee/0',
            value: 'Peter',
          },
        ],
        docSchema
      ),
      [{ op: 'replace' as const, path: '/assignee', value: 'Peter' }]
    )
  })

  it('converts a write on other elements to a no-op', () => {
    assert.deepEqual(
      applyLensToPatch(
        lensSource,
        [
          {
            op: 'replace' as const,
            path: '/assignee/1',
            value: 'Peter',
          },
        ],
        docSchema
      ),
      []
    )
  })

  it('converts array first element delete into a null write on the scalar', () => {
    assert.deepEqual(
      applyLensToPatch(lensSource, [{ op: 'remove' as const, path: '/assignee/0' }], docSchema),
      [{ op: 'replace' as const, path: '/assignee', value: null }]
    )
  })

  it('preserves the rest of the path after the array index', () => {
    assert.deepEqual(
      applyLensToPatch(
        lensSource,
        [{ op: 'replace' as const, path: '/assignee/0/age', value: 23 }],
        docSchema
      ),
      [{ op: 'replace' as const, path: '/assignee/age', value: 23 }]
    )
  })

  it('preserves the rest of the path after the array index with nulls', () => {
    assert.deepEqual(
      applyLensToPatch(
        lensSource,
        [{ op: 'replace' as const, path: '/assignee/0/age', value: null }],
        docSchema
      ),
      [{ op: 'replace' as const, path: '/assignee/age', value: null }]
    )
  })

  it('preserves the rest of the path after the array index with removes', () => {
    assert.deepEqual(
      applyLensToPatch(lensSource, [{ op: 'remove' as const, path: '/assignee/0/age' }], docSchema),
      [{ op: 'remove' as const, path: '/assignee/age' }]
    )
  })

  it('correctly handles a sequence of array writes', () => {
    assert.deepEqual(
      applyLensToPatch(
        lensSource,
        [
          // set array to ['geoffrey', 'orion']
          { op: 'add' as const, path: '/assignee/0', value: 'geoffrey' },
          { op: 'add' as const, path: '/assignee/1', value: 'orion' },

          // remove geoffrey from the array
          // in our current naive json patch observer, this comes out as below.
          // (this isn't a good patch format given crdt problems, but it's convenient for now
          // because the patch itself gives us the new head value)
          { op: 'remove' as const, path: '/assignee/1' },
          { op: 'replace' as const, path: '/assignee/0', value: 'orion' },
        ],
        docSchema
      ),
      [
        {
          op: 'add' as const,
          path: '/assignee',
          value: 'geoffrey',
        },
        {
          op: 'replace' as const,
          path: '/assignee',
          value: 'orion',
        },
      ]
    )
  })

  describe('reverse direction', () => {
    // this duplicates the tests of wrap;
    // and is just a sanity check that the reverse isn't totally broken.
    // (could be also tested independently, but this is a nice backup)

    const docSchema: JSONSchema7 = {
      $schema: 'http://json-schema.org/draft-07/schema',
      type: 'object' as const,
      additionalProperties: false,
      properties: {
        assignee: { type: ['string', 'null'] },
      },
    }

    it('converts head set value into 0th element writes into its child', () => {
      assert.deepEqual(
        applyLensToPatch(
          reverseLens(lensSource),
          [
            {
              op: 'replace' as const,
              path: '/assignee',
              value: 'July 7th, 2020',
            },
          ],
          docSchema
        ),
        [{ op: 'replace' as const, path: '/assignee/0', value: 'July 7th, 2020' }]
      )
    })
  })
})

describe('patch expander', () => {
  it('expands a patch that sets an object', () => {
    const setObject: PatchOp = {
      op: 'replace' as const,
      path: '/obj',
      value: { a: { b: 5 } },
    }

    assert.deepEqual(expandPatch(setObject), [
      {
        op: 'replace' as const,
        path: '/obj',
        value: {},
      },
      {
        op: 'replace' as const,
        path: '/obj/a',
        value: {},
      },
      {
        op: 'replace' as const,
        path: '/obj/a/b',
        value: 5,
      },
    ])
  })

  it('works with multiple keys', () => {
    const setObject: PatchOp = {
      op: 'replace' as const,
      path: '/obj',
      value: { a: { b: 5, c: { d: 6 } } },
    }

    assert.deepEqual(expandPatch(setObject), [
      {
        op: 'replace' as const,
        path: '/obj',
        value: {},
      },
      {
        op: 'replace' as const,
        path: '/obj/a',
        value: {},
      },
      {
        op: 'replace' as const,
        path: '/obj/a/b',
        value: 5,
      },
      {
        op: 'replace' as const,
        path: '/obj/a/c',
        value: {},
      },
      {
        op: 'replace' as const,
        path: '/obj/a/c/d',
        value: 6,
      },
    ])
  })

  it('expands a patch that sets an array', () => {
    const setObject: PatchOp = {
      op: 'replace' as const,
      path: '/obj',
      value: ['hello', 'world'],
    }

    assert.deepEqual(expandPatch(setObject), [
      {
        op: 'replace' as const,
        path: '/obj',
        value: [],
      },
      {
        op: 'replace' as const,
        path: '/obj/0',
        value: 'hello',
      },
      {
        op: 'replace' as const,
        path: '/obj/1',
        value: 'world',
      },
    ])

    // deepEqual returns true for {} === []; so we need to double check ourselves
    const op = expandPatch(setObject)[0] as ReplaceOperation<any>
    assert(Array.isArray(op.value))
  })

  it('works recursively with objects and arrays', () => {
    const setObject: PatchOp = {
      op: 'replace' as const,
      path: '',
      value: { tasks: [{ name: 'hello' }, { name: 'world' }] },
    }

    assert.deepEqual(expandPatch(setObject), [
      {
        op: 'replace' as const,
        path: '',
        value: {},
      },
      {
        op: 'replace' as const,
        path: '/tasks',
        value: [],
      },
      {
        op: 'replace' as const,
        path: '/tasks/0',
        value: {},
      },
      {
        op: 'replace' as const,
        path: '/tasks/0/name',
        value: 'hello',
      },
      {
        op: 'replace' as const,
        path: '/tasks/1',
        value: {},
      },
      {
        op: 'replace' as const,
        path: '/tasks/1/name',
        value: 'world',
      },
    ])
  })
})

describe('default value initialization', () => {
  // one lens that creates objects inside of arrays and other objects
  const v1Lens: LensSource = [
    addProperty({ name: 'tags', type: 'array', items: { type: 'object' }, default: [] }),
    inside('tags', [
      map([
        addProperty({ name: 'name', type: 'string', default: '' }),
        addProperty({ name: 'color', type: 'string', default: '#ffffff' }),
      ]),
    ]),
    addProperty({ name: 'metadata', type: 'object', default: {} }),
    inside('metadata', [
      addProperty({ name: 'title', type: 'string', default: '' }),
      addProperty({ name: 'flags', type: 'object', default: {} }),
      inside('flags', [addProperty({ name: 'O_CREATE', type: 'boolean', default: true })]),
    ]),
    addProperty({
      name: 'assignee',
      type: ['string', 'null'],
    }),
  ]

  const v1Schema = schemaForLens(v1Lens)

  it('fills in defaults on a patch that adds a new array item', () => {
    const patchOp: PatchOp = {
      op: 'add',
      path: '/tags/123',
      value: { name: 'bug' },
    }

    assert.deepEqual(applyLensToPatch([], [patchOp], v1Schema), [
      {
        op: 'add',
        path: '/tags/123',
        value: {},
      },
      {
        op: 'add',
        path: '/tags/123/name',
        value: '',
      },
      {
        op: 'add',
        path: '/tags/123/color',
        value: '#ffffff',
      },
      {
        op: 'add',
        path: '/tags/123/name',
        value: 'bug',
      },
    ])
  })

  it("doesn't expand a patch on an object key that already exists", () => {
    const patchOp: PatchOp = {
      op: 'add',
      path: '/tags/123/name',
      value: 'bug',
    }

    assert.deepEqual(applyLensToPatch([], [patchOp], v1Schema), [patchOp])
  })

  it('recursively fills in defaults from the root', () => {
    const patchOp: PatchOp = {
      op: 'add',
      path: '',
      value: {},
    }

    assert.deepEqual(applyLensToPatch([], [patchOp], v1Schema), [
      {
        op: 'add',
        path: '',
        value: {},
      },
      {
        op: 'add',
        path: '/tags',
        value: [],
      },
      {
        op: 'add',
        path: '/metadata',
        value: {},
      },
      {
        op: 'add',
        path: '/metadata/title',
        value: '',
      },
      {
        op: 'add',
        path: '/metadata/flags',
        value: {},
      },
      {
        op: 'add',
        path: '/metadata/flags/O_CREATE',
        value: true,
      },
      {
        op: 'add',
        path: '/assignee',
        value: null,
      },
    ])
  })

  it('works correctly when properties are spread across multiple lenses', () => {
    const v1Tov2Lens = [
      renameProperty('tags', 'labels'),
      inside('labels', [
        map([addProperty({ name: 'important', type: 'boolean', default: false })]),
      ]),
    ]

    const patchOp: PatchOp = {
      op: 'add',
      path: '/tags/123',
      value: { name: 'bug' },
    }

    assert.deepEqual(applyLensToPatch(v1Tov2Lens, [patchOp], v1Schema), [
      {
        op: 'add',
        path: '/labels/123',
        value: {},
      },
      {
        op: 'add',
        path: '/labels/123/name',
        value: '',
      },
      {
        op: 'add',
        path: '/labels/123/color',
        value: '#ffffff',
      },
      {
        op: 'add',
        path: '/labels/123/important',
        value: false,
      },
      {
        op: 'add',
        path: '/labels/123/name',
        value: 'bug',
      },
    ])
  })
})

describe('inferring schemas from documents', () => {
  const doc = {
    name: 'hello',
    details: {
      age: 23,
      height: 64,
    },
  }

  it('infers a schema when converting a doc', () => {
    const lens = [inside('details', [renameProperty('height', 'heightInches')])]

    assert.deepEqual(applyLensToDoc(lens, doc), {
      ...doc,
      details: {
        age: 23,
        heightInches: 64,
      },
    })
  })

  // We should do more here, but this is the bare minimum test of whether schema inference
  // is actually working at all.
  // If our lens tries to rename a nonexistent field, it should throw an error.
  it("throws if the lens doesn't match the doc's inferred schema", () => {
    const lens = [renameProperty('nonexistent', 'ghost')]
    assert.throws(
      () => {
        applyLensToDoc(lens, doc)
      },
      {
        message: /Cannot rename property/,
      }
    )
  })
})
