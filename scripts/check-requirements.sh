#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Icons
CHECK="✓"
CROSS="✗"
INFO="ℹ"
ROCKET="🚀"

echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${BLUE}   KAIROS FITNESS - Verificación de Requisitos${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Track if all checks pass
ALL_PASSED=true

# Check Node.js version
echo -e "${BOLD}Verificando Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    REQUIRED_VERSION="v18.18.0"

    # Extract major and minor version
    CURRENT_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    CURRENT_MINOR=$(echo $NODE_VERSION | cut -d'.' -f2)
    REQUIRED_MAJOR=$(echo $REQUIRED_VERSION | cut -d'.' -f1 | sed 's/v//')
    REQUIRED_MINOR=$(echo $REQUIRED_VERSION | cut -d'.' -f2)

    if [ "$CURRENT_MAJOR" -gt "$REQUIRED_MAJOR" ] || ([ "$CURRENT_MAJOR" -eq "$REQUIRED_MAJOR" ] && [ "$CURRENT_MINOR" -ge "$REQUIRED_MINOR" ]); then
        echo -e "${GREEN}${CHECK} Node.js${NC} ${NODE_VERSION} (Requerido: >=${REQUIRED_VERSION})"
    else
        echo -e "${RED}${CROSS} Node.js${NC} ${NODE_VERSION} es muy antiguo (Requerido: >=${REQUIRED_VERSION})"
        ALL_PASSED=false
    fi
else
    echo -e "${RED}${CROSS} Node.js no está instalado${NC}"
    echo -e "${YELLOW}${INFO} Instala Node.js desde: https://nodejs.org${NC}"
    ALL_PASSED=false
fi

# Check pnpm
echo -e "${BOLD}Verificando pnpm...${NC}"
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm -v)
    echo -e "${GREEN}${CHECK} pnpm${NC} ${PNPM_VERSION}"
else
    echo -e "${YELLOW}${CROSS} pnpm no está instalado${NC}"
    echo -e "${YELLOW}${INFO} Instalando pnpm...${NC}"
    npm install -g pnpm
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}${CHECK} pnpm instalado exitosamente${NC}"
    else
        echo -e "${RED}${CROSS} Error al instalar pnpm${NC}"
        ALL_PASSED=false
    fi
fi

# Check if node_modules exists
echo -e "${BOLD}Verificando dependencias...${NC}"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}${CHECK} node_modules${NC} existe"
else
    echo -e "${YELLOW}${CROSS} node_modules no existe${NC}"
    echo -e "${YELLOW}${INFO} Se instalarán las dependencias...${NC}"
fi

# Check for .env.local
echo -e "${BOLD}Verificando configuración...${NC}"
if [ -f ".env.local" ]; then
    echo -e "${GREEN}${CHECK} .env.local${NC} configurado"

    # Check for critical env vars
    if grep -q "DATABASE_URL=" .env.local && grep -q "NEXTAUTH_SECRET=" .env.local; then
        echo -e "${GREEN}${CHECK} Variables críticas${NC} presentes"
    else
        echo -e "${YELLOW}⚠ Algunas variables de entorno pueden faltar${NC}"
        echo -e "${YELLOW}${INFO} Revisa .env.example para la configuración completa${NC}"
    fi
else
    echo -e "${YELLOW}${CROSS} .env.local no encontrado${NC}"
    echo -e "${YELLOW}${INFO} Copiando .env.example a .env.local...${NC}"
    cp .env.example .env.local
    echo -e "${GREEN}${CHECK} .env.local creado${NC}"
    echo -e "${YELLOW}${INFO} Edita .env.local con tus credenciales antes de continuar${NC}"
fi

# Check if Prisma client is generated
echo -e "${BOLD}Verificando Prisma...${NC}"
if [ -d "node_modules/.prisma/client" ]; then
    echo -e "${GREEN}${CHECK} Prisma Client${NC} generado"
else
    echo -e "${YELLOW}${CROSS} Prisma Client no está generado${NC}"
    echo -e "${YELLOW}${INFO} Se generará durante pnpm install${NC}"
fi

echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$ALL_PASSED" = true ]; then
    echo -e "${GREEN}${BOLD}${CHECK} Todos los requisitos están satisfechos${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}${BOLD}${CROSS} Algunos requisitos no se cumplen${NC}"
    echo -e "${YELLOW}${INFO} Por favor, resuelve los problemas antes de continuar${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    exit 1
fi
