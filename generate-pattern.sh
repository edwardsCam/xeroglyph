#!/bin/bash

read -p 'Pattern name (kebab-case): ' kebab
read -p 'Pattern name (camelCase): ' camel
read -p 'Pattern name (PascalCase): ' pascal
read -p 'Pattern name (Human Friendly): ' hooman

export KEBAB=$kebab
export CAMEL=$camel
export PASCAL=$pascal
export HOOMAN=$hooman

if [ -d "src/patterns/$KEBAB" ]; then
  echo Oops! Pattern $KEBAB exists!
  exit 1
fi

mkdir "src/patterns/$KEBAB"
touch "src/patterns/$KEBAB/index.ts"
cp template.ts "src/patterns/$KEBAB/index.ts"
find "src/patterns/$KEBAB" -type f -exec sed -i '' "s/\${PATTERN}/$CAMEL/g" '{}' \;

echo "$CAMEL: {" >> src/components/helpModal.tsx
echo "  title: '$HOOMAN'," >> src/components/helpModal.tsx
echo "  instructions: []," >> src/components/helpModal.tsx
echo "  description: []," >> src/components/helpModal.tsx
echo "}," >> src/components/helpModal.tsx

echo "import $PASCAL from 'patterns/$KEBAB/index.ts'" >> src/index.tsx
echo "$CAMEL: {" >> src/index.tsx
echo "  label: '$HOOMAN'," >> src/index.tsx
echo "  component: $PASCAL," >> src/index.tsx
echo "}," >> src/index.tsx
