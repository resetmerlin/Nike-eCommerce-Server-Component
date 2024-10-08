/**
 * SvgCartAlt component renders an SVG icon of a shopping cart.
 *
 * This component allows customization of its size and color through props.
 *
 * @param {object} props - The properties passed to the component.
 * @param {string} [props.size='1rem'] - The size of the SVG icon.
 * @param {string} [props.color='black'] - The color of the SVG icon.
 * @returns {JSX.Element} The rendered SVG icon.
 */
function SvgCartAlt({ size = '1rem', color = 'black' }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			style={{
				fill: color
			}}
		>
			<path d="M21 4H2v2h2.3l3.28 9a3 3 0 0 0 2.82 2H19v-2h-8.6a1 1 0 0 1-.94-.66L9 13h9.28a2 2 0 0 0 1.92-1.45L22 5.27A1 1 0 0 0 21.27 4 .84.84 0 0 0 21 4zm-2.75 7h-10L6.43 6h13.24z" />
			<circle cx={10.5} cy={19.5} r={1.5} />
			<circle cx={16.5} cy={19.5} r={1.5} />
		</svg>
	);
}

export default SvgCartAlt;
