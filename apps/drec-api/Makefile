PROJECT				= drec-api

NAME   				= energyweb/${PROJECT}
NAME_MIGRATIONS 	= ${NAME}-migrations
LATEST 				= ${NAME}:latest
LATEST_MIGRATIONS 	= ${NAME_MIGRATIONS}:latest

build:
	@rm -rf ./deployment
	@mkdir ./deployment
	@rush deploy -p @energyweb/origin-drec-api -t ./deployment --overwrite
	-@docker rmi ${LATEST} -f
	@docker build -t ${NAME_MIGRATIONS} -f Dockerfile.migrations ./deployment
	@docker build -t ${NAME} -f Dockerfile ./deployment
	@rm -rf ./deployment
	@docker tag ${NAME} ${LATEST}
	@docker tag ${NAME_MIGRATIONS} ${LATEST_MIGRATIONS}

deploy-heroku:
ifdef HEROKU_API_KEY
	@docker login -u _ -p $(shell echo '$$HEROKU_API_KEY') registry.heroku.com
	@docker tag ${LATEST} registry.heroku.com/${HEROKU_STABLE_APP_API}/web
	@docker push registry.heroku.com/${HEROKU_STABLE_APP_API}/web
	@heroku container:release web -a ${HEROKU_STABLE_APP_API}
	
	@docker tag ${LATEST_MIGRATIONS} registry.heroku.com/${HEROKU_STABLE_APP_MIGRATIONS}/worker
	@docker push registry.heroku.com/${HEROKU_STABLE_APP_MIGRATIONS}/worker
	@heroku container:release worker -a ${HEROKU_STABLE_APP_MIGRATIONS}
endif