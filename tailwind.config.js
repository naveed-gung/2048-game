/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			backdropBlur: {
				sm: '4px',
				'2xl': '40px',
                '3xl': '64px'
			  },
			
			
		  },
		},
	plugins: [],
}
