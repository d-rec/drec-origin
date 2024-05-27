// Essentially a copy of
// https://github.com/mermaid-js/mermaid/blob/develop/packages/mermaid/src/docs/.vitepress/mermaid-markdown-all.ts

const MermaidExample = async (md) => {
  const defaultRenderer = md.renderer.rules.fence;

  if (!defaultRenderer) {
    throw new Error('defaultRenderer is undefined');
  }

  md.renderer.rules.fence = (tokens, index, options, env, slf) => {
    const token = tokens[index];
    const language = token.info.trim();
    if (language.startsWith('mermaid')) {
      const key = index;
      return `
      <Suspense>
      <template #default>
      <Mermaid id="mermaid-${key}" :showCode="${
        language === 'mermaid-example'
      }" graph="${encodeURIComponent(token.content)}"></Mermaid>
      </template>
        <!-- loading state via #fallback slot -->
        <template #fallback>
          Loading...
        </template>
      </Suspense>
`;
    } else if (language === 'mmd') {
      // Allow to write fences to highlight mermaid code itself
      tokens[index].info = 'mermaid';
    }

    return defaultRenderer(tokens, index, options, env, slf);
  };
};

// https://vitepress.dev/reference/site-config#markdown
const MermaidMarkdownOptionTransformer = {
  config: async (md) => {
    await MermaidExample(md);
  },
};

export default MermaidMarkdownOptionTransformer;
