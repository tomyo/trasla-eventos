.PHONY: dev
dev:
	make -j 2 legacy.css local-server

.PHONY: local-server
local-server:
	python -m http.server

.PHONY: legacy.css
legacy.css:
	npm run build:css