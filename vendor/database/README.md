# @md-oss/database

Query utilities for database adapters, including typed pagination helpers.

## Usage

```typescript
import { withPagination } from '@md-oss/database';

const pagedQuery = withPagination(dynamicQuery, {
	page: 2,
	pageSize: 25,
});
```

The helper applies limit and offset on any query builder that exposes:

- limit(number)
- offset(number)

### Zod Schema

```typescript
import {
	defaultPaginationOptions,
	paginationOptionsSchema,
} from '@md-oss/database/pagination';

const options = paginationOptionsSchema.parse({
	page: '1',
	pageSize: '20',
});
```
