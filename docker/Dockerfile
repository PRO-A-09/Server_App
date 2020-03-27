FROM node:13.11.0

RUN mkdir -p /home/node/server_app/node_modules && chown -R node:node /home/node/server_app

WORKDIR /home/node/server_app

USER node

RUN git init && \
   	git remote add origin https://github.com/PRO-A-09/server_app.git && \
	git fetch origin && \
	git checkout dev

RUN npm install

COPY --chown=node:node . .

EXPOSE 8080

CMD [ "npm", "start" ]
