// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    ignores: ['.github/copilot-instructions.md'],
  },
  {
    name: 'project/code-whitespace',
    files: ['**/*.{js,mjs,cjs,ts,vue}'],
    rules: {
      'no-trailing-spaces': ['error', {
        skipBlankLines: false,
        ignoreComments: false,
      }],
    },
  },
  {
    name: 'project/vue-template-attributes',
    files: ['**/*.vue'],
    rules: {
      'vue/first-attribute-linebreak': ['error', {
        singleline: 'beside',
        multiline: 'below',
      }],
      'vue/attributes-order': 'error',
      'vue/html-indent': ['error', 2, {
        attribute: 1,
        baseIndent: 1,
        closeBracket: 0,
        alignAttributesVertically: true,
      }],
      'vue/html-self-closing': ['error', {
        html: {
          void: 'never',
          normal: 'always',
          component: 'always',
        },
        svg: 'always',
        math: 'always',
      }],
      'vue/attribute-hyphenation': ['error', 'always'],
      'vue/no-template-shadow': 'error',
      'vue/max-attributes-per-line': ['error', {
        singleline: 1,
        multiline: 1,
      }],
    },
  },
)
