# Dockerfile for Fragments node.js Microservice (REST API server) 

######################################################### 
# Stage 1: Dependencies 
FROM node:20.17.0@sha256:db5dd2f30cb82a8bdbd16acd4a8f3f2789f5b24f6ce43f98aa041be848c82e45 AS dependencies
 
ENV NODE_ENV=development 
 
# ENV PORT=8080
# NOTE-: For AWS Docker, we need to use port 80
ENV PORT=80
 
ENV NPM_CONFIG_LOGLEVEL=warn 
ENV NPM_CONFIG_COLOR=false
 
LABEL maintainer="Le Chanh Tin LUONG <lluong7@myseneca.ca>"
LABEL description="Fragments node.js microservice"
 
WORKDIR /app
 
COPY package*.json ./
 
RUN npm ci 

#########################################################
# Stage 2: Build
# Use -slim to minimize the size of final ouput
FROM node:20.17.0-slim@sha256:2394e403d45a644e41ac2a15b6f843a7d4a99ad24be48c27982c5fdc61a1ef17 AS build
 
RUN apt-get update \
   && apt-get install -y --no-install-recommends tini=0.19.0-1 \
   && rm -rf /var/lib/apt/lists/*

# Start TINI as the entrypoint with PID 1
ENTRYPOINT [ "/usr/bin/tini", "--" ]
ENV TINI_SUBREAPER=true  

ENV NODE_ENV=production

# ENV PORT=8080
# NOTE-: For AWS Docker, we need to use port 80
ENV PORT=80

ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

LABEL maintainer="Le Chanh Tin LUONG <lluong7@myseneca.ca>"
LABEL description="Fragments node.js microservice"
 
WORKDIR /app 
 
COPY --from=dependencies /app /app 
 
COPY . .
COPY ./tests/.htpasswd ./tests/.htpasswd
 
# EXPOSE 8080
# For AWS Docker, we need to use port 80
EXPOSE 80

# use a lightweight init system TINI to properly spawn the Node.js runtime process with signals support
# Gets added to the front of the CMD is: /usr/bin/tini -- node src/index.js
# "node src/index.js" will run from /app/src/index.js
CMD ["node", "src/index.js"]
