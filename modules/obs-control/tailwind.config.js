/** @type {import('tailwindcss').Config} */
export default {
	content: ['./routes/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: '#1f2937',
				accent: '#3b82f6'
			}
		}
	},
	plugins: []
};
