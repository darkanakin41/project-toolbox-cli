docker.build:
	docker-compose build

install:
	docker-compose run --rm node yarn install

fix_style:
	docker-compose run --rm node yarn run prettify

lint:
	docker-compose run --rm node yarn run lint

build: lint
	docker-compose run --rm node yarn run build

watch:
	docker-compose run --rm node yarn run build:watch

package.ci: build
	docker-compose run --rm node yarn install --prod --ignore-scripts
	docker-compose run --rm node yarn run package

package: package.ci
	make install

semantic-release:
	docker-compose run --rm node semantic-release --no-ci
