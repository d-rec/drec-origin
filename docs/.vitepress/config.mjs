import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: 'D-REC Docs',
    description: 'Documentation for the D-REC (Distributed Renewable Energy Certificates) platform',

    /* prettier-ignore */
    head: [
      ['link', { rel: 'icon', type: 'image/png', href: 'favicon.png' }],
    ],

    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        logo: 'img/D-REC-banner.png',
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Documentation', link: '/introduction/technology-overview' }
        ],
        footer: {
            message: 'Built with VitePress ❤️.',
            copyright: `Copyright © ${new Date().getFullYear()} D-REC Initiative.`
        },

        sidebar: [
            {
                text: 'Introduction',
                items: [
                    { text: 'Technology Overview', link: '/introduction/technology-overview' },
                    {
                        text: 'DRE Project Developers',
                        link: '/introduction/dre-project-developers'
                    },
                    { text: 'REC Buyers', link: '/introduction/rec-buyers' }
                ]
            },
            {
                text: 'Usage Guide',
                items: [
                    { text: 'Buyer Manual', link: '/usage_guide/buyer-manual.md' },
                    {
                        text: 'Project Developer Manual',
                        link: '/usage_guide/project-developer-manual.md'
                    },
                    { text: 'API User Manual', link: '/usage_guide/api-user-manual' }
                ]
            },
            {
                text: 'Developer Documentation',
                items: [
                    { text: 'Function Requirements', link: '/dev_docs/functional-requirements' },
                    { text: 'Developer Onboarding', link: '/dev_docs/developer-onboarding' },
                    { text: 'ACL Module', link: '/dev_docs/ACL-module' }
                ]
            }
        ],

        socialLinks: [{ icon: 'github', link: 'https://github.com/d-rec/drec-origin' }]
    }
});
