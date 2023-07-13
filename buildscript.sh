#!/bin/bash

IMAGE="$1"
ENV="$2"
echo "Image $IMAGE"
if [[ -z "$ENV" ]]; then
   ENV="dev"
fi
echo "ENV $ENV"


BUILD_NUMBER=$ENV-$(cat version)
#DOCKERFILE="Dockerfile.$IMAGE"
if [ $IMAGE == "drec-api" ]; then
  DOCKERFILE="Dockerfile"
else
  DOCKERFILE="Dockerfile.migrations"
fi
echo "Deploying $IMAGE - $BUILD_NUMBER - $DOCKERFILE"

#exit 10

docker build -t $IMAGE:$BUILD_NUMBER -f ./apps/drec-api/$DOCKERFILE .

aws ecr get-login-password --region eu-west-1  | docker login --username AWS --password-stdin 895706603967.dkr.ecr.eu-west-1.amazonaws.com

docker tag $IMAGE:$BUILD_NUMBER 895706603967.dkr.ecr.eu-west-1.amazonaws.com/$IMAGE:$BUILD_NUMBER

docker push 895706603967.dkr.ecr.eu-west-1.amazonaws.com/$IMAGE:$BUILD_NUMBER

template=`cat ./apps/drec-api/"$IMAGE-$ENV.yaml" | sed "s/{{BUILD_NUMBER}}/$BUILD_NUMBER/g"`

echo "Deploying into k8s"
echo "$template" | kubectl apply -f -
