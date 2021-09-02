#!/bin/bash

REQUIRED_VARIABLES=(
    REACT_APP_BACKEND_URL
    GOOGLE_MAPS_API_KEY
)

# Recreate config file
rm -rf ./.env.local
touch ./.env.local

# Add assignment

envToRead=.env
rootEnvFile=../../.env
if [ ! -e "$envToRead" ]; then
    envToRead=$rootEnvFile
fi

pos=$(( ${#REQUIRED_VARIABLES[*]} - 1 ))
last=${REQUIRED_VARIABLES[$pos]}

for i in "${REQUIRED_VARIABLES[@]}"
  do
    varname="$i"
    value=$(printf '%s\n' "${!varname}")

    if [ -z "$value" ]; then
      if test -f $envToRead; then
        value=$(grep -e '^'$varname'=.*' $envToRead | cut -d '=' -f2 | xargs)
      fi
    fi

    if [[ $i == $last ]]; then
        echo "$varname=$value " >> ./.env.local
      else
        echo "$varname=$value" >> ./.env.local
    fi
  done
