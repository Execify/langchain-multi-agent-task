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

		@if [ -d "chroma_db" ]; then \
		echo "Starting \033[31mChroma\033[0m server..."; \
		cd scripts && \
		. venv/bin/activate && \
		cd ../ && \
		chroma run --host localhost --port 8000 --path ./chroma_db > /dev/null 2>&1 & \
		echo "\033[31mChroma\033[0m server started in background"; \
	else \
		echo "\033[33mWarning: chroma_db not found. Run 'make load-vectorstore' first if you need vector search.\033[0m"; \
	fi

	@echo ""
	@echo "Starting \033[34mSuper Chatbot 9000\033[0m..."
	@set -a && . ./.env && set +a && npm run dev

.PHONY: load-vectorstore
load-vectorstore:
	@echo "Setting up Python virtual environment..."
	@cd scripts && \
		python -m venv venv && \
		. venv/bin/activate && \
		pip install -r requirements.txt --quiet
	
	@echo "Loading vector store..."
	@cd scripts && \
		. venv/bin/activate && \
		python load_vectorstore.py
