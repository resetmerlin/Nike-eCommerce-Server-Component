'use client';

import Button from '../shared/Button';
import SvgDownArrow from '../shared/svgs/SvgDownArrow';

const DownButton = () => {
	return (
		<Button shape="rect" size="l" type="button">
			<SvgDownArrow size="2.5rem" color="white" />
		</Button>
	);
};

export default DownButton;
