import { useEffect, RefObject } from 'react';

export function useOutsideClick(
	ref: RefObject<HTMLElement | null>,
	onClickOutside: () => void
) {
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				onClickOutside();
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [ref, onClickOutside]);
}
