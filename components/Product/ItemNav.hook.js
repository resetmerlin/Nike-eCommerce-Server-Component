'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Hook to observe a product column and trigger navigation to the next product page.
 *
 * @param columnRef - Ref object pointing to the item column.
 * @param goNextProductPage - Function to navigate to the next product page.
 */
export function useItemObserver() {
	const columnRef = useRef(null);

	const [isObserving, setIsObserving] = useState(false);

	useEffect(() => {
		const observer = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting && columnRef.current) {
				setIsObserving(entry.isIntersecting);
			}
		});
		if (columnRef.current) {
			observer.observe(columnRef.current);
		}

		return () => observer.disconnect();
	}, [isObserving, columnRef.current]);

	// Follow the observed column
	useEffect(() => {
		if (isObserving && columnRef.current) {
			// @ts-ignore
			columnRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'center',
				inline: 'start'
			});
		}
	}, [isObserving, columnRef.current]);

	return { columnRef };
}
