const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const repoRoot = path.join(__dirname, '..');
const solarSystemDataPath = path.join(repoRoot, 'src', 'data', 'solarSystemData.ts');
const solarSystemDataSource = fs.readFileSync(solarSystemDataPath, 'utf8');
const sourceFile = ts.createSourceFile(
  solarSystemDataPath,
  solarSystemDataSource,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS,
);

const runtimeTextureFields = new Set(['textureUrl', 'cloudsMapUrl', 'ringTextureUrl']);
const textureSegment = '/textures/';
const syntheticBaseUrl = '/__base__';

function getPropertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    return node.text;
  }

  return null;
}

function getStringLiteralValue(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  return null;
}

function isImportMetaEnvBaseUrlAccess(node) {
  return (
    ts.isPropertyAccessExpression(node) &&
    node.name.text === 'BASE_URL' &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === 'env' &&
    ts.isMetaProperty(node.expression.expression) &&
    node.expression.expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
    node.expression.expression.name.text === 'meta'
  );
}

function findTextureMapValues(ast) {
  const scope = new Map();

  const values = new Map();

  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.initializer &&
        declaration.name.text === 'textureBaseUrl'
      ) {
        assert.ok(
          ts.isTemplateExpression(declaration.initializer) &&
            declaration.initializer.head.text === '' &&
            declaration.initializer.templateSpans.length === 1 &&
            isImportMetaEnvBaseUrlAccess(declaration.initializer.templateSpans[0].expression) &&
            declaration.initializer.templateSpans[0].literal.text === 'textures',
          'Expected textureBaseUrl to be derived from import.meta.env.BASE_URL and append "textures"',
        );

        const value = resolveRuntimeUrl(declaration.initializer, scope);
        assert.ok(value, 'Expected textureBaseUrl to resolve to a local path');
        scope.set('textureBaseUrl', value);
      }

      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === 'textureMap' &&
        declaration.initializer &&
        ts.isObjectLiteralExpression(declaration.initializer)
      ) {
        for (const property of declaration.initializer.properties) {
          if (!ts.isPropertyAssignment(property)) {
            continue;
          }

          const key = getPropertyName(property.name);
          const value = resolveRuntimeUrl(property.initializer, scope);

          assert.ok(key, 'Expected a named property in textureMap');
          assert.ok(value, `Expected textureMap.${key} to resolve to a local path`);
          values.set(key, value);
        }
      }
    }
  }

  assert.ok(values.size > 0, 'Expected textureMap values in src/data/solarSystemData.ts');
  return values;
}

function resolveRuntimeUrl(expression, textureMapValues) {
  const directValue = getStringLiteralValue(expression);
  if (directValue) {
    return directValue;
  }

  if (
    ts.isIdentifier(expression) &&
    textureMapValues instanceof Map &&
    textureMapValues.has(expression.text)
  ) {
    return textureMapValues.get(expression.text) ?? null;
  }

  if (
    ts.isPropertyAccessExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    expression.expression.text === 'textureMap'
  ) {
    const textureKey = expression.name.text;
    return textureMapValues.get(textureKey) ?? null;
  }

  if (
    ts.isTemplateExpression(expression) &&
    expression.templateSpans.length === 1 &&
    ts.isIdentifier(expression.templateSpans[0].expression)
  ) {
    const baseIdentifier = expression.templateSpans[0].expression.text;
    const baseValue = textureMapValues.get(baseIdentifier);
    if (typeof baseValue === 'string') {
      return `${baseValue}${expression.templateSpans[0].literal.text}`;
    }
  }

  if (
    ts.isNoSubstitutionTemplateLiteral(expression) &&
    expression.text === '${import.meta.env.BASE_URL}textures'
  ) {
    return `${syntheticBaseUrl}${textureSegment.slice(0, -1)}`;
  }

  if (
    ts.isTemplateExpression(expression) &&
    expression.head.text === '' &&
    expression.templateSpans.length === 1 &&
    expression.templateSpans[0].literal.text === 'textures' &&
    ts.isPropertyAccessExpression(expression.templateSpans[0].expression)
  ) {
    return `${syntheticBaseUrl}${textureSegment.slice(0, -1)}`;
  }

  return null;
}

function findRuntimeTextureUsages(ast, textureMapValues) {
  const usages = [];

  const visit = (node) => {
    if (ts.isPropertyAssignment(node) && runtimeTextureFields.has(getPropertyName(node.name))) {
      const parent = node.parent;
      const planetId = ts.isObjectLiteralExpression(parent)
        ? parent.properties.find(
            (property) =>
              ts.isPropertyAssignment(property) &&
              getPropertyName(property.name) === 'id' &&
              getStringLiteralValue(property.initializer),
          )
        : null;

      const resolvedUrl = resolveRuntimeUrl(node.initializer, textureMapValues);
      usages.push({
        field: getPropertyName(node.name),
        planetId:
          planetId && ts.isPropertyAssignment(planetId)
            ? getStringLiteralValue(planetId.initializer)
            : null,
        resolvedUrl,
      });
    }

    ts.forEachChild(node, visit);
  };

  visit(ast);

  return usages;
}

test('runtime texture URLs use only local texture paths and files exist under public/', () => {
  const textureMapValues = findTextureMapValues(sourceFile);
  const runtimeTextureUsages = findRuntimeTextureUsages(sourceFile, textureMapValues);

  assert.ok(runtimeTextureUsages.length > 0, 'Expected runtime texture URL usages in solarSystemData');

  for (const usage of runtimeTextureUsages) {
    assert.ok(
      usage.resolvedUrl,
      `Expected to resolve ${usage.field} for ${usage.planetId ?? 'unknown planet'}`,
    );

    assert.match(
      usage.resolvedUrl,
      /textures\/.+/,
      `Expected ${usage.field} for ${usage.planetId ?? 'unknown planet'} to use a local texture path, got ${usage.resolvedUrl}`,
    );

    assert.doesNotMatch(
      usage.resolvedUrl,
      /^https?:\/\//,
      `Expected ${usage.field} for ${usage.planetId ?? 'unknown planet'} to avoid remote URLs, got ${usage.resolvedUrl}`,
    );

    const textureRelativePath = usage.resolvedUrl.slice(
      usage.resolvedUrl.indexOf(textureSegment) + textureSegment.length,
    );
    const textureFilePath = path.join(repoRoot, 'public', 'textures', textureRelativePath);
    assert.ok(
      fs.existsSync(textureFilePath),
      `Expected file for ${usage.field} for ${usage.planetId ?? 'unknown planet'} to exist at ${textureFilePath}`,
    );
  }
});
