import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";

import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  site: 'https://nhexirc.com/docs',
  integrations: [tailwind(), starlight({
      title: 'nhex irc client',
      logo: {
        src: '/public/favicon.svg',
      },
			social: {
				github: 'https://github.com/nhexirc/nhex',
			},
			sidebar: [
				{ label: 'nhex docs', link: 'docs/' },
				{
					label: 'Guides',
					autogenerate: { directory: 'docs/guides' },
				},
				{
					label: 'Troubleshooting',
					autogenerate: { directory: 'docs/troubleshooting' },
				},
			],
    })],
});
