FROM node:22-alpine

RUN apk add --no-cache git

WORKDIR /workspace

COPY build.sh .
RUN chmod +x build.sh

ENTRYPOINT ["/workspace/build.sh"]