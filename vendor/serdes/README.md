# @md-oss/serdes

Serializer/Deserializer for JSON, YAML, TOML, MessagePack, and CBOR for the monorepo.

## Usage

```typescript
import {
	deserialize,
	serializeJson,
	parseJson,
	parseToml,
	parseYaml,
	serialize,
	stringifyJson,
} from "@md-oss/serdes";

const payload = { id: 1, createdAt: new Date(), big: 42n };

const json = stringifyJson(payload);
const parsed = parseJson<typeof payload>(json);

const yaml = serialize("yaml", payload) as string;
const yamlValue = parseYaml(yaml);

const toml = serialize("toml", { app: { name: "md-oss" } }) as string;
const tomlValue = parseToml(toml);

const msgpack = serialize("messagepack", payload) as Uint8Array;
const fromMessagePack = deserialize<typeof payload>("messagepack", msgpack);

const cbor = serialize("cbor", payload) as Uint8Array;
const fromCbor = deserialize<typeof payload>("cbor", cbor);

const transportSafe = serializeJson(payload); // Date and bigint become JSON-safe
```

## Formats

- json
- yaml
- toml
- messagepack (alias: msgpack)
- cbor
