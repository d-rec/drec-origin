import { defineConfig } from 'vitepress';
import { generateSidebar } from 'vitepress-sidebar';
import { withMermaid } from 'vitepress-plugin-mermaid';

// https://vitepress-sidebar.jooy2.com/getting-started
const vitepressSidebarOptions = {
  excludeFiles: ['README.md'],
  excludeFilesByFrontmatterFieldName: 'exclude',
  sortMenusByFrontmatterOrder: true,
  useFolderTitleFromIndexFile: true,
  useTitleFromFileHeading: true,
  useTitleFromFrontmatter: true,
};

// https://vitepress.dev/reference/site-config
export default withMermaid(
  defineConfig({
    title: 'D-REC Docs',
    description:
      'Documentation for the D-REC (Distributed Renewable Energy Certificates) platform',

    head: [['link', { rel: 'icon', type: 'image/png', href: 'favicon.png' }]],

    // For hosting on Github pages
    // https://vitepress.dev/guide/deploy#github-pages
    base: '/drec-origin/',
    vite: {
      publicDir: '.public',
    },
    srcExclude: ['README.md'],
    ignoreDeadLinks: 'localhostLinks',

    markdown: {
      math: true,
    },

    themeConfig: {
      // https://vitepress.dev/reference/default-theme-config
      logo: '/D-REC-banner.png',
      nav: [
        { text: 'Home', link: '/' },
        { text: 'Documentation', link: '/introduction/technology-overview' },
      ],
      footer: {
        message: 'Built with VitePress ❤️.',
        copyright: `Copyright © ${new Date().getFullYear()} D-REC Initiative.`,
      },

      sidebar: generateSidebar(vitepressSidebarOptions),

      socialLinks: [
        { icon: 'github', link: 'https://github.com/d-rec/drec-origin' },
      ],

      search: {
        provider: 'local',
      },
    },
  }),
);
