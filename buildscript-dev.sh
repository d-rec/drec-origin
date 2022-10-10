#!/bin/bash

IMAGE="$1"
MAJOR=$((1000 + RANDOM % 9999))
MINOR=$((RANDOM % 9999))
BUILD_NUMBER=$MAJOR.$MINOR
DOCKERFILE="Dockerfile.$IMAGE"
if [ "$IMAGE" = "drec-api" ]; then
    DOCKERFILE="apps/drec-api/Dockerfile"
elif [ "$IMAGE" = "drec-ui" ]; then
    DOCKERFILE="apps/drec-ui/Dockerfile"
fi;

#DOCKERFILE="Dockerfile.$IMAGE"
echo "hello world $IMAGE - $BUILD_NUMBER - $DOCKERFILE"

#exit 10

docker build -t $IMAGE:$BUILD_NUMBER -f $DOCKERFILE .

aws ecr get-login-password --region ap-south-1  | docker login --username AWS --password-stdin 895706603967.dkr.ecr.eu-west-1.amazonaws.com

docker tag $IMAGE:$BUILD_NUMBER 895706603967.dkr.ecr.eu-west-1.amazonaws.com/$IMAGE:$BUILD_NUMBER

docker push 895706603967.dkr.ecr.eu-west-1.amazonaws.com/$IMAGE:$BUILD_NUMBER

template=`cat "$IMAGE.yaml" | sed "s/{{BUILD_NUMBER}}/$BUILD_NUMBER/g"`

echo "$template" | kubectl apply -f -
