'use client';

import { TimeMagic } from '@md-oss/common';
import { mergePropsWithClassName } from '@md-oss/design-system/lib/utils';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';

export type DateRendererProps = {
	date: Date | string | number;
	locale?: string;
	withSeconds?: boolean;
	forceRelative?: boolean;
	lowercase?: boolean;
	className?: string;
} & React.HTMLAttributes<HTMLTimeElement>;

export function DateRenderer({
	date,
	locale = typeof window !== 'undefined' ? navigator.language : 'en-US',
	withSeconds = true,
	forceRelative = false,
	lowercase = false,
	className,
	...props
}: DateRendererProps): React.JSX.Element {
	const targetDate = useMemo(() => {
		const parsed = date instanceof Date ? date : new Date(date);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}, [date]);

	const [now, setNow] = useState(() => new Date());

	useEffect(() => {
		if (!targetDate) return;

		const diffMs = targetDate.getTime() - now.getTime();
		const absDiffSec = Math.abs(diffMs) / TimeMagic.MILLISECONDS_PER_SECOND;

		const refreshInterval =
			absDiffSec < 60
				? TimeMagic.MILLISECONDS_PER_SECOND
				: absDiffSec < 3600
					? TimeMagic.MILLISECONDS_PER_MINUTE
					: absDiffSec < 86400
						? TimeMagic.MILLISECONDS_PER_HOUR
						: TimeMagic.MILLISECONDS_PER_DAY;

		const id = setInterval(() => setNow(new Date()), refreshInterval);
		return () => clearInterval(id);
	}, [targetDate, now]);

	const formatted = useMemo(() => {
		if (!targetDate) return 'Invalid date';

		const diffMs = now.getTime() - targetDate.getTime();
		const isFuture = diffMs < 0;
		const absDiffMs = Math.abs(diffMs);

		const diffSec = Math.floor(absDiffMs / TimeMagic.MILLISECONDS_PER_SECOND);
		const diffMin = Math.floor(diffSec / TimeMagic.SECONDS_PER_MINUTE);
		const diffHr = Math.floor(diffMin / TimeMagic.MINUTES_PER_HOUR);
		const diffDays = Math.floor(diffHr / TimeMagic.HOURS_PER_DAY);

		const isSameDay = now.toDateString() === targetDate.toDateString();
		const isYesterday =
			new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate() - 1
			).toDateString() === targetDate.toDateString();
		const isTomorrow =
			new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate() + 1
			).toDateString() === targetDate.toDateString();

		const timeOnly = new Intl.DateTimeFormat(locale, {
			hour: 'numeric',
			minute: '2-digit',
		}).format(targetDate);

		const fullDateTime = new Intl.DateTimeFormat(locale, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		}).format(targetDate);

		let result = '';

		if (diffSec < 5 && !isFuture) result = 'just now';
		else if (diffSec < 60 && withSeconds)
			result = isFuture
				? `in ${diffSec} second${diffSec !== 1 ? 's' : ''}`
				: `${diffSec} second${diffSec !== 1 ? 's' : ''} ago`;
		else if (diffMin < 60)
			result = isFuture
				? `in ${diffMin} minute${diffMin !== 1 ? 's' : ''}`
				: `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
		else if (diffHr < 6)
			result = isFuture
				? `in ${diffHr} hour${diffHr !== 1 ? 's' : ''}`
				: `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
		else if (isSameDay) result = `Today at ${timeOnly}`;
		else if (isYesterday) result = `Yesterday at ${timeOnly}`;
		else if (isTomorrow) result = `Tomorrow at ${timeOnly}`;
		else if (forceRelative)
			result = isFuture
				? `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`
				: `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
		else result = fullDateTime;

		return lowercase ? result.toLowerCase() : result;
	}, [targetDate, now, locale, withSeconds, forceRelative, lowercase]);

	const timeProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLTimeElement>
	>({}, props, className);

	return (
		<time
			suppressHydrationWarning
			dateTime={targetDate?.toISOString() ?? ''}
			{...timeProps}
		>
			{formatted}
		</time>
	);
}
