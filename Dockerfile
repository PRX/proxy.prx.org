FROM lambci/lambda:build-nodejs10.x

MAINTAINER PRX <sysadmin@prx.org>
LABEL org.prx.lambda="true"
LABEL org.prx.spire.publish.s3="LAMBDA_ZIP"

WORKDIR /app

ENTRYPOINT [ "npm", "run" ]
CMD [ "test" ]

RUN yum install -y rsync && yum clean all && rm -rf /var/cache/yum
ADD yarn.lock ./
ADD package.json ./
RUN npm install --quiet --global yarn && yarn install
ADD . .
RUN npm run build
