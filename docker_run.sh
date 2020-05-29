#!/bin/bash
# Run docker container
docker-compose stop
docker-compose rm -f
docker-compose pull

if [ "$1" = "-d" ] ; then
    docker-compose up -d
else
    docker-compose up
fi
