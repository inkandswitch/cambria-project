// a quasi-integration test, converting a github doc to an arthropod doc--
// testing a complex doc + lens

import assert from 'assert'
import githubIssue from './github-issue.json'
import { applyLensToDoc } from '../src/doc'
import { reverseLens } from '../src/reverse'

describe('renaming title, and hoisting label name to category', () => {
  const lens = [
    { op: 'rename' as const, source: 'title', destination: 'name' },
    { op: 'head' as const, name: 'labels' },
    {
      op: 'in' as const,
      name: 'labels',
      lens: [{ op: 'rename' as const, source: 'name', destination: 'category' }],
    },
    { op: 'hoist' as const, host: 'labels', name: 'category' },
    {
      op: 'remove' as const,
      name: 'labels',
      type: ['object' as const, 'null' as const],
    },
  ]

  it('converts the doc forwards', () => {
    const { title: _title, labels: _labels, ...rest } = githubIssue
    assert.deepEqual(applyLensToDoc(lens, githubIssue), {
      ...rest,
      name: githubIssue.title,
      category: githubIssue.labels[0].name,
    })
  })

  it('converts the doc backwards, merging with the original doc', () => {
    const newArthropod = {
      name: 'Changed the name',
      category: 'Bug',
    }

    const newGithub = applyLensToDoc(reverseLens(lens), newArthropod, undefined, githubIssue)

    assert.deepEqual(newGithub, {
      ...githubIssue,
      title: 'Changed the name',
      labels: [
        {
          ...githubIssue.labels[0],
          name: 'Bug',
        },
      ],
    })
  })
})
