import { Suspense } from 'react';
import '../../components/shared/global.scss';
import { getAllProducts } from '../../data/db.js';
// must put jsx
import Product from '../../components/Product/index.jsx';

export async function ProductPage() {
	const products = await getAllProducts();
	return <Product products={products}></Product>;
}
export default async function Page() {
	return (
		<Suspense fallback="data is loading...">
			<ProductPage />
		</Suspense>
	);
}
