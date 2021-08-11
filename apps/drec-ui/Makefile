PROJECT				= drec-ui

NAME   				= energyweb/${PROJECT}
LATEST 				= ${NAME}:latest
PACK_NAME		  = energyweb-${PROJECT}-latest.tar

build:
	@docker build --no-cache -t ${LATEST} .

pack:
	@docker save ${LATEST} > ${PACK_NAME}

deploy-heroku:
ifdef HEROKU_API_KEY
	@docker tag ${LATEST} registry.heroku.com/${HEROKU_STABLE_APP_UI}/web
	@docker login -u _ -p $(shell echo '$$HEROKU_API_KEY') registry.heroku.com
	@docker push registry.heroku.com/${HEROKU_STABLE_APP_UI}/web
	@heroku container:release web -a ${HEROKU_STABLE_APP_UI}
endif