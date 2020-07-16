# 7/16 Demo

this is just a demo we ran in workshop on 7/16.

## Running the demo

If you've made any changes to the cloudina code, recompile the cloudina CLI from TS to JS, so that it doesn't need to compile on every run. (Obviously should improve this compile workflow)

`tsc --project cli-tsconfig.json --outDir ./dist/cloudina-cli`

Compile the github issue into a "simple issue":

`cat ./demo/github-issue.json | node ./dist/cloudina-cli/cloudina/cli.js -l ./demo/github-arthropod.lens.yml`

To get a live updating pipeline using `entr`:

`echo ./demo/github-arthropod.lens.yml | entr bash -c "cat ./demo/github-issue.json | node ./dist/cloudina-cli/cloudina/cli.js -l ./demo/github-arthropod.lens.yml > ./demo/simple-issue.json"`

Compile back from an updated "simple issue" to a new github issue file:

`cat ./demo/simple-issue.json | node ./dist/cloudina-cli/cloudina/cli.js -l ./demo/github-arthropod.lens.yml -r -b ./demo/github-issue.json`

Live updating pipeline backwards:

`echo ./demo/simple-issue.json | entr bash -c "cat ./demo/simple-issue.json | node ./dist/cloudina-cli/cloudina/cli.js -l ./demo/github-arthropod.lens.yml -r -b ./demo/github-issue.json > ./demo/new-github-issue.json"`
