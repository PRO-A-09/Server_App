#!/bin/bash
# Run docker container
docker-compose build
if [ "$1" = "-d" ] ; then
    docker-compose up -d
else
    docker-compose up
fi
