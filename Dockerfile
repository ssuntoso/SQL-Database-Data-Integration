FROM node:20-alpine

WORKDIR /usr/app

# Bundle app source
COPY src /usr/app/src/

# Install app dependencies
COPY package*.json /usr/app/

RUN npm install

CMD [ "npm", "run", "docker" ]
