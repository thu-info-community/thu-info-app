// AI SDK Core uses web streams, not Node streams. Run before its module is loaded.
// RN's existing readable-stream polyfill only installs ReadableStream.
import {ReadableStream, WritableStream, TransformStream} from "web-streams-polyfill/ponyfill/es6";
import {TextEncoder, TextDecoder} from "text-encoding";

const environment = globalThis as unknown as Record<string, unknown>;
for (const [name, implementation] of Object.entries({
	ReadableStream,
	WritableStream,
	TransformStream,
	TextEncoder,
	TextDecoder,
})) {
	if (!environment[name]) {
		environment[name] = implementation;
	}
}
