#!/bin/bash
# Add an default administrator to mongodb
docker exec -it mongo mongo --eval 'db.usermoderators.insert({"__t" : "Administrator", "login" : "admin", "password"  : "pass", "__v" : 0})' PRO
