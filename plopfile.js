/**
 * Plop.js Code Generator Configuration
 * Scaffolding tool for consistent file structure
 * 
 * Usage:
 * pnpm generate component Button
 * pnpm generate page dashboard
 * pnpm generate api bookings
 */

export default function (plop) {
  // Component generator
  plop.setGenerator('component', {
    description: 'Create a new React component',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Component name (PascalCase):',
        validate: (value) => {
          if (!value) return 'Component name is required';
          if (!/^[A-Z]/.test(value)) return 'Component name must start with uppercase';
          return true;
        },
      },
      {
        type: 'confirm',
        name: 'withTest',
        message: 'Include test file?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'withStory',
        message: 'Include Storybook story?',
        default: false,
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'components/{{kebabCase name}}/{{pascalCase name}}.tsx',
        templateFile: 'templates/component.hbs',
      },
      {
        type: 'add',
        path: 'components/{{kebabCase name}}/index.ts',
        templateFile: 'templates/component-index.hbs',
      },
      {
        type: 'add',
        path: 'components/{{kebabCase name}}/{{pascalCase name}}.test.tsx',
        templateFile: 'templates/component-test.hbs',
        skip: (data) => !data.withTest,
      },
      {
        type: 'add',
        path: 'components/{{kebabCase name}}/{{pascalCase name}}.stories.tsx',
        templateFile: 'templates/component-story.hbs',
        skip: (data) => !data.withStory,
      },
    ],
  });

  // Page generator
  plop.setGenerator('page', {
    description: 'Create a new Next.js page',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Page name (kebab-case, e.g., dashboard, booking-list):',
        validate: (value) => {
          if (!value) return 'Page name is required';
          return true;
        },
      },
      {
        type: 'confirm',
        name: 'withLayout',
        message: 'Include layout file?',
        default: false,
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'app/{{kebabCase name}}/page.tsx',
        templateFile: 'templates/page.hbs',
      },
      {
        type: 'add',
        path: 'app/{{kebabCase name}}/layout.tsx',
        templateFile: 'templates/page-layout.hbs',
        skip: (data) => !data.withLayout,
      },
    ],
  });

  // API route generator
  plop.setGenerator('api', {
    description: 'Create a new API route',
    prompts: [
      {
        type: 'input',
        name: 'path',
        message: 'API path (e.g., bookings, payments/verify):',
        validate: (value) => {
          if (!value) return 'API path is required';
          return true;
        },
      },
      {
        type: 'list',
        name: 'method',
        message: 'HTTP Method:',
        choices: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        default: 'GET',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'app/api/{{kebabCase path}}/route.ts',
        templateFile: 'templates/api-route.hbs',
      },
    ],
  });
}

