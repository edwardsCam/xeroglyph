const ignore = rules => withSeverity(rules, 0)
const warn   = rules => withSeverity(rules, 1)
const error  = rules => withSeverity(rules, 2)

const withSeverity = (rules, severity) => (
  rules.reduce((obj, entry) => {
    if (typeof entry === 'string') {
      obj[entry] = severity
    } else {
      const rule = entry[0]
      const options = entry.slice(1)
      obj[rule] = [ severity, ...options ]
    }
    return obj
  }, {})
)

module.exports = {
  extends: [
    'standard',
    'eslint:recommended',
    'airbnb',
    'plugin:react/recommended',
    'prettier',
  ],
  parser: 'babel-eslint',
  plugins: [
    'react',
    'standard',
    'prefer-import',
    'prettier',
  ],
  rules: {
    ...ignore([
      'array-bracket-spacing',
      'class-methods-use-this',
      'comma-dangle',
      'curly',
      'default-case',
      'eqeqeq',
      'func-names',
      'function-paren-newline',
      'implicit-arrow-linebreak',
      'import/extensions',
      'import/no-dynamic-require',
      'import/no-unresolved',
      'import/prefer-default-export',
      'indent',
      'jsx-a11y/control-has-associated-label',
      'jsx-a11y/label-has-associated-control',
      'jsx-a11y/no-autofocus',
      'jsx-a11y/no-autofocus',
      'jsx-quotes',
      'lines-between-class-members',
      'max-classes-per-file',
      'max-params',
      'no-bitwise',
      'no-confusing-arrow',
      'no-continue',
      'no-plusplus',
      'no-return-assign',
      'no-underscore-dangle',
      'nonblock-statement-body-position',
      'object-curly-newline',
      'one-var',
      'operator-linebreak',
      'prefer-arrow-callback',
      'prefer-rest-params',
      'react/boolean-prop-naming',
      'react/button-has-type',
      'react/destructuring-assignment',
      'react/jsx-curly-brace-presence',
      'react/no-array-index-key',
      'react/no-children-prop',
      'react/prefer-stateless-function',
      'react/prop-types',
      'react/require-default-props',
      'react/sort-comp',
      'valid-jsdoc',
    ]),
    ...error([
      'array-callback-return',
      'arrow-spacing',
      ['arrow-parens', 'as-needed'],
      'block-spacing',
      'brace-style',
      'comma-style',
      'computed-property-spacing',
      'dot-location',
      'eol-last',
      'func-call-spacing',
      'func-name-matching',
      'no-catch-shadow',
      ['no-console', { allow: [ 'warn', 'error' ] }],
      'no-duplicate-imports',
      'no-implicit-globals',
      'no-mixed-requires',
      ['no-param-reassign', { props: false }],
      'no-script-url',
      'no-trailing-spaces',
      'no-useless-rename',
      ['no-use-before-define', { functions: false }],
      'no-whitespace-before-property',
      ['object-curly-spacing', 'always'],
      'prefer-import/prefer-import-over-require',
      'prettier/prettier',
      'react/default-props-match-prop-types',
      'react/no-typos',
      'react/no-unused-prop-types',
      'react/no-unused-state',
      'react/prefer-es6-class',
      'react/style-prop-object',
      'react/jsx-closing-bracket-location',
      'react/jsx-closing-tag-location',
      ['react/jsx-filename-extension', { extensions: ['.js', '.jsx'] }],
      ['react/jsx-first-prop-new-line', 'multiline'],
      ['react/jsx-indent', 2],
      ['react/jsx-indent-props', 2],
      'react/jsx-one-expression-per-line',
      'react/jsx-tag-spacing',
      ['react/jsx-wrap-multilines', {
          declaration: 'parens-new-line',
          assignment: 'parens-new-line',
          return: 'parens-new-line',
          arrow: 'parens-new-line',
          condition: 'parens-new-line',
          logical: 'parens-new-line',
          prop: 'parens-new-line',
      }],
      'rest-spread-spacing',
      ['semi', 'never'],
      ['space-before-function-paren', 'never'],
      'wrap-iife',
    ]),
  },
  settings: {
    polyfills: [
      "Promise",
      "Object.assign",
      "Object.values"
    ]
  }
};
