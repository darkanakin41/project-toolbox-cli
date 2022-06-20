# project-toolbox-cli [WIP]

## docs

https://medium.com/geekculture/building-a-node-js-cli-with-typescript-packaged-and-distributed-via-homebrew-15ba2fadcb81

https://www.npmjs.com/package/@hanazuki/node-jsonnet

https://www.npmjs.com/package/jinja-js

Add to .bashrc, .zshrc, or .profile:

ZSH : 
```zsh
[ ${ZSH_VERSION} ] && precmd() { $(pt install); }
```

BASH : 
```bash
[ ${BASH_VERSION} ] && PROMPT_COMMAND='$(pt install)'
```