'use client';

import Button from '../shared/Button';
import SvgDownArrow from '../shared/svgs/SvgDownArrow';

const DownButton = () => {
	const history = new History();
	return (
		<Button
			shape="rect"
			size="l"
			// @ts-ignore
			onClick={() => history.back()}
			type="button"
		>
			<SvgDownArrow size="2.5rem" color="white" />
		</Button>
	);
};

export default DownButton;
