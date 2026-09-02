FROM node:20-alpine

RUN apk add --no-cache git

WORKDIR /workspace

COPY build.sh .
RUN chmod +x build.sh

ENTRYPOINT ["/workspace/build.sh"]