import type {
	ClientComponentData,
	ClientComponentOptions,
	ClientComponent as ClientComponentType,
	ClientComponentWithCooldown,
} from './types';

const defineComponent = <TData extends ClientComponentData>(
	component: ClientComponentOptions<TData>
): ClientComponent<TData> => new ClientComponent(component);

class ClientComponent<TData extends ClientComponentData>
	implements ClientComponentType<TData>
{
	public id: string;
	public data: TData;
	public execute: ClientComponentOptions<TData>['execute'];
	public cooldown: ClientComponentOptions<TData>['cooldown'] | null;
	public autocompletes: NonNullable<
		ClientComponentOptions<TData>['autocompletes']
	>;

	public static create<TData extends ClientComponentData>(
		options: ClientComponentOptions<TData>
	): ClientComponent<TData> {
		return new ClientComponent(options);
	}

	public hasCooldown(): this is ClientComponentWithCooldown<TData> {
		return this.cooldown !== null && typeof this.cooldown !== 'undefined';
	}

	constructor(options: ClientComponentOptions<TData>) {
		this.id = options.id;
		this.data = options.data;
		this.execute = options.execute;
		this.cooldown = options.cooldown ?? null;
		this.autocompletes = options.autocompletes ?? {};
	}
}

export { ClientComponent, defineComponent };
