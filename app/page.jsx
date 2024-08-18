import { Suspense } from 'react';
import Home from '../components/Home/index.jsx';
import '../components/shared/global.scss';
import { getAllProducts } from '../data/db.js';

export async function HomePage() {
	const products = await getAllProducts();
	return <Home products={products}></Home>;
}
export default async function Page() {
	return (
		<Suspense fallback="data is loading...">
			<HomePage />
		</Suspense>
	);
}
