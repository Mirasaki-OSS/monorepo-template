.PHONY: help docker-services docker-info \
	docker-ps docker-up docker-down docker-build docker-logs docker-deploy \
	docker-ps-% docker-build-% docker-up-% docker-logs-% docker-shell-%

ENV ?= development
PROFILE ?=

VALID_ENVS := production development staging
ifeq ($(filter $(ENV),$(VALID_ENVS)),)
$(error Invalid ENV '$(ENV)'. Use: $(VALID_ENVS))
endif

ENV_FILE ?= .env.$(ENV)

# Runtime env_file paths are resolved relative to the compose file directory.
# Default assumes compose files in deploy/compose and env files in repo root.
RUNTIME_ENV_FILE ?= $(if $(filter /%,$(ENV_FILE)),$(ENV_FILE),../../$(ENV_FILE))
export RUNTIME_ENV_FILE

COMPOSE := docker compose \
	--env-file $(ENV_FILE) \
	$(if $(PROFILE),--profile $(PROFILE),)

COMPOSE_SERVICES = $(shell $(COMPOSE) config --services)

# Optional extra args for any docker target, e.g. ARGS="--tail=200"
ARGS ?=

# Per-command defaults that can be overridden, e.g. LOGS_ARGS="--tail=200"
PS_ARGS ?= -a
UP_ARGS ?= -d
DOWN_ARGS ?= 
BUILD_ARGS ?= --pull --build-arg ENV=$(ENV)
LOGS_ARGS ?=-f
CLEAN_ARGS ?= --remove-orphans --rmi=all
DEPLOY_ARGS ?= -d --remove-orphans --force-recreate --build --quiet-pull
SHELL_ARGS ?= /bin/sh

define assert-service
$(if $(filter $(1),$(COMPOSE_SERVICES)),,\
$(error Unknown service: $(1). Valid: $(COMPOSE_SERVICES)))
endef

define run-service
$(call assert-service,$*)
$(COMPOSE) $(1) $* $(2) $(ARGS)
endef

# ==============================================
# Docker Compose Usage & Info
# ==============================================
help:
	@echo ""
	@echo "Docker CLI"
	@echo "=========================="
	@echo "Global:"
	@echo "  make docker-up"
	@echo "  make docker-down"
	@echo "  make docker-build"
	@echo "  make docker-logs"
	@echo "  make docker-deploy"
	@echo ""
	@echo "Service:"
	@echo "  make docker-build-web"
	@echo "  make docker-up-api"
	@echo "  make docker-logs-worker"
	@echo "  make docker-shell-web"
	@echo ""
	@echo "Env:"
	@echo "  ENV=staging PROFILE=deploy make docker-up"
	@echo ""
	@echo "Args:"
	@echo "  make docker-logs ARGS=\"--tail=200\""
	@echo "  make docker-logs LOGS_ARGS=\"\" ARGS=\"--tail=200\""
	@echo "  make docker-up-server ARGS=\"--no-deps\""
docker-services:
	@echo "Available services: $(COMPOSE_SERVICES)"
docker-info:
	@echo "ENV=$(ENV)"
	@echo "ENV_FILE=$(ENV_FILE)"
	@echo "RUNTIME_ENV_FILE=$(RUNTIME_ENV_FILE)"
	@echo "COMPOSE=$(COMPOSE)"

# ==============================================
# Stack-level Commands
# ==============================================
docker-ps:
	$(COMPOSE) ps $(PS_ARGS) $(ARGS)
docker-up:
	$(COMPOSE) up $(UP_ARGS) $(ARGS)
docker-down:
	$(COMPOSE) down $(DOWN_ARGS) $(ARGS)
docker-build:
	$(COMPOSE) build $(BUILD_ARGS) $(ARGS)
docker-logs:
	$(COMPOSE) logs $(LOGS_ARGS) $(ARGS)
docker-clean:
	$(COMPOSE) down $(CLEAN_ARGS) $(ARGS)
docker-deploy:
	$(COMPOSE) up $(DEPLOY_ARGS) $(ARGS)

# ==============================================
# Service-level Commands
# ==============================================
docker-ps-%:
	$(call run-service,ps,$(PS_ARGS))
docker-build-%:
	$(call run-service,build,$(BUILD_ARGS))
docker-up-%:
	$(call run-service,up,$(UP_ARGS))
docker-logs-%:
	$(call run-service,logs,$(LOGS_ARGS))
docker-shell-%:
	$(call run-service,exec,$(SHELL_ARGS))
