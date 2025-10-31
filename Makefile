.PHONY: dev
dev:
	make -j 2 legacy.css local-server

.PHONY: local-server
local-server:
	python -m http.server

.PHONY: legacy.css
legacy.css:
	npm run build:css


### Update external/shared Web Components from the web-components repo ###

COMPONENTS := horizontal-carousel install-button share-url
REPO_URL := https://github.com/tomyo/web-components.git
COMPONENTS_DIR := components
BRANCH := main
DEST_DIR := components

update-components:
	@echo "🌀 Fetching components from $(REPO_URL)"
	$(eval TEMP_DIR := $(shell mktemp -d))
	git clone $(REPO_URL) $(TEMP_DIR)
	cd $(TEMP_DIR) && git checkout $(BRANCH)
	cd $(COMPONENTS_DIR)

	@echo "🔄 Syncing files..."
	mkdir -p $(DEST_DIR)
	for c in $(COMPONENTS); do \
			echo "→ $$c"; \
			rm -rf $(DEST_DIR)/$$c/*; \
			mkdir -p $(DEST_DIR)/$$c; \
			cp -r $(TEMP_DIR)/$(COMPONENTS_DIR)/$$c/* $(DEST_DIR)/$$c/; \
	done

	@echo "🧹 Cleaning up..."
	rm -rf $(TEMP_DIR)

	@echo "✅ Components updated successfully!"