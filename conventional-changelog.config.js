module.exports = {
  types: [
    { type: 'feat', section: 'Features' },
    { type: 'fix', section: 'Bug Fixes' },
    { type: 'docs', section: 'Documentation' },
    { type: 'style', section: 'Styles' },
    { type: 'refactor', section: 'Refactors' },
    { type: 'perf', section: 'Performance' },
    { type: 'test', section: 'Tests' },
    { type: 'build', section: 'Build System' },
    { type: 'ci', section: 'CI' },
    { type: 'chore', section: 'Chores' },
    { type: 'revert', section: 'Reverts' }
  ],
  preset: 'angular',
  releaseRules: [
    { type: 'feat', release: 'minor' },
    { type: 'fix', release: 'patch' },
    { type: 'perf', release: 'patch' },
    { type: 'docs', release: 'patch' },
    { type: 'style', release: 'patch' },
    { type: 'refactor', release: 'patch' },
    { type: 'test', release: 'patch' },
    { type: 'chore', release: 'patch' },
    { type: 'build', release: 'patch' },
    { type: 'ci', release: 'patch' }
  ],
  parserOpts: {
    noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES', 'BREAKING']
  }
};