#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Icons
CHECK="✓"
ROCKET="🚀"
FIRE="🔥"
MUSCLE="💪"
GEAR="⚙️"
LINK="🔗"

# Clear screen for better visibility
clear

echo ""
echo -e "${BOLD}${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${MAGENTA}║                                                            ║${NC}"
echo -e "${BOLD}${MAGENTA}║     ${CYAN}${MUSCLE}  KAIROS FITNESS  ${MUSCLE}                               ${MAGENTA}║${NC}"
echo -e "${BOLD}${MAGENTA}║     ${CYAN}Entrenamiento Inteligente con IA${MAGENTA}                   ║${NC}"
echo -e "${BOLD}${MAGENTA}║                                                            ║${NC}"
echo -e "${BOLD}${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Run requirements check
echo -e "${BOLD}${BLUE}${GEAR}  Paso 1/4: Verificando requisitos...${NC}"
echo ""

if [ -f "scripts/check-requirements.sh" ]; then
    bash scripts/check-requirements.sh
    if [ $? -ne 0 ]; then
        echo ""
        echo -e "${RED}${BOLD}Abortando inicio debido a requisitos faltantes${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ Script de verificación no encontrado, continuando...${NC}"
fi

echo ""
echo -e "${BOLD}${BLUE}${GEAR}  Paso 2/4: Instalando dependencias...${NC}"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo -e "${CYAN}Ejecutando: pnpm install${NC}"
    pnpm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}${CHECK} Dependencias instaladas correctamente${NC}"
    else
        echo -e "${RED}Error al instalar dependencias${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}${CHECK} Dependencias ya instaladas${NC}"
fi

echo ""
echo -e "${BOLD}${BLUE}${GEAR}  Paso 3/4: Generando Prisma Client...${NC}"
echo ""

# Generate Prisma Client
if [ ! -d "node_modules/.prisma/client" ] || [ "prisma/schema.prisma" -nt "node_modules/.prisma/client" ]; then
    echo -e "${CYAN}Ejecutando: pnpm db:generate${NC}"
    pnpm db:generate
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}${CHECK} Prisma Client generado correctamente${NC}"
    else
        echo -e "${YELLOW}⚠ Prisma Client no pudo generarse (continuando...)${NC}"
    fi
else
    echo -e "${GREEN}${CHECK} Prisma Client ya está actualizado${NC}"
fi

echo ""
echo -e "${BOLD}${BLUE}${GEAR}  Paso 4/4: Iniciando servidor de desarrollo...${NC}"
echo ""

# Get the port (default to 3000)
PORT=${PORT:-3000}

# Success banner
clear
echo ""
echo -e "${BOLD}${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║                                                            ║${NC}"
echo -e "${BOLD}${GREEN}║  ${ROCKET}  ${BOLD}${WHITE}¡SERVIDOR INICIADO EXITOSAMENTE!${GREEN}  ${ROCKET}               ║${NC}"
echo -e "${BOLD}${GREEN}║                                                            ║${NC}"
echo -e "${BOLD}${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}${CYAN}${FIRE}  KAIROS FITNESS está listo para entrenar${NC}"
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Accede a la aplicación:${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${LINK}  ${BOLD}${CYAN}Local:${NC}          http://localhost:${PORT}"
echo -e "  ${LINK}  ${BOLD}${CYAN}Network:${NC}        http://$(ipconfig getifaddr en0 2>/dev/null || hostname):${PORT}"
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Rutas disponibles:${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${MUSCLE}  ${CYAN}/auth${NC}            - Inicio de sesión y registro"
echo -e "  ${MUSCLE}  ${CYAN}/demo${NC}            - Dashboard demo"
echo -e "  ${MUSCLE}  ${CYAN}/workout${NC}         - Editor de entrenamientos ${GREEN}(con autosave Redis)${NC}"
echo -e "  ${MUSCLE}  ${CYAN}/progress${NC}        - Gráficos de progreso"
echo -e "  ${MUSCLE}  ${CYAN}/calendar${NC}        - Calendario de entrenamientos"
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Funcionalidades:${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}${CHECK}${NC}  Autenticación (NextAuth + Google OAuth)"
echo -e "  ${GREEN}${CHECK}${NC}  Autosave en Redis cada 2 segundos"
echo -e "  ${GREEN}${CHECK}${NC}  Editor de entrenamientos interactivo"
echo -e "  ${GREEN}${CHECK}${NC}  Gráficos de progreso (5 métricas)"
echo -e "  ${GREEN}${CHECK}${NC}  Calendario con reprogramación"
echo -e "  ${GREEN}${CHECK}${NC}  Navegación responsive con sidebar"
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Documentación:${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  📚  ${YELLOW}README.md${NC}                    - Documentación general"
echo -e "  📚  ${YELLOW}REDIS_AUTOSAVE_README.md${NC}     - Guía de autosave"
echo -e "  📚  ${YELLOW}COMPONENTS_GUIDE.md${NC}          - Componentes principales"
echo -e "  📚  ${YELLOW}NAVIGATION_GUIDE.md${NC}          - Estructura de rutas"
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BOLD}${GREEN}${MUSCLE}  ¡Entrena duro! Presiona Ctrl+C para detener el servidor${NC}"
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BOLD}${YELLOW}Logs del servidor:${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Start the development server
pnpm dev:next
