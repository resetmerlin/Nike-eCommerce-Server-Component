// @ts-nocheck
import { Suspense } from 'react';
import '../../components/shared/global.scss';
import { getAllProducts } from '../../data/db.js';
import Home from '../../components/Home/index.jsx';

export async function HomePage() {
	const products = await getAllProducts();
	const threeProducts = products.slice(0, 3);
	return <Home products={threeProducts}></Home>;
}
export default async function Page() {
	return (
		<Suspense fallback="data is loading...">
			<HomePage />
		</Suspense>
	);
}
