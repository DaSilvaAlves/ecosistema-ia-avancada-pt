#!/usr/bin/env sh
# ============================================================
# AIOX Git Hooks Setup — Instala hooks Husky em qualquer repo
# Usage: bash .aiox-core/scripts/setup-git-hooks.sh
# ============================================================

set -e

PROJECT_ROOT=$(pwd)
HUSKY_DIR="$PROJECT_ROOT/.husky"

echo "🔧 AIOX Git Hooks Setup"
echo "   Projeto: $PROJECT_ROOT"
echo ""

# 1. Verificar se é um repositório git
if ! git -C "$PROJECT_ROOT" status >/dev/null 2>&1; then
  echo "❌ Não é um repositório git. Execute 'git init' primeiro."
  exit 1
fi

# 2. Verificar package.json
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
  echo "⚠️  Sem package.json — a criar .husky manualmente (sem npm prepare)"
fi

# 3. Inicializar husky
echo "📦 Inicializando Husky..."
npx husky init 2>/dev/null || mkdir -p "$HUSKY_DIR"

# 4. Detectar framework dir (.aiox-core ou .aios-core)
AIOX_DIR=""
if [ -d "$PROJECT_ROOT/.aiox-core" ]; then
  AIOX_DIR=".aiox-core"
elif [ -d "$PROJECT_ROOT/.aios-core" ]; then
  AIOX_DIR=".aios-core"
fi

if [ -z "$AIOX_DIR" ]; then
  echo "⚠️  .aiox-core não encontrado — hooks sem integração AIOX"
fi

# 5. Criar pre-commit
cat > "$HUSKY_DIR/pre-commit" << HOOK
#!/usr/bin/env sh
echo "🔄 [AIOX] Pre-commit..."

# IDE sync (se .aiox-core presente)
if [ -f "$AIOX_DIR/infrastructure/scripts/ide-sync/index.js" ]; then
  node $AIOX_DIR/infrastructure/scripts/ide-sync/index.js sync --quiet
fi

# Lint-staged
npx lint-staged --allow-empty 2>/dev/null || true

echo "✅ [AIOX] Pre-commit done"
HOOK

# 6. Criar pre-push
cat > "$HUSKY_DIR/pre-push" << HOOK
#!/usr/bin/env sh
echo "🔍 [AIOX] Pre-push — registry sync..."

# IDS registry sync
if [ -f "$AIOX_DIR/hooks/ids-pre-push.js" ]; then
  node $AIOX_DIR/hooks/ids-pre-push.js
fi

echo "✅ [AIOX] Pre-push done"
HOOK

# 7. Criar post-commit
cat > "$HUSKY_DIR/post-commit" << HOOK
#!/usr/bin/env sh
# Post-commit (async — não bloqueia)
if [ -f "$AIOX_DIR/infrastructure/scripts/git-hooks/post-commit.js" ]; then
  node $AIOX_DIR/infrastructure/scripts/git-hooks/post-commit.js &
fi
if [ -f "$AIOX_DIR/hooks/ids-post-commit.js" ]; then
  node $AIOX_DIR/hooks/ids-post-commit.js &
fi
HOOK

# 8. Permissões
chmod +x "$HUSKY_DIR/pre-commit" "$HUSKY_DIR/pre-push" "$HUSKY_DIR/post-commit"

echo ""
echo "✅ Hooks instalados em .husky/:"
ls "$HUSKY_DIR/"
echo ""
echo "📋 Próximo passo: adicionar ao package.json (se ainda não tiver):"
echo '   "scripts": { "prepare": "husky" }'
