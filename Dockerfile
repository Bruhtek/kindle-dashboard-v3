FROM node:22-alpine
LABEL authors="Bruhtek"

WORKDIR /app
COPY package.json /app
RUN apk add --no-cache --virtual .build-deps \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    && apk add --no-cache --virtual .runtime-deps \
    cairo \
    jpeg \
    pango \
    giflib

HEALTHCHECK --interval=1m --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q http://localhost:5000/health || exit 1

RUN npm install

COPY . /app

EXPOSE 5000

RUN mkdir -p /usr/share/fonts/truetype/kindle
COPY 'src/fonts/*' /usr/share/fonts/truetype/kindle/
RUN chmod -R 755 /usr/share/fonts/truetype/kindle && \
    fc-cache -f -v

ENTRYPOINT ["npm", "run", "serve"]