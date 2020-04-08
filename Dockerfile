FROM node:13.11.0

RUN mkdir -p /home/node/server_app/node_modules && chown -R node:node /home/node/server_app

WORKDIR /home/node/server_app

USER node

COPY package*.json ./

RUN npm install

COPY ./src ./src

EXPOSE 8080

CMD [ "npm", "start" ]
