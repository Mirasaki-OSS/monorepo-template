'use client';

import { useIsTouchDevice } from '@md-oss/design-system/hooks/use-touch';
import { createContext, type PropsWithChildren, useContext } from 'react';

const TouchContext = createContext<boolean | undefined>(undefined);
const useTouchContext = () => useContext(TouchContext);

const TouchContextProvider = (props: PropsWithChildren) => {
	const [isTouch] = useIsTouchDevice();

	return <TouchContext.Provider value={isTouch} {...props} />;
};

export { TouchContextProvider, useTouchContext };
