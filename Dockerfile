FROM node:10.3.0

WORKDIR /usr/src/api

# For npm@5 or later, copy package-lock.json as well
COPY ./package.json ./

RUN npm install -g nodemon

RUN npm install

COPY . .

EXPOSE 8081
