FROM node:16
ENV NODE_ENV=development
RUN mkdir -p /var/www/users
WORKDIR /var/www/users
ADD . /var/www/users

RUN yarn install
RUN yarn add @nestjs/cli
CMD yarn build && yarn start:prod2
