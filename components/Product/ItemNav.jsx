'use client';

import DownButton from './DownButton';
import ItemColumn from './ItemColumn';
import { useItemObserver } from './ItemNav.hook';

// @ts-ignore
const ItemNav = ({ products }) => {
	const { columnRef } = useItemObserver();

	let currentLocation = window.location;

	console.log(currentLocation);

	return (
		<div className="itemNav">
			<div className="itemNav__column">
				{products?.map((product) => (
					// @ts-ignore
					<ItemColumn ref={columnRef} key={product?._id} product={product} />
				))}
			</div>

			<DownButton />
		</div>
	);
};

export default ItemNav;
