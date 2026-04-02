// https://vitepress.dev/guide/custom-theme
import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';
import './custom.css';

import { YouTubeEmbed } from '@miletorix/vitepress-youtube-embed';
import '@miletorix/vitepress-youtube-embed/style.css';

/** @type {import('vitepress').Theme} */
export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    });
  },
  enhanceApp({ app, router, siteData }) {
    app.component('YouTubeEmbed', YouTubeEmbed);
  },
};
