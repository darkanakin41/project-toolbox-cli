FROM node:lts-alpine3.15
LABEL maintainer="Pierre LEJEUNE <darkanakin41@gmail.com>"

ENV PKG_CACHE_PATH=/srv/.pkg-cache
ENV GIT_SSH_COMMAND=/usr/bin/ssh

RUN apk add --no-cache git curl openssh-client \
    && git config --global --add safe.directory /srv

RUN USER=node && \
    GROUP=node && \
    curl -SsL https://github.com/boxboat/fixuid/releases/download/v0.6.0/fixuid-0.6.0-linux-amd64.tar.gz | tar -C /usr/local/bin -xzf - && \
    chown root:root /usr/local/bin/fixuid && \
    chmod 4755 /usr/local/bin/fixuid && \
    mkdir -p /etc/fixuid && \
    printf "user: $USER\ngroup: $GROUP\n" > /etc/fixuid/config.yml

WORKDIR /srv

USER node

RUN npm config set prefix /home/node/.npm-packages
ENV PATH="${PATH}:/home/node/.npm-packages/bin"

RUN git config --global --add safe.directory /srv \
    && npm upgrade --global \
    && npm install --global npm@latest eslint pkg semantic-release @semantic-release/git @semantic-release/gitlab

ENTRYPOINT ["fixuid", "-q"]
