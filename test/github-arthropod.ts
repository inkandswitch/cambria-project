// a quasi-integration test, converting a github doc to an arthropod doc--
// testing a complex doc + lens

import githubIssue from './github-issue.json'
import { applyLensToDoc } from '../src/patch'
import assert from 'assert'

describe('converting github issue to arthropod format', () => {
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
      type: 'array' as const,
      arrayItemType: 'string' as const,
    },
  ]

  it('converts the doc', () => {
    const { title: _title, labels: _labels, ...rest } = githubIssue
    assert.deepEqual(applyLensToDoc(lens, githubIssue), {
      ...rest,
      name: githubIssue.title,
      category: githubIssue.labels[0].name,
    })
  })
})
