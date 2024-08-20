'use client';

import { forwardRef } from 'react';
import './ItemColumn.scss';

// @ts-ignore
const ItemColumn = forwardRef(function ItemColumn({ product }, ref) {
	return (
		<a href={`/product/${product._id}`} ref={ref} className="item-column">
			<div className={ref ? `box-border` : ''}>
				<img src={`../products/${product?._id}.png`} alt="card-jordan" />
			</div>
		</a>
	);
});

export default ItemColumn;
