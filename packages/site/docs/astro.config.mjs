import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.nhex.dev',
	integrations: [
		starlight({
			favicon: '/favicon.svg',
			title: 'nhex docs',
			social: {
				github: 'https://github.com/nhexirc/nhex',
			},
			sidebar: [
				{
					label: 'Guides',
					autogenerate: { directory: 'guides' },
				},
				{
					label: 'Troubleshooting',
					autogenerate: { directory: 'troubleshooting' },
				},
			],
		}),
	],
});
