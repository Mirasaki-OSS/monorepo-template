import { type LucideProps, Moon, Sun } from 'lucide-react';

const defaultThemes = ['light', 'dark', 'system'] as const;
const defaultThemesNoSystem = defaultThemes.filter(
	(theme) => theme !== 'system'
);
type DefaultTheme = (typeof defaultThemes)[number];
type DefaultThemeNoSystem = Exclude<DefaultTheme, 'system'>;

const defaultTheme: DefaultTheme = 'system';

const themeIconMapping: Record<
	DefaultTheme,
	(props: LucideProps) => React.ReactNode
> = {
	light: (props) => <Sun {...props} />,
	dark: (props) => <Moon {...props} />,
	system: (props) => <Sun className="opacity-50" {...props} />,
};

const themeLabelMapping: Record<DefaultTheme, string> = {
	light: 'Switch to dark mode',
	dark: 'Switch to light mode',
	system: 'Toggle theme',
};

const isDefaultTheme = (value: string | undefined): value is DefaultTheme =>
	!!value && defaultThemes.includes(value as DefaultTheme);

const nextTheme = (
	current: string | undefined,
	allowSystem: boolean = true,
	defaultValue: DefaultTheme = defaultTheme
): DefaultTheme => {
	const themes = allowSystem ? defaultThemes : defaultThemesNoSystem;
	const index = isDefaultTheme(current)
		? themes.indexOf(current as DefaultThemeNoSystem)
		: -1;
	const next = themes[(index + 1) % themes.length] ?? defaultValue;

	if (!allowSystem && next === 'system') {
		return themes[index + 2 >= themes.length ? 0 : index + 2] ?? defaultValue;
	}

	return next;
};

const themeLabel = (theme: string | undefined) => {
	const current = isDefaultTheme(theme) ? theme : 'system';
	return themeLabelMapping[current] ?? themeLabelMapping.system;
};

const ThemeIcon = (
	props: { theme: string | undefined } & LucideProps
): React.ReactNode => {
	const { theme, ...rest } = props;
	const current = isDefaultTheme(theme) ? theme : 'system';
	const Icon = themeIconMapping[current];
	return <Icon {...rest} />;
};

export {
	type DefaultTheme,
	defaultTheme,
	defaultThemes,
	nextTheme,
	ThemeIcon,
	themeIconMapping,
	themeLabel,
	themeLabelMapping,
};
