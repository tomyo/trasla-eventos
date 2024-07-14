.PHONY: dev
dev:
	make -j 1 local-server

.PHONY: local-server
local-server:
	python -m http.server