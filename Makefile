default: start

.PHONY: start
start:
	@echo "Installing dependencies..."
	@npm install --silent

	@if [ ! -f .env ] || [ -z "$(shell cat .env | grep OPENAI_API_KEY | cut -d '=' -f2)" ]; then \
		echo ""; \
		echo "\033[33mWarning: OPENAI_API_KEY not found in .env file!\033[0m"; \
		echo "Please create a .env file with your API key (format: OPENAI_API_KEY=<your key here>)"; \
		exit 1; \
	fi

	@echo ""
	@echo "Starting \033[34mSuper Chatbot 9000\033[0m..."
	@OPENAI_API_KEY=$(shell cat .env | grep OPENAI_API_KEY | cut -d '=' -f2) npm run dev

