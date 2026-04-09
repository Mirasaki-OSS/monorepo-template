import {
	DEFAULT_CURRENCY,
	DEFAULT_NULL_DISPLAY,
	formatInterval,
	formatPrice,
	normalizeCurrencyCode,
} from '../formatters';
import { toDateFromUnixSeconds } from './time';

type SubscriptionItemLike = {
	id: string;
	quantity?: number | null;
	current_period_end?: number | null;
	price: {
		id: string;
		nickname?: string | null;
		currency?: string | null;
		unit_amount?: number | null;
		recurring?: {
			interval?: string | null;
			interval_count?: number | null;
		} | null;
	};
};

type SubscriptionItemsLike = {
	has_more: boolean;
	data: SubscriptionItemLike[];
};

type ResolvedSubscriptionItem = {
	id: string;
	priceId: string;
	nickname: string | null;
	unitAmount: number | null;
	currency: string;
	quantity: number;
	priceLabel: string;
	billingIntervalLabel: string;
	currentPeriodEnd: Date | null;
};

const resolveSubscriptionItems = (
	items: SubscriptionItemsLike
): ResolvedSubscriptionItem[] => {
	if (items.has_more) {
		console.warn(
			'Warning: More subscription items exist than were retrieved. Only the first page of items will be processed.'
		);
	}

	return items.data.map((item) => {
		const itemCurrency = normalizeCurrencyCode(item.price.currency);
		const itemUnitAmount = item.price.unit_amount ?? null;
		const itemQuantity = item.quantity ?? 1;
		const itemInterval = item.price.recurring?.interval;
		const itemIntervalCount = item.price.recurring?.interval_count ?? 1;
		const itemCurrentPeriodEnd = toDateFromUnixSeconds(item.current_period_end);
		return {
			id: item.id,
			priceId: item.price.id,
			nickname: item.price.nickname ?? null,
			unitAmount: itemUnitAmount,
			currency: itemCurrency,
			quantity: itemQuantity,
			priceLabel: formatPrice(itemUnitAmount, { currency: itemCurrency }),
			billingIntervalLabel: formatInterval(itemInterval, itemIntervalCount),
			currentPeriodEnd: itemCurrentPeriodEnd,
		};
	});
};

type CouponLike = {
	currency?: string | null;
	percent_off?: number | null;
	amount_off?: number | null;
};

const resolveDiscountLabel = (
	coupon: CouponLike | null,
	fallbackCurrency?: string | null
): string => {
	if (!coupon) return DEFAULT_NULL_DISPLAY;
	if (coupon.percent_off != null) return `${coupon.percent_off}% off`;
	if (coupon.amount_off != null) {
		const currency = normalizeCurrencyCode(
			coupon.currency ?? fallbackCurrency ?? DEFAULT_CURRENCY
		);
		return `${formatPrice(coupon.amount_off, { currency })} off`;
	}
	return DEFAULT_NULL_DISPLAY;
};

export { resolveDiscountLabel, resolveSubscriptionItems };
